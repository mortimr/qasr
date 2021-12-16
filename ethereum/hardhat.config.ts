import 'hardhat-deploy';
import "@nomiclabs/hardhat-etherscan";
import "hardhat-prettier";
import '@nomiclabs/hardhat-ethers';

import { HardhatUserConfig } from 'hardhat/types';

interface ExtendedHardhatUserConfig extends HardhatUserConfig {
  namedAccounts: { [key: string]: string };
}

const ehhuc: ExtendedHardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    goerli: {
      live: true,
      saveDeployments: true,
      url: process.env.RPC_ENDPOINT as string || '',
      accounts: {
        mnemonic: process.env.DEPLOYER_MNEMONIC as string || ''
      }
    }
  },
  namedAccounts: {
    deployer: process.env.DEPLOYER_ADDRESS as string || ''
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY as string || ''
  }
};

export default ehhuc;
