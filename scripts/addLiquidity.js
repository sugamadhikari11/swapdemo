
SRS_POOL= '0xaeAaA558da9f5c5FF3023953e7A78A3eDe4c90A4'


// Token addressess
srsAddress= '0x67d269191c92Caf3cD7723F116c85e6E9bf55933'
rssAddress= '0xE6E340D132b5f46d1e472DebcD681B2aBc16e57E'
ssrAddress= '0xc3e53F4d16Ae77Db1c982e75a937B9f60FE63690'

// Uniswap contract adress
WETH_ADDRESS='0x322813Fd9A801c5507c9de605d63CEA4f2CE6c44'
FACTORY_ADDRESS='0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f'
SWAP_ROUTER_ADDRESS='0x4A679253410272dd5232B3Ff7cF5dbB88f295319'
NFT_DESCRIPTOR_ADDRESS='0x7a2088a1bFc9d81c55368AE168C2C02570cB814F'
POSITION_DESCRIPTOR_ADDRESS='0x09635F643e140090A9A8Dcd712eD6285858ceBef'
POSITION_MANAGER_ADDRESS='0xc5a5C42992dECbae36851359345FE25997F5C42d'

const artifacts = {
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    SRS: require("../artifacts/contracts/SRS.sol/SRS.json"),
    RSS: require("../artifacts/contracts/RSS.sol/RSS.json"),
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
};
const {ethers} = require("hardhat");
const {Contract} = require("ethers");
const {Token} = require("@uniswap/sdk-core");
const {Pool, Position, nearestUsableTick} = require("@uniswap/v3-sdk");


async  function getPoolData(poolContract){
    const [tickSpacing , fee, liquidity, slot0] = await Promise.all([
        poolContract.tickSpacing(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ]);

    return{
        tickSpacing: tickSpacing,
        fee: fee,
        liquidity: liquidity,
        sqrtPricex96: slot0[0],
        tick: slot0[1],
    };
}

async function main() {
    const [owner, signer2] = await ethers.getSigners();
    const provider = ethers.provider;

    const srsContract = new Contract(
        srsAddress, 
        artifacts.SRS.abi, 
        provider
    );
    const rssContract= new Contract(
        rssAddress,
        artifacts.RSS.abi,
        provider
    );


await srsContract.connect(signer2).approve(
    POSITION_MANAGER_ADDRESS,
    ethers.utils.parseEther("1000")
);
await rssContract.connect(signer2).approve(
    POSITION_MANAGER_ADDRESS,
    ethers.utils.parseEther("1000")
);

const poolContract = new Contract(
    SRS_POOL,
    artifacts.UniswapV3Pool.abi,
    provider
);

const poolData = await getPoolData(poolContract);
const srsToken = new Token(31337,srsAddress, 18, "SRS", "Tether");
const rssToken = new Token(31337,rssAddress, 18, "RSS", "Rayyanoin");

const pool = new Pool(
    srsToken,
    rssToken,
    poolData.fee,
    poolData.sqrtPricex96.toString(),
    poolData.liquidity,
    poolData.tick,
);

const position = new Position({
    pool: pool,
    liquidity: ethers.utils.parseEther("1"),
    tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing)- poolData.tickSpacing * 2,
    tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
});

const {amount0: amount0Desired, amount1: amount1Desired} = position.mintAmounts;

params = {
    token0: srsAddress,
    token1: rssAddress,
    fee: poolData.fee,
    tickLower: nearestUsableTick(poolData.tick, poolData.tickSpacing)- poolData.tickSpacing * 2,
    tickUpper: nearestUsableTick(poolData.tick, poolData.tickSpacing) + poolData.tickSpacing * 2,
    amount0Desired: amount0Desired.toString(),
    amount1Desired: amount1Desired.toString(),
    amount0Min: 0,
    amount1Min: 0,
    recipient: signer2.address,
    deadline: Math.floor(Date.now()/1000) + 60 * 10,
};

const nonfungiblePositionManager = new Contract(
    POSITION_MANAGER_ADDRESS,
    artifacts.NonfungiblePositionManager.abi,
    provider
);

const tx = await nonfungiblePositionManager
    .connect(signer2)
    .mint(params, {gasLimit: "1000000"});
const receipt = await tx.wait();
console.log(receipt);

}
/*
npx hardhat run --network localhost scripts/addLiquidity.js
*/

main()
    .then(()=>process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });