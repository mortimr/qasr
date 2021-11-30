import { ChainId, getExplorerAddressLink, useEthers, useLookupAddress, useContractCalls } from '@usedapp/core';
import { useMemo, useState } from 'react';
import makeBlockie from 'ethereum-blockies-base64';
import { useEthereumERC721 } from '../hooks/useEthereumERC721';
import useEffect from 'react';
import { ethers } from 'ethers';
import {
	LinkOutlined,
	CloseOutlined
} from '@ant-design/icons';
import { Button } from 'antd';
import { useStarknetERC721 } from '../hooks/useStarknetERC721';
import styled from 'styled-components';
import { useEthereumGateway } from '../hooks/useEthereumGateway';

const EthereumIcon = () => {
	const ethers = useEthers()
	const blockies = useMemo(() => makeBlockie(ethers.account || '0x0000000000000000000000000000000000000000'), [ethers.account])
	const ens = useLookupAddress()

	return <div
		style={{
			marginLeft: 16,
			marginTop: 16,
			marginRight: 16,
			height: 60,
			borderRadius: 16,
			padding: 12,
			backgroundColor: '#716b9422',
			justifyContent: 'center',
			alignItems: 'center',
			display: 'flex',
			flexDirection: 'row'
		}}
	>
		<img
			style={{
				borderRadius: 16,
				height: 36
			}}
			src={blockies} />
		<span
			style={{
				fontSize: 16,
				fontWeight: 'bold',
				marginLeft: 16,
				color: '#716b94',
			}}
		>{ens || ethers.account}</span>
		<div
			style={{
				width: '100%',
				height: 36,
				display: 'flex',
				justifyContent: 'flex-end',
				alignItems: 'center'
			}}
		>
			<LinkOutlined
				style={{
					color: '#716b94',
					fontSize: 20,
					cursor: 'pointer'
				}}
				onClick={() => {
					window.open(getExplorerAddressLink(ethers.account, ChainId.Goerli), '_blank')
				}}
			/>
			<CloseOutlined
				style={{
					color: '#716b94',
					fontSize: 20,
					cursor: 'pointer',
					marginLeft: 8
				}}
				onClick={() => {
					ethers.deactivate()
				}}
			/>
		</div>
	</div>
}

const ContractTitleAndSymbol = () => {
	const erc721 = useEthereumERC721();

	return <div>
		<span style={{
			fontSize: 20,
			color: '#716b94',
			display: 'block'
		}}>{erc721.name} <span
			style={{
				fontWeight: 'bold',
				fontSize: 14
			}}
		>${erc721.symbol}</span>
		</span>
		<span
			style={{
				color: '#716b94',
				cursor: 'pointer',
				fontSize: 14
			}}
			onClick={() => {
				window.open(getExplorerAddressLink(erc721.address, ChainId.Goerli), '_blank')
			}}
		>{erc721.address} <LinkOutlined /></span>
	</div>
}

const StyledButton = styled(Button) <{ disabled: boolean }>`
	${props => props.disabled ? `` : `
	&.ant-btn-primary {
		background: #716b94;
		border-color: #716b94;
	}
	`}
`

const ERC721Displayer = ({ id }: { id: string }) => {
	const erc721 = useEthereumERC721()
	const serc721 = useStarknetERC721();
	const gateway = useEthereumGateway();
	const [_tokenUri] = useContractCalls([{
		address: erc721.address,
		abi: erc721.abi,
		method: 'tokenURI',
		args: [ethers.BigNumber.from(id)]
	}]);
	const [clicked, setClicked] = useState(false);

	const tokenUri = _tokenUri ? (_tokenUri[0] !== '' ? _tokenUri[0] : null) : null;

	return <div
		style={{
			width: 200,
			backgroundColor: '#716b9422',
			margin: 12,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start',
			borderRadius: 16
		}}
	>
		{
			tokenUri

				?
				<img
					style={{
						width: 200,
						height: 200,
						borderRadius: 16
					}}
					src={'https://ipfs.io/ipfs/QmPbxeGcXhYQQNgsC6a36dDyYUcHgMLnGKnF8pVFmGsvqi'} />

				:
				<div
					style={{
						width: 200,
						height: 200,
						borderRadius: 16,
						backgroundColor: '#716b9422',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<span
						style={{
							fontSize: 150,
							fontWeight: 'bolder',
							color: '#716b9444'
						}}
					>?</span>
				</div>
		}
		<span
			style={{
				fontSize: 16,
				marginTop: 8,
				color: '#716b94'
			}}
		>#{id}</span>
		<div
			style={{
				width: '100%',
				marginBottom: 16,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			{
				gateway.needsApproval === null

					? <StyledButton
						style={{
							width: '85%',
							borderRadius: 8,

						}}
						loading={true}
						type={'primary'}
						disabled={
							serc721.valid !== true
						}
					>Bridge</StyledButton>

					: (gateway.needsApproval === false)

						? <StyledButton
							style={{
								width: '85%',
								borderRadius: 8,

							}}
							type={'primary'}
							disabled={
								serc721.valid !== true
							}
							loading={(gateway.bridgeState.status === 'Mining' && clicked) || clicked}
							onClick={() => {
								gateway.bridge(id)
								setClicked(true)
							}}
						>Bridge</StyledButton>

						: <StyledButton
							style={{
								width: '85%',
								borderRadius: 8,

							}}
							type={'primary'}
							loading={gateway.approveState.status === 'Mining'}
							disabled={
								serc721.valid !== true
							}
							onClick={() => gateway.approve()}
						>Approve</StyledButton>
			}
		</div>

	</div>

}

export const EthereumSection = () => {
	const erc721 = useEthereumERC721();

	if (erc721.valid === null) {
		return <p>LOADING</p>
	}

	if (erc721.valid === false) {

		return <div
			style={{
				justifyContent: 'center',
				alignItems: 'center',
				display: 'flex',
				flexDirection: 'column',
				width: '80%',
				height: '100%',
				color: '#716b94',
				textAlign: 'center'
			}}
		>
			<h1
				style={{
					color: '#716b94',
				}}
			>Invalid Ethereum ERC721 Contract</h1>
			<h3
				style={{
					color: '#716b94',
				}}
			>The provided contract <span style={{ fontWeight: 'bold' }}>{erc721.address}</span> is not an ERC721 contract</h3>
		</div>
	}

	return <div
		style={{
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'column'
		}}
	>
		<EthereumIcon />
		<div
			style={{
				width: '100%',
				height: '100%',
				overflow: 'scroll',
				padding: 16,
			}}
		>
			<ContractTitleAndSymbol />
			<div
				style={{
					width: '100%',
					display: 'flex',
					flexDirection: 'row',
					flexWrap: 'wrap'
				}}
			>
				{
					erc721.ownedTokens ? erc721.ownedTokens.map((tokenId: string, idx: number) => <ERC721Displayer id={tokenId} key={tokenId} />) : null
				}
			</div>
		</div>
	</div>
}