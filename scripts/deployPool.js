// Token addresses
const srsAddress= '0x44B82aaC94fdcA2CA0FD52ca37FF2EB0be53fb4b'
const rssAddress= '0x8485829c396624e37CA85421fcFF2BbA0BeecDf2'
const ssrAddress= '0x4152875Aa88337130e0d3B43BC89d10730269c48'

// Uniswap contract addresses
const WETH_ADDRESS='0x9c28262929A001c971Ddf45863c3Ca6F0f70E211'
const FACTORY_ADDRESS='0x14f60A4A81C4aA7579f30d1DA869F7D8Fe22233f'
const SWAP_ROUTER_ADDRESS='0xf6e855D17ee9A9faf0Cd66D90Db0c09f2603B7a3'
const NFT_DESCRIPTOR_ADDRESS='0x71c642e9661303cf4aC77f7979Fdd4c89775f6B3'
const POSITION_DESCRIPTOR_ADDRESS='0xB542fcc46E5C3a7D5d380b104606936F09DC7465'
const POSITION_MANAGER_ADDRESS='0x8F56ff6F0DD663C5E59CB27c1d930Fdc14140846'

const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const { Contract, BigNumber } = require("ethers");
const bn = require("bignumber.js");
const { ethers } = require("hardhat");

bn.config({ EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40 });

const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/-TZNzPEOe3aN-Zwf0EDfG-v2WYocB4CB";
const provider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Price encoding function
function encodePriceSqrt(reserve1, reserve0) {
    return BigNumber.from(
        new bn(reserve1.toString())
            .div(reserve0.toString())
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toString()
    );
}

// Helper function to ensure correct token ordering (token0 < token1)
function getTokenOrder(tokenA, tokenB) {
    return tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
}

// Contract instances
const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    provider
);

const factory = new Contract(
    FACTORY_ADDRESS,
    artifacts.UniswapV3Factory.abi,
    provider
);

async function deployPool(token0, token1, fee, price) {
    const [owner] = await ethers.getSigners();
    
    console.log(`Deploying pool for tokens: ${token0} and ${token1}`);
    console.log(`Fee tier: ${fee}`);
    console.log(`Initial price: ${price.toString()}`);
    
    try {
        // Check if pool already exists
        const existingPool = await factory.connect(owner).getPool(token0, token1, fee);
        if (existingPool !== '0x0000000000000000000000000000000000000000') {
            console.log("Pool already exists at:", existingPool);
            return existingPool;
        }
        
        // Create and initialize the pool
        const tx = await nonfungiblePositionManager
            .connect(owner)
            .createAndInitializePoolIfNecessary(token0, token1, fee, price, {
                gasLimit: 5000000,
            });
        
        console.log("Transaction sent:", tx.hash);
        await tx.wait();
        console.log("Pool creation confirmed");
        
        // Get the pool address
        const poolAddress = await factory.connect(owner).getPool(token0, token1, fee);
        console.log("Pool deployed at:", poolAddress);
        
        return poolAddress;
        
    } catch (error) {
        console.error("Error deploying pool:", error);
        throw error;
    }
}

async function main() {
    console.log("Starting pool deployment...");
    
    try {
        // Get signer info
        const [owner] = await ethers.getSigners();
        console.log("Deploying from account:", owner.address);
        
        // Check account balance
        const balance = await owner.getBalance();
        console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");
        
        // Ensure correct token ordering
        const [token0, token1] = getTokenOrder(srsAddress, rssAddress);
        console.log("Token0 (lower address):", token0);
        console.log("Token1 (higher address):", token1);
        
        // Deploy SRS-RSS pool with 1:1 ratio
        const SRSPool = await deployPool(
            token0,
            token1,
            500, // 0.05% fee tier
            encodePriceSqrt(1, 1) // 1:1 price ratio
        );
        
        console.log("SRS-RSS Pool deployed at:", SRSPool);
        
        // Optionally deploy additional pools
        // Example: SRS-SSR pool
        /*
        const [token0_srs_ssr, token1_srs_ssr] = getTokenOrder(srsAddress, ssrAddress);
        const SRSSSRPool = await deployPool(
            token0_srs_ssr,
            token1_srs_ssr,
            500,
            encodePriceSqrt(1, 1)
        );
        console.log("SRS-SSR Pool deployed at:", SRSSSRPool);
        */
        
        // Example: RSS-SSR pool
        /*
        const [token0_rss_ssr, token1_rss_ssr] = getTokenOrder(rssAddress, ssrAddress);
        const RSSSSRPool = await deployPool(
            token0_rss_ssr,
            token1_rss_ssr,
            500,
            encodePriceSqrt(1, 1)
        );
        console.log("RSS-SSR Pool deployed at:", RSSSSRPool);
        */
        
        console.log("Pool deployment completed successfully!");
        
    } catch (error) {
        console.error("Main function error:", error);
        throw error;
    }
}

// Run the script
main()
    .then(() => {
        console.log("Script completed successfully");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Script failed:", error);
        process.exit(1);
    });

/*
Usage:
npx hardhat run --network sepolia scripts/deployPool.js

Make sure your hardhat.config.js has the sepolia network configured:

networks: {
    sepolia: {
        url: "https://eth-sepolia.g.alchemy.com/v2/-TZNzPEOe3aN-Zwf0EDfG-v2WYocB4CB",
        accounts: ["YOUR_PRIVATE_KEY"]
    }
}
*/