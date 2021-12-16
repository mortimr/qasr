import React, { useCallback, useEffect, useState } from "react";
import { getStarknet } from "@argent/get-starknet"
import { utils, ethers } from 'ethers';
import { ERC721Abi } from './ERC721.abi';
import { useBlockNumber, useContractCalls, useEthers } from '@usedapp/core';
import { useEthereumERC721 } from '../hooks/useEthereumERC721';
import { useStarknet } from "../hooks/useStarknet";
import { getSelectorFromName } from "starknet/dist/utils/starknet";
import { BigNumber } from 'ethers'
import { useAsyncState, AsyncState } from '../hooks/useAsyncState';

export interface StarknetERC721ContextInterface {
	address: string;
	l1_address: string;
	valid: boolean;
	ownedTokens: string[];
	total_supply: BigNumber;
	bridgeBack: (t: string) => void;
}

export const StarknetERC721Context = React.createContext<StarknetERC721ContextInterface>({
	address: null,
	l1_address: null,
	valid: null,
	ownedTokens: null,
	total_supply: null,
	bridgeBack: () => { }
})

const evenHex = (v: string) => v.length % 2 === 1 ? `0x0${v.slice(2)}` : v

const fetching = (...args: AsyncState[]): boolean => {
	return args.map(v => v.fetching).filter(v => v === true).length > 0
}

export const StarknetERC721ContextProvider: React.FC<React.PropsWithChildren<{ address: string }>> = (props: React.PropsWithChildren<{ address: string }>): React.ReactElement => {
	const { account } = useEthers();
	const ethereumErc721 = useEthereumERC721();
	const starknet = useStarknet();
	const [StarknetERC721ContextState] = useState({
		address: props.address
	})
	const [l1_address, setL1Address] = useAsyncState(null);
	const [validContract, setValidContract] = useState(null);
	const [timer, setTimer] = useState(Date.now());
	const [totalSupply, setTotalSupply] = useAsyncState(BigNumber.from(0));
	const [userBalance, setUserBalance] = useAsyncState(0);
	const [ownedTokens, setOwnedTokens] = useAsyncState(null);

	useEffect(() => {
		const tid = setTimeout(() => {
			setTimer(Date.now())
		}, 5000);
		return () => {
			clearTimeout(tid)
		}
	}, [])

	useEffect(() => {
		if (ethereumErc721.valid === true && starknet.starknet && starknet.account && !fetching(totalSupply, userBalance, ownedTokens)) {
			totalSupply.setFetching();
			userBalance.setFetching();
			ownedTokens.setFetching();
			setTimeout(
				async () => {
					let _totalSupply;
					try {
						_totalSupply = await starknet.starknet.provider.callContract(
							{
								contract_address: props.address,
								entry_point_selector: getSelectorFromName('total_supply'),
								calldata: []
							}
						)
						setTotalSupply(BigNumber.from(_totalSupply.result[0]))
					} catch (e) {
						console.warn('Error when retrieving total_supply')
						console.warn(e)
					}
					let _userBalance;
					try {
						_userBalance = await starknet.starknet.provider.callContract(
							{
								contract_address: props.address,
								entry_point_selector: getSelectorFromName('balance_of'),
								calldata: [BigNumber.from(starknet.account).toString()]
							}
						)
					} catch (e) {
						console.warn('Error when retrieving balance_of')
						console.warn(e)
					}

					if (_userBalance.result) {

						const userBalanceParsed = parseInt(_userBalance.result[0].slice(2), 16);
						setUserBalance(userBalanceParsed);
						const progressive = ownedTokens.state === null;

						const tokens: string[] = [];

						for (let idx = 0; idx < userBalanceParsed; ++idx) {
							try {
								const tokenId = await starknet.starknet.provider.callContract(
									{
										contract_address: props.address,
										entry_point_selector: getSelectorFromName('token_of_owner_by_index'),
										calldata: [BigNumber.from(starknet.account).toString(), idx.toString()]
									}
								);
								if (tokenId.result) {
									tokens.push(BigNumber.from(tokenId.result[0]).toString());
									if (progressive) {
										setOwnedTokens(tokens);
									}
								}
							} catch (e) {
								break ;
							}


						}
						if (!progressive) {
							setOwnedTokens(tokens);
						}

					}

					totalSupply.setNotFetching();
					userBalance.setNotFetching();
					ownedTokens.setNotFetching();


				}, 0);
		}
	}, [timer, props.address, starknet.starknet, l1_address, ethereumErc721, starknet.account, totalSupply, setTotalSupply, userBalance, setUserBalance, ownedTokens, setOwnedTokens])

	useEffect(() => {
		if (ethereumErc721.valid === true && starknet.starknet && l1_address.state === null && l1_address.fetching === false) {
			l1_address.setFetching();
			setTimeout(async () => {
				try {
					console.log('CALLING GET L1 ADDRESS');
					const l1AddressResult = await starknet.starknet.provider.callContract(
						{
							contract_address: props.address,
							entry_point_selector: getSelectorFromName('get_l1_address'),
							calldata: []
						}
					)
					setL1Address(ethers.utils.getAddress(l1AddressResult.result[0]))
				} catch (e) {
					setValidContract(false);
				}
				l1_address.setNotFetching();
			}, 0);
		}
	}, [ethereumErc721, props.address, starknet.starknet, l1_address, setL1Address]);

	useEffect(() => {
		try {
			if (ethereumErc721.address && l1_address.state) {
				setValidContract(l1_address.state === ethers.utils.getAddress(ethereumErc721.address))
			}
		} catch (e) {
			setValidContract(false);
		}
	}, [ethereumErc721.address, l1_address])

	const bridgeBack = useCallback(async (tokenId: string) => {
		if (starknet.starknet && l1_address.state && starknet.gateway) {
			const tx = await starknet.starknet.signer.invokeFunction(
				starknet.gateway,
				getSelectorFromName('bridge_to_mainnet'),
				[
					BigNumber.from(l1_address.state).toString(),
					tokenId,
					BigNumber.from(account).toString()
				]
			);
			console.log(tx);
		}
	}, [l1_address.state, account, starknet.gateway, starknet.starknet]);

	return <StarknetERC721Context.Provider value={{
		...StarknetERC721ContextState,
		l1_address: l1_address.state,
		valid: validContract,
		ownedTokens: ownedTokens.state,
		total_supply: totalSupply.state,
		bridgeBack
	}}>
		{props.children}
	</StarknetERC721Context.Provider>
}