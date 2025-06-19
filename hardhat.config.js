require("@nomicfoundation/hardhat-toolbox");
// require("@nomiclabs/hardhat-waffle");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.7.6",
        settings: {
          evmVersion: "istanbul",
          optimizer: {
            enabled: true,
            runs: 5000,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      forking: {
        url: "https://eth-mainnet.g.alchemy.com/v2/ial3Mz1oNh1R3IopVJAI4lWHi5NwoQ4N",
      },
    },
  },
};


// require("@nomiclabs/hardhat-waffle");

// module.exports = {
//   solidity: {
//           compilers:[
//             {version: "0.7.6",
//               settings: {
//                 evmVersion: "istanbul",
//                 optimizer: {
//                   enabled: true,
//                   runs: 1000,
//                   // details: {yul: false},
//                 },
//             },
//         },
//       ],
//       },

//   networks: {
//     hardhat: {
//       forking: {
//         url: "https://eth-mainnet.g.alchemy.com/v2/ial3Mz1oNh1R3IopVJAI4lWHi5NwoQ4N",
//         accounts: [
//           {
//             privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
//             balance: "10000000000000000000000",
//           },
//         ],
//       },
//     },
//   },
// };