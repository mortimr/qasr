import React, { useCallback, useEffect, useState } from "react";
import {  ethers } from 'ethers';
import { useContractFunction, useEthers, TransactionStatus } from '@usedapp/core';
import { useEthereumERC721 } from '../hooks/useEthereumERC721';
import { useStarknet } from "../hooks/useStarknet";
import { getSelectorFromName } from "starknet/dist/utils/starknet";
import { BigNumber } from 'ethers'
import { useStarknetERC721 } from '../hooks/useStarknetERC721';
import { useAsyncState } from "../hooks/useAsyncState";
import GatewayArtifact from '../ethereum_artifacts/goerli/Gateway.json';
import { Contract } from '@usedapp/core/node_modules/ethers';
import { useEthereumGateway } from '../hooks/useEthereumGateway';

export interface StarknetWithdrawEvent {
	l1Address: string;
	l2Address: string;
	tokenId: string;
	account: string; // l1
}

export interface StarknetWithdrawEventsContextInterface {
	events: StarknetWithdrawEvent[];
	claim: (we: StarknetWithdrawEvent) => void;
	claimState: TransactionStatus;
}

export const StarknetWithdrawEventsContext = React.createContext<StarknetWithdrawEventsContextInterface>({
	events: null,
	claim: () => {},
	claimState: null
})

export const StarknetWithdrawEventsContextProvider: React.FC<React.PropsWithChildren<unknown>> = (props: React.PropsWithChildren<unknown>): React.ReactElement => {

	const [events, setEvents] = useAsyncState(null);
	const gateway = useEthereumGateway();
	const [total, setTotal] = useState(0);
	const [checked, setChecked] = useAsyncState(0);
	const starknet = useStarknet();
	const erc721 = useEthereumERC721();
	const serc721 = useStarknetERC721();
	const { account, library } = useEthers();

	const [timer, setTimer] = useState(Date.now());

	useEffect(() => {
		const tid = setTimeout(() => {
			setTimer(Date.now())
		}, 5000);

		return () => {
			clearTimeout(tid);
		}
	}, [timer])

	useEffect(() => {
		if (!events.fetching && erc721.address && serc721.address && starknet.starknet && account) {
			events.setFetching();
			setTimeout(async () => {
				try {
					const bridgeBackEventCount = await starknet.starknet.provider.callContract(
						{
							contract_address: starknet.gateway,
							entry_point_selector: getSelectorFromName('get_bridge_back_event_count'),
							calldata: [
								BigNumber.from(erc721.address).toString(),
								BigNumber.from(serc721.address).toString(),
								BigNumber.from(account).toString()
							]
						}
					);
					const totalCount = parseInt(bridgeBackEventCount.result[0].slice(2), 16);
					setTotal(totalCount);
				} catch (e) {

				}
				await new Promise(ok => setTimeout(ok, 3000));
				events.setNotFetching();
			}, 0);
		}
	}, [events, account, timer, erc721.address, serc721.address, starknet.gateway, starknet.starknet])

	useEffect(() => {
		if (!checked.fetching && erc721.address && serc721.address && starknet.starknet && account) {
			checked.setFetching();
			setTimeout(async () => {
				const GatewayContract = new ethers.Contract(GatewayArtifact.address, GatewayArtifact.abi, library);
				let progressive = false;
				if (events.state === null) {
					progressive = true;
				}
				const eventsFound: StarknetWithdrawEvent[] = [];
				for (let idx = 0; idx < total; ++idx) {
					try {
						const bridgeBackEvent = await starknet.starknet.provider.callContract(
							{
								contract_address: starknet.gateway,
								entry_point_selector: getSelectorFromName('get_bridge_back_event'),
								calldata: [
									BigNumber.from(erc721.address).toString(),
									BigNumber.from(serc721.address).toString(),
									BigNumber.from(account).toString(),
									idx.toString()
								]
							}
						);

						const tokenId = bridgeBackEvent.result[0];

						const messageExists = await GatewayContract.bridgeFromStarknetAvailable(erc721.address, serc721.address, tokenId, { from: account });

						if (messageExists) {
							eventsFound.push({
								l1Address: erc721.address,
								l2Address: serc721.address,
								tokenId: BigNumber.from(tokenId).toString(),
								account
							})
							if (progressive) {
								setEvents(eventsFound);
							}
						}

						console.log('ID IS ', bridgeBackEvent.result[0], messageExists)

					} catch (e) {

					}
				}
				if (!progressive) {
					setEvents(eventsFound)
				}
				await new Promise(ok => setTimeout(ok, 3000));
				checked.setNotFetching();
			}, 0);
		}
	}, [events, account, erc721.address, serc721.address, starknet.gateway, starknet.starknet, checked, total, setChecked, library, setEvents])

	const {send: claimSend, state: claimState} = useContractFunction(new Contract(gateway.address, gateway.gatewayAbi, library), 'bridgeFromStarknet', {
		transactionName: 'Claim'
	});
	const claim = useCallback((we: StarknetWithdrawEvent) => {
		claimSend(we.l1Address, we.l2Address, we.tokenId)
	}, [claimSend]);

	return <StarknetWithdrawEventsContext.Provider value={{
		events: events.state || [],
		claim,
		claimState
	}}>
		{props.children}
	</StarknetWithdrawEventsContext.Provider>
}