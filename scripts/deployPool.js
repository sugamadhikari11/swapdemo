
// Token addressess
srsAddress= '0x67d269191c92Caf3cD7723F116c85e6E9bf55933'
rssAddress= '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E'
ssrAddress= '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690'

// Uniswap contract adress
WETH_ADDRESS='0x9AC91029691A8D483F32672A0261D4E8708351D7'
FACTORY_ADDRESS='0xd21b5d2e6EedeF1b7Ead2Fb17c9Acb4D9214D1D9'
SWAP_ROUTER_ADDRESS='0x1494291Ad1B8AE16Da16D7616e4A87AeC14646c4'
NFT_DESCRIPTOR_ADDRESS='0xdFc18Aa448CD0cD50D2C90Ba74D59Ee001F1d3d6'
POSITION_DESCRIPTOR_ADDRESS='0x06Af5812D823ea208833A9aFBf207396714bc031'
POSITION_MANAGER_ADDRESS='0x39F26E0D5F7f603be61175E50A21895a4d8Da989'

const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

const {Contract, BigNumber} = require("ethers");
const bn = require("bignumber.js");
const { ethers } = require("hardhat")

bn.config({EXPONENTIAL_AT: 999999, DECIMAL_PLACES: 40});

const MAINNET_URL = "https://eth-mainnet.g.alchemy.com/v2/ial3Mz1oNh1R3IopVJAI4lWHi5NwoQ4N";
const provider = new ethers.providers.JsonRpcProvider(MAINNET_URL);

// const provider = ethers.provider;

function encodePriceSqrt(reserve1, reserve0){
    return BigNumber.from(
        new bn(reserve1.toString())
            .div(reserve0.toString())
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toString()
    );
}

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

async function deployPool(token0, token1, fee, price){
    const [owner] = await ethers.getSigners();
    await nonfungiblePositionManager
        .connect(owner)
        .createAndInitializePoolIfNecessary(token0, token1, fee, price,{
            gasLimit: 5000000,
        });
    const poolAddress = await factory.connect(owner).getPool(token0, token1, fee);
    return poolAddress;
}

async function main(){
    const SRSPool = await deployPool(
        srsAddress,
        rssAddress,
        500,
        encodePriceSqrt(1, 1)
    );
    console.log("SRS_POOL", `${SRSPool}`);
}

/* 
npx hardhat run --network localhost scripts/deployPool.js
*/

main()
    .then(()=> process.exit(0))
    .catch((error)=>{
        console.error(error);
        process.exit(1)
    })
