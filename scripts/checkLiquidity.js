//Pool
SRS_POOL= '0xaeAaA558da9f5c5FF3023953e7A78A3eDe4c90A4'


const UniswapV3Pool = require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json")

const {ethers} = require("hardhat");
const {Contract} = require("ethers");
const {Pool} = require("@uniswap/v3-sdk");
const {Token} = require("@uniswap/sdk-core");


async function getPoolData(poolContract) {
    const[
        tickSpacing,
        fee,
        liquidity,
        slot0,
        factory,
        token0,
        token1,
        maxLiquidityPerTick,
    ] = await Promise.all([
        poolContract.tickSpacing(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
        poolContract.factory(),
        poolContract.token0(),
        poolContract.token1(),
        poolContract.maxLiquidityPerTick(),
    ]);
    
    const TokenA = new Token(3, token0, 18, "SRS", "SRS");
    const TokenB = new Token(3, token1, 18, "RSS", "RSS");

    const poolExample = new Pool(
        TokenA,
        TokenB,
        fee,
        slot0[0].toString(),
        liquidity.toString(),
        slot0[1]
    );
    return{
        factory: factory,
        token0: token0,
        token1: token1,
        maxLiquidityPerTick: maxLiquidityPerTick,
        tickSpacing: tickSpacing,
        fee: fee,
        liquidity: liquidity,
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
        observationIndex: slot0[2],
        observationCardinality: slot0[3],
        observationCardinalityNext: slot0[4],
        feeProtocol: slot0[5],
        unlocked: slot0[6],
        poolExample,
    };
}

async function main() {
    const provider = ethers.provider;
    const poolContract = new Contract(
        SRS_POOL, 
        UniswapV3Pool.abi,
        provider
    );
    const poolData = await getPoolData(poolContract);
    console.log("Pooldata", poolData);
}

/*
npx hardhat run --network localhost scripts/checkLiquidity.js
*/

main()
    .then(()=> process.exit(0))
    .catch((error)=>{
        console.error(error);
        process.exit(1);
    });
    

