import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const L2_CONTRACT_ADDRESS = '0x5e6229F2D4d977d20A50219E521dE6Dd694d45cc';
const L1_STARKNET_CORE = '0x5e6229F2D4d977d20A50219E521dE6Dd694d45cc';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

	const { deployer } = await hre.getNamedAccounts();

	if (hre.network.name) {
		const FERC721Deployment = await hre.deployments.deploy('FakeErc721', {
			from: deployer,
			args: [],
			log: true
		})
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

	const GatewayDeployment = await hre.deployments.deploy('Gateway', {
		from: deployer,
		args: [
			L1_STARKNET_CORE
		],
		log: true
	})

	console.log(`Sleeping 60sec before etherscan verification`);
	await new Promise(ok => setTimeout(ok, 60000));
	try {
		await hre.run("verify:verify", {
			address: GatewayDeployment.address,
			constructorArguments: [
				L1_STARKNET_CORE
			],
		});
	} catch (e: any) {
		if (!e.message.includes('Contract source code already verified')) {
			throw e;
		}
	}

};
export default func;