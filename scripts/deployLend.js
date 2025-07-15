const hre = require("hardhat");
const { ethers } = hre;
const { parseUnits } = ethers.utils;
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("Deploying contracts to Sepolia testnet...");
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Deploy MockPriceFeed
  console.log("Deploying MockPriceFeed...");
  const MockPriceFeed = await hre.ethers.getContractFactory("MockPriceFeed");
  const priceFeed = await MockPriceFeed.deploy();
  await priceFeed.deployed();
  console.log("MockPriceFeed deployed to:", priceFeed.address);

  // Deploy Mock ERC20 tokens
  console.log("Deploying Mock ERC20 tokens...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  
  const usdc = await MockERC20.deploy("Mock USDC", "USDC", 6);
  await usdc.deployed();
  console.log("Mock USDC deployed to:", usdc.address);

  const dai = await MockERC20.deploy("Mock DAI", "DAI", 18);
  await dai.deployed();
  console.log("Mock DAI deployed to:", dai.address);

  const weth = await MockERC20.deploy("Mock WETH", "WETH", 18);
  await weth.deployed();
  console.log("Mock WETH deployed to:", weth.address);

  // Set prices in MockPriceFeed (8 decimals)
  console.log("Setting token prices...");
  await (await priceFeed.setPrice(usdc.address, parseUnits("1", 8))).wait();      // 1 USDC = $1
  await (await priceFeed.setPrice(dai.address, parseUnits("1", 8))).wait();       // 1 DAI = $1
  await (await priceFeed.setPrice(weth.address, parseUnits("2000", 8))).wait();   // 1 WETH = $2000
  console.log("Token prices set");

  // Deploy Lend contract
  console.log("Deploying Lend contract...");
  const Lend = await hre.ethers.getContractFactory("Lend");
  const lend = await Lend.deploy(
    usdc.address,
    dai.address,
    weth.address,
    priceFeed.address
  );
  await lend.deployed();
  console.log("Lend contract deployed to:", lend.address);

  // Mint tokens to deployer only (for testnet, we'll only mint to deployer)
  console.log("Minting tokens to deployer...");
  const mintAmountUSDC = parseUnits("1000000", 6);
  const mintAmountDAI = parseUnits("1000000", 18);
  const mintAmountWETH = parseUnits("1000000", 18);

  await (await usdc.mint(deployer.address, mintAmountUSDC)).wait();
  await (await dai.mint(deployer.address, mintAmountDAI)).wait();
  await (await weth.mint(deployer.address, mintAmountWETH)).wait();
  console.log("Tokens minted to deployer");

  // Approve and supply initial liquidity from deployer
  console.log("Supplying initial liquidity...");
  await (await usdc.approve(lend.address, parseUnits("500000", 6))).wait();
  await (await dai.approve(lend.address, parseUnits("500000", 18))).wait();
  await (await weth.approve(lend.address, parseUnits("500000", 18))).wait();

  await (await lend.supply(usdc.address, parseUnits("500000", 6), deployer.address)).wait();
  await (await lend.supply(dai.address, parseUnits("500000", 18), deployer.address)).wait();
  await (await lend.supply(weth.address, parseUnits("500000", 18), deployer.address)).wait();
  console.log("Initial liquidity supplied");

  // Prepare frontend config for Sepolia
  const artifactsDir = path.join(__dirname, "../frontend/src/contracts");
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

  const lendArtifact = await hre.artifacts.readArtifact("Lend");
  const mockERC20Artifact = await hre.artifacts.readArtifact("MockERC20");

  const contractsConfig = {
    chainId: 11155111, // Sepolia testnet chain ID
    contracts: {
      LendingProtocol: {
        address: lend.address,
        abi: lendArtifact.abi,
      },
      MockERC20: {
        abi: mockERC20Artifact.abi,
      },
    },
    tokens: {
      USDC: { address: usdc.address, symbol: "USDC", decimals: 6, abi: mockERC20Artifact.abi },
      DAI: { address: dai.address, symbol: "DAI", decimals: 18, abi: mockERC20Artifact.abi },
      WETH: { address: weth.address, symbol: "WETH", decimals: 18, abi: mockERC20Artifact.abi },
    },
    accounts: {
      deployer: deployer.address,
    },
    network: "sepolia",
    deployed: new Date().toISOString(),
  };

  fs.writeFileSync(
    path.join(artifactsDir, "sepolia.ts"),
    `export interface TokenConfig {
  address: \`0x\${string}\`;
  symbol: string;
  decimals: number;
  abi: any[];
}

export interface ContractsConfig {
  chainId: number;
  contracts: {
    LendingProtocol: {
      address: \`0x\${string}\`;
      abi: any[];
    };
    MockERC20: {
      abi: any[];
    };
  };
  tokens: {
    USDC: TokenConfig;
    DAI: TokenConfig;
    WETH: TokenConfig;
  };
  accounts: {
    deployer: string;
  };
  network: string;
  deployed: string;
}

export const SEPOLIA_CONTRACTS_CONFIG: ContractsConfig = ${JSON.stringify(contractsConfig, null, 2)};
`
  );

  // Also create/update a general index file
  fs.writeFileSync(
    path.join(artifactsDir, "index.ts"),
    `import { SEPOLIA_CONTRACTS_CONFIG } from './sepolia';

// Export the current network config
export const CONTRACTS_CONFIG = SEPOLIA_CONTRACTS_CONFIG;

// Export all network configs
export { SEPOLIA_CONTRACTS_CONFIG };

export type { TokenConfig, ContractsConfig } from './sepolia';
`
  );

  console.log("\n=== Deployment Summary ===");
  console.log("Network: Sepolia Testnet");
  console.log("MockPriceFeed:", priceFeed.address);
  console.log("Mock USDC:", usdc.address);
  console.log("Mock DAI:", dai.address);
  console.log("Mock WETH:", weth.address);
  console.log("Lend Contract:", lend.address);
  console.log("Deployer:", deployer.address);
  console.log("\nFrontend config written to:");
  console.log("- frontend/src/contracts/sepolia.ts");
  console.log("- frontend/src/contracts/index.ts");
  
  console.log("\n=== Next Steps ===");
  console.log("1. Verify contracts on Etherscan:");
  console.log(`   npx hardhat verify --network sepolia ${priceFeed.address}`);
  console.log(`   npx hardhat verify --network sepolia ${usdc.address} "Mock USDC" "USDC" 6`);
  console.log(`   npx hardhat verify --network sepolia ${dai.address} "Mock DAI" "DAI" 18`);
  console.log(`   npx hardhat verify --network sepolia ${weth.address} "Mock WETH" "WETH" 18`);
  console.log(`   npx hardhat verify --network sepolia ${lend.address} ${usdc.address} ${dai.address} ${weth.address} ${priceFeed.address}`);
  console.log("\n2. Update your frontend to use Sepolia network");
  console.log("3. Get Sepolia ETH from faucets:");
  console.log("   - https://sepoliafaucet.com/");
  console.log("   - https://www.alchemy.com/faucets/ethereum-sepolia");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});