/* eslint-disable quotes */
require('@nomicfoundation/hardhat-toolbox');
const fs = require('fs');
require("dotenv").config();

const privateKey = fs.readFileSync('.secret').toString().trim();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.17',
  networks: {
    hardhat: {
      chainId: 1337,
    },
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [process.env.WALLET_PRIVATE_KEY],
    },
  },
};
