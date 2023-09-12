import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'
// import '@nomiclabs/hardhat-etherscan'
// import '@openzeppelin/hardhat-upgrades'
import 'hardhat-gas-reporter'
import '@nomiclabs/hardhat-solhint'
import '@openzeppelin/hardhat-upgrades';
import '@typechain/hardhat'
import 'hardhat-abi-exporter'
import 'solidity-coverage'
import * as dotenv from 'dotenv'



dotenv.config({ path: __dirname + '/.env' })

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.10',
    settings: {
      optimizer: {
        enabled: true,
        runs: 20,
      },
    },
  },

  networks: {
    hardhat: {
      blockGasLimit: 1000000000,
      gas: 1000000000
    },
    ETH: {
      url: process.env.ETH_MAIN_URL !== undefined ? process.env.ETH_MAIN_URL : '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
    },
    Goerli: {
      url: process.env.ETH_GOERLI_URL !== undefined ? process.env.ETH_GOERLI_URL : '',
      chainId: 5,
      accounts: process.env.GOERLI_PRIVATE_KEY !== undefined ? [process.env.GOERLI_PRIVATE_KEY] : [],
    },
    arbitrumGoerli: {
      url: process.env.ARB_TEST_URL !== undefined ? process.env.ARB_TEST_URL : '',
      chainId: 421613,
      accounts: process.env.ARB_TEST_PRIVATE_KEY !== undefined ? [process.env.ARB_TEST_PRIVATE_KEY] : [],
    },
    Arbitrum: {
      url: process.env.ARB_MAIN_URL !== undefined ? process.env.ARB_MAIN_URL : '',
      chainId: 42161,
      accounts: process.env.ARB_TEST_PRIVATE_KEY !== undefined ? [process.env.ARB_TEST_PRIVATE_KEY] : [],
    },
    bscTestnet: {
      url: process.env.BSC_TEST_URL !== undefined ? process.env.BSC_TEST_URL : '',
      chainId: 97,
      accounts: process.env.BSC_PRIVATE_KEY !== undefined ? [process.env.BSC_PRIVATE_KEY] : [],
    },
    bsc: {
      url: process.env.BSC_MAIN_URL !== undefined ? process.env.BSC_MAIN_URL : '',
      chainId: 56,
      accounts: process.env.ARB_TEST_PRIVATE_KEY !== undefined ? [process.env.ARB_TEST_PRIVATE_KEY] : [],
    },
    Mumbai: {
      url: process.env.PLYGN_TEST_URL !== undefined ? process.env.PLYGN_TEST_URL : '',
      chainId: 80001,
      accounts: process.env.MUMBAI_PRIVATE_KEY !== undefined ? [process.env.MUMBAI_PRIVATE_KEY] : [],
    },
    Polygon: {
      url: process.env.PLYGN_TEST_URL !== undefined ? process.env.PLYGN_TEST_URL : '',
      chainId: 137,
      accounts: process.env.ARB_TEST_PRIVATE_KEY !== undefined ? [process.env.ARB_TEST_PRIVATE_KEY] : [],
    },
  },

  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY !== undefined ? process.env.ETHERSCAN_API_KEY : '',
      goerli: process.env.ETHERSCAN_API_KEY !== undefined ? process.env.ETHERSCAN_API_KEY : '',

      arbitrumOne: process.env.ARBISCAN_API_KEY !== undefined ? process.env.ARBISCAN_API_KEY : '',
      arbitrumGoerli: process.env.ARBISCAN_API_KEY !== undefined ? process.env.ARBISCAN_API_KEY : '',

      bsc: process.env.BSCSCAN_API_KEY !== undefined ? process.env.BSCSCAN_API_KEY : '',
      bscTestnet: process.env.BSCSCAN_API_KEY !== undefined ? process.env.BSCSCAN_API_KEY : '',

      polygon: process.env.PLYGNSCAN_API_KEY !== undefined ? process.env.PLYGNSCAN_API_KEY : '',
      polygonMumbai: process.env.PLYGNSCAN_API_KEY !== undefined ? process.env.PLYGNSCAN_API_KEY : '',
    }
  },


  gasReporter: {
    enabled: false,             
    currency: 'USD',
    coinmarketcap: '10ff6b76-b425-4a67-8878-ac1e33c59407',
  },

  typechain: {
    outDir: 'typechain-types',
    target: 'ethers-v5',
  },

  abiExporter: {
    path: './ABI',
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    pretty: true,
  },
}
export default config
