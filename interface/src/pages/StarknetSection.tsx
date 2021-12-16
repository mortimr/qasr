import { ChainId, getExplorerAddressLink, useEthers, useLookupAddress, useContractCalls } from '@usedapp/core';
import { useMemo, useState } from 'react';
import makeBlockie from 'ethereum-blockies-base64';
import { useStarknet } from '../hooks/useStarknet';
import { useStarknetERC721 } from '../hooks/useStarknetERC721';
import {
	LinkOutlined,
	CloseOutlined
} from '@ant-design/icons';
import { useEthereumERC721 } from '../hooks/useEthereumERC721';
import { useStarknetMintCredits } from '../hooks/useStarknetMintCredits';
import styled from 'styled-components';
import { Button } from 'antd';
import { StarknetMintCredit } from '../contexts/StarknetMintCreditContext';
import { ethers } from 'ethers';
import { useTokenURI } from '../hooks/useTokenURI';

const StarknetIcon = () => {
	const starknet = useStarknet()
	const blockies = useMemo(() => makeBlockie(starknet.account || '0x0000000000000000000000000000000000000000'), [starknet.account])

	return <div
		style={{
			marginLeft: 16,
			marginTop: 16,
			marginRight: 16,
			height: 60,
			borderRadius: 16,
			padding: 12,
			backgroundColor: '#fb4c4322',
			justifyContent: 'center',
			alignItems: 'center',
			display: 'flex',
			flexDirection: 'row'
		}}
	>
		<div
			style={{
				width: '100%',
				height: 36,
				display: 'flex',
				justifyContent: 'flex-start',
				alignItems: 'center'
			}}
		>
			<CloseOutlined
				style={{
					color: '#fb4c43',
					fontSize: 20,
					cursor: 'pointer',
					marginRight: 8
				}}
				onClick={() => {
					starknet.disable()
				}}
			/>
			<LinkOutlined
				style={{
					color: '#fb4c43',
					fontSize: 20,
					cursor: 'pointer'
				}}
				onClick={() => {
					window.open(`https://voyager.online/contract/${starknet.account}`, '_blank')
				}}
			/>
		</div>
		<span
			style={{
				fontSize: 16,
				fontWeight: 'bold',
				marginRight: 16,
				color: '#fb4c43',
			}}
		>{starknet.account}</span>
		<img
			style={{
				borderRadius: 16,
				height: 36
			}}
			src={blockies} />
	</div>
}

const BridgedContractTitleAndSymbol = () => {
	const erc721 = useEthereumERC721();
	const serc721 = useStarknetERC721();

	return <div>
		<span style={{
			fontSize: 20,
			color: '#fb4c43',
			display: 'block'
		}}>Bridged {erc721.name} <span
			style={{
				fontWeight: 'bold',
				fontSize: 14
			}}
		>${erc721.symbol}</span>
		</span>
		<span
			style={{
				color: '#fb4c43',
				cursor: 'pointer',
				fontSize: 14
			}}
			onClick={() => {
				window.open(`https://voyager.online/contract/${serc721.address}`, '_blank')
			}}
		>{serc721.address} <LinkOutlined /></span>
	</div>
}

const StyledButton = styled(Button) <{ disabled: boolean }>`
	${props => props.disabled ? `` : `
	&.ant-btn-primary {
		background: #fb4c43;
		border-color: #fb4c43;
	}
	`}
`

const MintableERC721Displayer = ({ mc }: { mc: StarknetMintCredit }) => {
	const erc721 = useEthereumERC721()
	const serc721 = useStarknetERC721();
	const mintCredits = useStarknetMintCredits();
	// const gateway = useEthereumGateway();
	const [_tokenUri] = useContractCalls([{
		address: erc721.address,
		abi: erc721.abi,
		method: 'tokenURI',
		args: [ethers.BigNumber.from(mc.tokenId)]
	}]);
	const [clicked, setClicked] = useState(false);

	const tokenUri = _tokenUri ? (_tokenUri[0] !== '' ? _tokenUri[0] : null) : null;
	const tokenUriData = useTokenURI(tokenUri);

	return <div
		style={{
			width: 200,
			backgroundColor: '#fb4c4322',
			margin: 12,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start',
			borderRadius: 16
		}}
	>
		{
			tokenUriData.status === 'READY'

				?
				<img
					style={{
						width: 200,
						height: 200,
						borderRadius: 16
					}}
					src={tokenUriData.image} />

				:
				<div
					style={{
						width: 200,
						height: 200,
						borderRadius: 16,
						backgroundColor: '#fb4c4322',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<span
						style={{
							fontSize: 150,
							fontWeight: 'bolder',
							color: '#fb4c4322'
						}}
					>?</span>
				</div>
		}
		<span
			style={{
				fontSize: 16,
				marginTop: 8,
				color: '#fb4c43'
			}}
		>#{mc.tokenId}</span>
		<div
			style={{
				width: '100%',
				marginBottom: 16,
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			<StyledButton
				style={{
					width: '85%',
					borderRadius: 8,

				}}
				loading={clicked}
				type={'primary'}
				disabled={
					serc721.valid !== true
				}
				onClick={() => {
					mintCredits.mint(mc)
					setClicked(true)
				}}
			>Mint</StyledButton>

		</div>

	</div>

}

const ERC721Displayer = ({ id }: { id: string }) => {
	const erc721 = useEthereumERC721()
	const serc721 = useStarknetERC721();
	const [_tokenUri] = useContractCalls([{
		address: erc721.address,
		abi: erc721.abi,
		method: 'tokenURI',
		args: [ethers.BigNumber.from(id)]
	}]);
	const [clicked, setClicked] = useState(false);

	const tokenUri = _tokenUri ? (_tokenUri[0] !== '' ? _tokenUri[0] : null) : null;
	const tokenUriData = useTokenURI(tokenUri);

	return <div
		style={{
			width: 200,
			backgroundColor: '#fb4c4322',
			margin: 12,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			justifyContent: 'flex-start',
			borderRadius: 16
		}}
	>
		{
			tokenUriData.status === 'READY'

				?
				<img
					style={{
						width: 200,
						height: 200,
						borderRadius: 16
					}}
					src={tokenUriData.image} />

				:
				<div
					style={{
						width: 200,
						height: 200,
						borderRadius: 16,
						backgroundColor: '#fb4c4322',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<span
						style={{
							fontSize: 150,
							fontWeight: 'bolder',
							color: '#fb4c4344'
						}}
					>?</span>
				</div>
		}
		<span
			style={{
				fontSize: 16,
				marginTop: 8,
				color: '#fb4c43'
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
			<StyledButton
				style={{
					width: '85%',
					borderRadius: 8,

				}}
				loading={clicked}
				type={'primary'}
				disabled={
					serc721.valid !== true
				}
				onClick={() => {
					serc721.bridgeBack(id);
					setClicked(true);
				}}
			>Bridge Back</StyledButton>
		</div>

	</div>

}

export const StarknetSection = () => {

	const serc721 = useStarknetERC721();
	const mintCredits = useStarknetMintCredits();

	if (serc721.valid === null) {
		return <p>LOADING</p>
	}

	if (serc721.valid === false) {

		return <div
			style={{
				width: '80%',
				justifyContent: 'center',
				alignItems: 'center',
				display: 'flex',
				flexDirection: 'column',
				height: '100%',
				color: '#fb4c43',
				textAlign: 'center'
			}}
		>
			<h1
				style={{
					color: '#fb4c43',
				}}
			>Invalid Starknet ERC721 Contract</h1>
			<h3
				style={{
					color: '#fb4c43',
				}}
			>The provided contract <span style={{ fontWeight: 'bold' }}>{serc721.address}</span> is not a Starknet ERC721 contract</h3>
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
		<StarknetIcon />
		<div
			style={{
				width: '100%',
				height: '100%',
				overflow: 'scroll',
				padding: 16,
			}}
		>
			<BridgedContractTitleAndSymbol />
			<div
				style={{
					width: '100%',
					display: 'flex',
					flexDirection: 'row',
					flexWrap: 'wrap'
				}}
			>
				{
					mintCredits.mintCredits?.length ? mintCredits.mintCredits.map((mc, idx) => <MintableERC721Displayer mc={mc} key={idx} />) : null
				}
				{
					serc721.ownedTokens?.length ? serc721.ownedTokens.map(tid => <ERC721Displayer id={tid} key={tid}/>) : null
				}
			</div>
		</div>
	</div>
}