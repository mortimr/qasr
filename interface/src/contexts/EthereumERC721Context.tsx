import React, { useCallback, useEffect, useState } from "react";
import { getStarknet } from "@argent/get-starknet"
import { utils, ethers } from 'ethers';
import { ERC721Abi } from './ERC721.abi';
import { useBlockNumber, useContractCalls, useEthers } from '@usedapp/core';

export interface EthereumERC721ContextInterface {
	address: string;
	abi: utils.Interface;
	name: string;
	symbol: string;
	valid: boolean;
	ownedTokens: string[]
}

export const EthereumERC721Context = React.createContext<EthereumERC721ContextInterface>({
	address: null,
	abi: null,
	name: null,
	symbol: null,
	valid: null,
	ownedTokens: null
})

export const EthereumERC721ContextProvider: React.FC<React.PropsWithChildren<{ address: string }>> = (props: React.PropsWithChildren<{ address: string }>): React.ReactElement => {
	const [ethereumERC721ContextState] = useState({
		address: props.address,
		abi: new utils.Interface(ERC721Abi),
	})
	const [validContract, setValidContract] = useState(null);
	const [ownedTokens, setOwnedTokens] = useState(null);

	const { library, account } = useEthers();
	const blockNumber = useBlockNumber();

	const [snapshotBlock, setSnapshotBlock] = useState(null);

	useEffect(() => {
		if (blockNumber && snapshotBlock === null) {
			setSnapshotBlock(blockNumber);
		}
	}, [blockNumber, snapshotBlock])

	useEffect(() => {
		try {
			const ERC721Contract = new ethers.Contract(props.address, ERC721Abi, library);

			setTimeout(async () => {
				if (props.address && library) {
					try {
						await ERC721Contract.name();
						await ERC721Contract.symbol();
						setValidContract(true);
					} catch (e) {
						setValidContract(false);
					}
				}
			}, 0)
		} catch (e) {
			setValidContract(false);
		}

	}, [library, props.address])

	useEffect(() => {
		try {
			const ERC721Contract = new ethers.Contract(props.address, ERC721Abi, library);

			setTimeout(async () => {
				try {
				if (props.address && library && validContract && ((blockNumber - snapshotBlock) >= 5 || ownedTokens === null)) {
					const filterTo = ERC721Contract.filters.Transfer(null, account)
					const filterFrom = ERC721Contract.filters.Transfer(account, null)

					const logsTo = (await library.getLogs({
						...filterTo,
						fromBlock: 0
					})).map(l => ({ ...l, parsed: ERC721Contract.interface.parseLog(l) }))
					const logsFrom = (await library.getLogs({
						...filterFrom,
						fromBlock: 0
					})).map(l => ({ ...l, parsed: ERC721Contract.interface.parseLog(l) }))

					const sortedLogs = [...logsTo, ...logsFrom].sort((a, b) => {
						if (a.blockNumber === b.blockNumber) {
							if (a.transactionIndex === b.transactionIndex) {
								return a.logIndex - b.logIndex;
							} else {
								return a.transactionIndex - b.transactionIndex;
							}
						} else {
							return a.blockNumber - b.blockNumber;
						}
					})

					const ownershipMap = {};

					for (const log of sortedLogs) {
						if (log.parsed.args.from.toLowerCase() === account.toLowerCase()) {
							ownershipMap[log.parsed.args.tokenId.toString()] = false;
						} else if (log.parsed.args.to.toLowerCase() === account.toLowerCase()) {
							ownershipMap[log.parsed.args.tokenId.toString()] = true;
						}
					}

					const ownedERC721Tokens = [];

					for (const key of Object.keys(ownershipMap)) {
						if (ownershipMap[key] === true) {
							ownedERC721Tokens.push(key)
						}
					}

					setOwnedTokens(ownedERC721Tokens);
					setSnapshotBlock(blockNumber);
				}
			} catch (e) {
				setValidContract(false);
			}
			}, 0);
		} catch (e) {
			setValidContract(false);
		}

	}, [validContract, library, account, props.address, blockNumber, snapshotBlock, ownedTokens])

	const [_name, _symbol] = useContractCalls([
		validContract === true ? {
			abi: ethereumERC721ContextState.abi,
			address: ethereumERC721ContextState.address,
			method: 'name',
			args: []
		} : false,
		validContract === true ? {
			abi: ethereumERC721ContextState.abi,
			address: ethereumERC721ContextState.address,
			method: 'symbol',
			args: []
		} : false
	])

	const name = _name ? _name[0] : null;
	const symbol = _symbol ? _symbol[0] : null;

	return <EthereumERC721Context.Provider value={{
		...ethereumERC721ContextState,
		valid: validContract,
		ownedTokens,
		name,
		symbol
	}}>
		{props.children}
	</EthereumERC721Context.Provider>
}