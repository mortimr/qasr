import 'hardhat-deploy';
import "@nomiclabs/hardhat-etherscan";
import "hardhat-prettier";

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
      url: 'https://eth-goerli.alchemyapi.io/v2/stoIJ04hSyl2rN5CvpcEHz9MPpaNFYIZ',
      accounts: {
        mnemonic: 'eight whisper sweet various ignore bundle put fame custom anger mystery cash'
      }
    }
  },
  namedAccounts: {
    deployer: '0x574E032f50e806e490Cf3D1194912B9Cc3f5D37D'
  },
  etherscan: {
    apiKey: "EKVVBPNFFQG47MU6AQFJE4ZGGF8EAZYGD3"
  }
};

export default ehhuc;
