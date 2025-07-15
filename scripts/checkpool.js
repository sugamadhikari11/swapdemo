const { ethers } = require("ethers");

const provider = new ethers.providers.JsonRpcProvider(
  "https://eth-sepolia.g.alchemy.com/v2/-TZNzPEOe3aN-Zwf0EDfG-v2WYocB4CB"
);

const UNISWAP_V3_FACTORY = "0x0227628f3F023bb0B980b67D528571c95c6DaC1c"; // mainnet factory address, likely NOT on Sepolia
const factoryAbi = [
  "function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address)",
];

const weth = "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6";
const usdc = "0x65aFADD39029741B3b8f0756952C74678c9cEC93";
const fee = 3000;

async function main() {
  // 1. Check if factory contract exists on Sepolia at given address
  const code = await provider.getCode(UNISWAP_V3_FACTORY);

  if (code === "0x") {
    console.log(
      `❌ No contract deployed at Uniswap V3 Factory address on Sepolia: ${UNISWAP_V3_FACTORY}`
    );
    console.log(
      "You cannot query pools because the factory contract does not exist on this network at this address."
    );
    return;
  }

  console.log(`✅ Factory contract found at ${UNISWAP_V3_FACTORY}`);

  // 2. Create contract instance
  const factory = new ethers.Contract(UNISWAP_V3_FACTORY, factoryAbi, provider);

  try {
    // 3. Query pool address for WETH-USDC with fee 3000
    const poolAddress = await factory.getPool(weth, usdc, fee);

    if (
      poolAddress ===
      "0x0000000000000000000000000000000000000000"
    ) {
      console.log("⚠️ Pool does NOT exist for WETH-USDC with fee 3000 on this factory.");
    } else {
      console.log(`✅ Pool address found: ${poolAddress}`);
    }
  } catch (error) {
    console.error("❌ Error calling getPool:", error);
  }
}

main();
