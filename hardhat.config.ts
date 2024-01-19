import { type HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-foundry'
import '@nomicfoundation/hardhat-toolbox'

const config: HardhatUserConfig = {

  solidity: { compilers: [{ version: '0.8.19' }, { version: '0.8.0' }, { version: '0.8.9' }, { version: '0.8.20' }, { version: '0.5.9' }, { version: '0.6.12' }, { version: '0.7.0' }, { version: '0.6.5' }, { version: '0.8.1', settings: {} }] },
  networks: {

    localhost: {
      url: 'http://localhost:8545/'
    },
    hardhat: {
      forking: {
        url: 'https://polygon-mumbai.g.alchemy.com/v2/uC_yNuiXybGlKXEz0ZgLjzScJZQj9mf0'
      }
    }

  },
  mocha: {
    timeout: 120000
  }
}

export default config
