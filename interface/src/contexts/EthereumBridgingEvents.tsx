import React, { useCallback, useEffect, useState } from "react";
import { getStarknet } from "@argent/get-starknet"
import { utils, ethers } from 'ethers';
import { ERC721Abi } from './ERC721.abi';
import { useBlockNumber, useContractCalls, useEthers } from '@usedapp/core';
import GatewayArtifact from '../ethereum_artifacts/goerli/Gateway.json';
import { useStarknet } from '../hooks/useStarknet';
import { useEthereumERC721 } from "../hooks/useEthereumERC721";
import { useStarknetERC721 } from '../hooks/useStarknetERC721';
import { LogDescription } from "@ethersproject/abi";

interface BridgingEvent {
	raw: any;
	ld: LogDescription;
}

export interface EthereumBridgingEventsContextInterface {
	bridgingEvents: BridgingEvent[]
}

export const EthereumBridgingEventsContext = React.createContext<EthereumBridgingEventsContextInterface>({
	bridgingEvents: []
})

export const EthereumBridgingEventsContextProvider: React.FC<React.PropsWithChildren<unknown>> = (props: React.PropsWithChildren<unknown>): React.ReactElement => {
	const [ethereumBridgingEventsContextState, setEthereumBridgingEventsContextState] = useState({
		bridgingEvents: []
	})
	const { library } = useEthers();
	const { account } = useStarknet();
	const blockNumber = useBlockNumber();
	const erc721 = useEthereumERC721();
	const serc721 = useStarknetERC721();

	const [snapshotBlock, setSnapshotBlock] = useState(null);

	useEffect(() => {
		if (blockNumber && snapshotBlock === null) {
			setSnapshotBlock(blockNumber);
		}
	}, [blockNumber, snapshotBlock])

	useEffect(() => {
		if (library && (blockNumber - snapshotBlock) >= 5) {
			try {
				const GatewayContract = new ethers.Contract(GatewayArtifact.address, GatewayArtifact.abi, library);

				setTimeout(async () => {
					try {
						if (account && erc721.address && serc721.address) {
							const filter = GatewayContract.filters.BridgeToStarknet(erc721.address, serc721.address, account);
							const logs = (await library.getLogs({
								...filter,
								fromBlock: 0
							})).map(l => ({
								raw: l,
								ld: GatewayContract.interface.parseLog(l)
							}));
							setEthereumBridgingEventsContextState({
								bridgingEvents: logs
							})
						}
					} catch (e) {
					}
					setSnapshotBlock(blockNumber);
				}, 0)
			} catch (e) {
			}
		}

	}, [library, account, erc721.address, serc721.address, blockNumber, snapshotBlock])

	return <EthereumBridgingEventsContext.Provider value={{
		...ethereumBridgingEventsContextState,
	}}>
		{props.children}
	</EthereumBridgingEventsContext.Provider>
}