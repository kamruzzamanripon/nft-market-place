require('@nomicfoundation/hardhat-toolbox');
const fs = require('fs');

const privateKey = fs.readFileSync('.secret').toString().trim();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: '0.8.17',
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};
