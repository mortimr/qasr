import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { ethers } from 'ethers';

const L1_STARKNET_CORE = '0xde29d060D45901Fb19ED6C6e959EB22d8626708e';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

	const { deployer } = await hre.getNamedAccounts();

	const gatewaySummary = require('../../starknet/starknet-artifacts/contracts/gateway.cairo/gateway.summary.json');
	const gatewayAddress = gatewaySummary.address;

	if (hre.network.name) {
		const FERC721Deployment = await hre.deployments.deploy('FakeErc721', {
			from: deployer,
			args: [],
			log: true
		})
		if (FERC721Deployment.newlyDeployed) {
			console.log(`Sleeping 60sec before etherscan verification`);
			await new Promise(ok => setTimeout(ok, 60000));
			try {
				await hre.run("verify:verify", {
					address: FERC721Deployment.address,
					constructorArguments: [],
				});
			} catch (e: any) {
				if (!e.message.includes('Contract source code already verified')) {
					throw e;
				}
			}
		}
	}

	const GatewayDeployment = await hre.deployments.deploy('Gateway', {
		from: deployer,
		args: [
			L1_STARKNET_CORE,
			gatewayAddress
		],
		log: true,
		skipIfAlreadyDeployed: false
	})

	if (GatewayDeployment.newlyDeployed) {
		console.log(`Sleeping 120sec before etherscan verification`);
		await new Promise(ok => setTimeout(ok, 120000));
		try {
			await hre.run("verify:verify", {
				address: GatewayDeployment.address,
				constructorArguments: [
					L1_STARKNET_CORE,
					gatewayAddress
				],
			});
		} catch (e: any) {
			if (!e.message.includes('Contract source code already verified') && !e.message.includes('Already Verified')) {
				throw e;
			}
		}
	}


};
export default func;