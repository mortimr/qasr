import { useEthers } from '@usedapp/core'
import { useStarknet } from '../hooks/useStarknet';
import styled from 'styled-components';
import { ReactComponent as MetamaskLogo } from './metamask.svg';
import { ReactComponent as WalletConnectLogo } from './walletconnect.svg';
import { ReactComponent as ArgentXLogo } from './argentx.svg';
import { Tooltip } from 'antd'
import { useParams } from 'react-router-dom';
import { EthereumERC721ContextProvider } from '../contexts/EthereumERC721Context';
import { StarknetERC721ContextProvider } from '../contexts/StarknetERC721Context';
import { ethers } from 'ethers';
import { EthereumGatewayContextProvider } from '../contexts/EthereumGatewayContext';
import { EthereumBridgingEventsContextProvider } from '../contexts/EthereumBridgingEvents';
import { StarknetMintCreditContextProvider } from '../contexts/StarknetMintCreditContext';
import { StarknetWithdrawEventsContextProvider } from '../contexts/StarknetWithdrawEventsContext';
import { useEffect } from 'react';

const WalletTypeContainer = styled.div<{ color: string }>`
	margin: 16px;
	border-radius: 16px;
	width: 150px;
	height: 150px;
	background-color: ${props => props.color}10;
	transition: all 200ms ease-in-out;
	cursor: pointer;
	display: flex;
	justify-content: center;
	align-items: center;

	&:hover {
		background-color: ${props => props.color}30;
		transform: scale(1.02)
	}

	&:active {
		transform: scale(0.95)
	}
`
const EthereumLoginGate = ({ EthereumSection }: { EthereumSection: React.FC }) => {
	const ethers = useEthers();

	useEffect(() => {
		if (ethers.error && ethers.error.message.includes('Unsupported')) {
			alert(`Unsupported network. Connect to georli.`)
		}
	}, [ethers.error])

	useEffect(() => {
		if (ethers.chainId && ethers.chainId !== 5) {
			alert(`Unsupported network. Connect to georli.`)
		}
	}, [ethers.chainId])

	if (!ethers.active) {
		return <div

			style={{
				marginLeft: 16,
				marginTop: 16,
				width: 'calc(100% - 32px)',
				height: 'calc(100% - 32px)',
				borderRadius: 8,
				backgroundColor: '#716b9433',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			<div
				style={{
					width: '100%',
					textAlign: 'center',
				}}
			>
				<h1
					style={{
						fontSize: 40,
						color: '#716b94'
					}}
				>Ethereum</h1>
				<div
					style={{
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<Tooltip
						overlay={'Metamask'}
						placement={'bottom'}
					>
						<WalletTypeContainer color={'#716b94'} onClick={() => ethers.activateBrowserWallet()}>
							<MetamaskLogo
								style={{
									width: 75,
									height: 75
								}}
							/>
						</WalletTypeContainer>
					</Tooltip>
					<Tooltip
						overlay={'WalletConnect'}
						placement={'bottom'}
					>
						<WalletTypeContainer color={'#716b94'}>
							<WalletConnectLogo
								style={{
									width: 75,
									height: 75
								}}
							/>
						</WalletTypeContainer>
					</Tooltip>

				</div>

			</div>

		</div>
	} else {
		return <div

			style={{
				marginLeft: 16,
				marginTop: 16,
				width: 'calc(100% - 32px)',
				height: 'calc(100% - 32px)',
				borderRadius: 8,
				backgroundColor: '#716b9422',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			<EthereumSection />
		</div>
	}
}

const StarknetLoginGate = ({ StarknetSection }: { StarknetSection: React.FC }) => {

	const starknet = useStarknet();

	if (!starknet.active) {
		return <div
			style={{
				marginLeft: 16,
				marginTop: 16,
				width: 'calc(100% - 32px)',
				height: 'calc(100% - 32px)',
				borderRadius: 8,
				backgroundColor: '#fb4c4333',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			<div
				style={{
					width: '100%',
					textAlign: 'center',
				}}
			>
				<h1
					style={{
						fontSize: 40,
						color: '#fb4c43'
					}}
				>Starknet</h1>
				<div
					style={{
						width: '100%',
						display: 'flex',
						justifyContent: 'center',
						alignItems: 'center'
					}}
				>
					<Tooltip
						overlay={'Argent X'}
						placement={'bottom'}
					>
						<WalletTypeContainer color={'#fb4c43'} onClick={() => starknet.enable()}>
							<ArgentXLogo
								style={{
									width: 75,
									height: 75
								}}
							/>
						</WalletTypeContainer>
					</Tooltip>

				</div>

			</div>

		</div>
	} else {

		return <div
			style={{
				marginLeft: 16,
				marginTop: 16,
				width: 'calc(100% - 32px)',
				height: 'calc(100% - 32px)',
				borderRadius: 8,
				backgroundColor: '#fb4c4322',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center'
			}}
		>
			<StarknetSection />
		</div>
	}
}

export interface LoginGateProps {
	EthereumSection: React.FC;
	StarknetSection: React.FC;
}

export const LoginGate: React.FC<React.PropsWithChildren<LoginGateProps>> = (props: React.PropsWithChildren<LoginGateProps>): React.ReactElement => {

	const { ethereum, starknet } = useParams();

	let parsedEthereum;

	try {
		parsedEthereum = ethers.utils.getAddress(ethereum);
	} catch (e) {
		parsedEthereum = null;
	}

	return <div
		style={{
			width: '100%',
			height: '100%',
			display: 'flex',
			flexDirection: 'row'
		}}
	>
		{
			parsedEthereum === null

				? <p>Invalid Ethereum address {ethereum}</p>

				: <EthereumERC721ContextProvider
					address={ethereum}
				>
					<StarknetERC721ContextProvider
						address={starknet}
					>
						<EthereumGatewayContextProvider>
							<EthereumBridgingEventsContextProvider>
								<StarknetMintCreditContextProvider>
									<StarknetWithdrawEventsContextProvider>
										<div
											style={{
												width: '50%',
												height: '100%'
											}}
										>
											<EthereumLoginGate
												EthereumSection={props.EthereumSection}
											/>
										</div>
										<div
											style={{
												width: '50%',
												height: '100%'
											}}
										>
											<StarknetLoginGate
												StarknetSection={props.StarknetSection}
											/>
										</div>
									</StarknetWithdrawEventsContextProvider>
								</StarknetMintCreditContextProvider>
							</EthereumBridgingEventsContextProvider>
						</EthereumGatewayContextProvider>
					</StarknetERC721ContextProvider>
				</EthereumERC721ContextProvider>
		}

	</div >
}