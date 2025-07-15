# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```

---

# Hardhat Project - SwapMultiHop and Pool Check

## Project Overview
This project demonstrates a Hardhat-based Ethereum smart contract system that interacts with Uniswap V3 for multi-hop token swaps. It includes smart contracts for swapping tokens through multiple hops and scripts to interact with Uniswap pools on the Sepolia testnet.

## SwapMultiHop Contract
The `SwapMultiHop` contract enables multi-hop token swaps using the Uniswap V3 protocol. It leverages the Uniswap V3 Swap Router to perform swaps between tokens through intermediate tokens.

### Key Features:
- Uses Uniswap V3's `ISwapRouter` interface for swapping.
- Supports swapping an exact input amount of WETH9 to DAI via USDC.
- Supports swapping to receive an exact output amount of WETH9 from DAI via USDC, with a maximum input limit.
- Utilizes Uniswap's `exactInput` and `exactOutput` functions with encoded swap paths.

### Contract Details:
- **Swap Router Address:** `0xE592427A0AEce92De3Edee1F18E0157C05861564`
- **Tokens Used:**
  - DAI: `0x6B175474E89094C44Da98b954EedeAC495271d0F`
  - WETH9: `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`
  - USDC: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`

### Functions:
- `swapExactInputMultihop(uint amountIn)`: Swaps an exact amount of WETH9 for DAI through USDC.
- `swapExactOutputMultihop(uint amountOut, uint amountInMaximum)`: Swaps tokens to receive an exact amount of WETH9 from DAI through USDC, spending up to a maximum input amount.

## checkpool.js Script
This script connects to the Sepolia testnet and interacts with the Uniswap V3 Factory contract to check for the existence of a liquidity pool.

### Script Functionality:
- Connects to Sepolia testnet using Alchemy provider.
- Checks if the Uniswap V3 Factory contract is deployed at the specified address.
- Queries the pool address for the WETH-USDC token pair with a fee tier of 3000.
- Logs the existence and address of the pool or indicates if the pool does not exist.

## Running Tests and Scripts
- To run Hardhat tests (if any are present), use:
  ```
  npx hardhat test
  ```
- To run the pool check script:
  ```
  node scripts/checkpool.js
  node scripts/checkpool.js
npx hardhat ignition deploy ./ignition/modules/Lock.js
