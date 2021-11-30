import React, { useCallback, useEffect, useState } from "react";
import { getStarknet } from "@argent/get-starknet"
import { utils,  } from 'ethers';
import { ERC721Abi } from './ERC721.abi';
import { TransactionStatus, useBlockNumber, useContractCall, useContractCalls, useContractFunction, useEthers } from '@usedapp/core';
import gatewayArtifact from '../ethereum_artifacts/goerli/Gateway.json';
import { useEthereumERC721 } from '../hooks/useEthereumERC721';
import { Contract } from "@usedapp/core/node_modules/ethers";
import { useStarknetERC721 } from '../hooks/useStarknetERC721';
import { useStarknet } from '../hooks/useStarknet';

export interface EthereumGatewayContextInterface {
	address: string;
	abi: utils.Interface;
	needsApproval: boolean;
	approve: () => void;
	approveState: TransactionStatus;
	bridge: (tokenId: string) => void;
	bridgeState: TransactionStatus;
}

export const EthereumGatewayContext = React.createContext<EthereumGatewayContextInterface>({
	address: null,
	abi: null,
	needsApproval: null,
	approve: () => {},
	approveState: null,
	bridge: () => {},
	bridgeState: null
})

export const EthereumGatewayContextProvider: React.FC<React.PropsWithChildren<unknown>> = (props: React.PropsWithChildren<unknown>): React.ReactElement => {
	const ethers = useEthers();
	const erc721 = useEthereumERC721();
	const serc721 = useStarknetERC721();
	const starknet = useStarknet();

	const [EthereumGatewayContextState] = useState({
		address: gatewayArtifact.address,
		abi: new utils.Interface(ERC721Abi),
	})

	const approvedForAll = useContractCall({
		method: 'isApprovedForAll',
		args: [ethers.account, gatewayArtifact.address],
		address: erc721.address,
		abi: erc721.abi
	})

	const {send: approveSend, state: approveState} = useContractFunction(new Contract(erc721.address, erc721.abi, ethers.library), 'setApprovalForAll', {
		transactionName: 'Approve'
	});

	const approve = useCallback(() => {
		approveSend(gatewayArtifact.address, true)
	}, [approveSend])

	const {send: bridgeSend, state: bridgeState} = useContractFunction(new Contract(gatewayArtifact.address, gatewayArtifact.abi, ethers.library), 'bridgeToStarknet', {
		transactionName: 'Bridge NFT to Starknet'
	});

	const bridge = useCallback((tokenId: string) => {
		bridgeSend(erc721.address, serc721.address, tokenId, starknet.account)
	}, [bridgeSend, erc721.address, serc721.address, starknet.account])


	return <EthereumGatewayContext.Provider value={{
		...EthereumGatewayContextState,
		needsApproval: approvedForAll ? !approvedForAll[0] : null,
		approve,
		approveState: approveState,
		bridge,
		bridgeState: bridgeState
	}}>
		{props.children}
	</EthereumGatewayContext.Provider>
}