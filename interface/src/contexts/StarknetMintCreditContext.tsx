import React, { useCallback, useEffect, useState } from "react";
import { useStarknet } from "../hooks/useStarknet";
import { getSelectorFromName } from "starknet/dist/utils/starknet";
import { BigNumber } from 'ethers'
import { useEthereumBridgingEvents } from '../hooks/useEthereumBridgingEvents';
import { useStarknetERC721 } from '../hooks/useStarknetERC721';

export interface StarknetMintCredit {
	l1Address: string;
	l2Address: string;
	tokenId: string;
	account: string;
}

export interface StarknetMintCreditContextInterface {
	mintCredits: StarknetMintCredit[];
	mint: (mc: StarknetMintCredit) => void;
}

export const StarknetMintCreditContext = React.createContext<StarknetMintCreditContextInterface>({
	mintCredits: null,
	mint: () => { }
})

const unOddHex = (v: string) => v.length % 2 === 1 ? `0x0${v.slice(2)}` : v;

export const StarknetMintCreditContextProvider: React.FC<React.PropsWithChildren<unknown>> = (props: React.PropsWithChildren<unknown>): React.ReactElement => {

	const starknet = useStarknet();
	const serc721 = useStarknetERC721();
	const { bridgingEvents } = useEthereumBridgingEvents();
	const [timer, setTimer] = useState(Date.now());
	const [starknetMintCreditContextState, setStarknetMintCreditContextState] = useState({
		mintCredits: null
	});
	const [lastTimer, setLastTimer] = useState(null);
	const [running, setRunning] = useState(false);

	useEffect(() => {
		const tid = setTimeout(() => {
			setTimer(Date.now())
		}, 5000);
		return () => {
			clearTimeout(tid)
		}
	}, [timer])

	useEffect(() => {
		if (starknet.starknet && starknet.account && starknet.gateway && lastTimer !== timer && !running) {
			setLastTimer(timer);
			setRunning(true);
			setTimeout(
				async () => {
					try {
						if (bridgingEvents.length) {
							let progressive = false;
							if (starknetMintCreditContextState.mintCredits === null) {
								progressive = true;
							}
							const mintCredits: StarknetMintCredit[] = []
							for (const be of bridgingEvents) {
								const mintCredit = await starknet.starknet.provider.callContract(
									{
										contract_address: starknet.gateway,
										entry_point_selector: getSelectorFromName('get_mint_credit'),
										calldata: [
											BigNumber.from(be.ld.args.l1ERC721).toString(),
											BigNumber.from(be.ld.args.tokenId).toString(),
											BigNumber.from(starknet.account).toString()
										]
									}
								);
								if (mintCredit.result) {
									if (unOddHex(mintCredit.result[0]).toLowerCase() === unOddHex(serc721.address).toLowerCase()) {
										mintCredits.push({
											l1Address: unOddHex(be.ld.args.l1ERC721),
											l2Address: unOddHex(serc721.address),
											tokenId: be.ld.args.tokenId.toString(),
											account: starknet.account
										})
									}
									if (progressive === true) {
										setStarknetMintCreditContextState({
											mintCredits
										});
									}
								}
							}
							if (progressive === false) {
								setStarknetMintCreditContextState({
									mintCredits
								});
							}
						} else {
							setStarknetMintCreditContextState({
								mintCredits: []
							});
						}
					} catch (e) {
						console.warn('credit fetch error', e);
					}
					setRunning(false);
				},
				0
			);
		}
	}, [timer, starknet.starknet, starknet.account, bridgingEvents, starknet.gateway, serc721.address, starknetMintCreditContextState.mintCredits, running, lastTimer])

	const mint = useCallback(async (mc: StarknetMintCredit) => {
		if (starknet.starknet) {
			const tx = await starknet.starknet.signer.invokeFunction(
				starknet.gateway,
				getSelectorFromName('consume_mint_credit'),
				[
					BigNumber.from(mc.l1Address).toString(),
					BigNumber.from(mc.l2Address).toString(),
					mc.tokenId,
					BigNumber.from(mc.account).toString()
				]
			);
			console.log(tx);
		}
	}, [starknet.gateway, starknet.starknet]);

	return <StarknetMintCreditContext.Provider value={{
		...starknetMintCreditContextState,
		mint
	}}>
		{props.children}
	</StarknetMintCreditContext.Provider>
}