import Web3Modal from "web3modal";
import { Contract, ethers } from "ethers";
import {Token} from "@uniswap/sdk-core";
import {NonfungiblePositionManager, Pool, Position, nearestUsableTick} from "@uniswap/v3-sdk";

// Uniswap contract Addresses
const positionManagerAddress='0xc5a5C42992dECbae36851359345FE25997F5C42d'

const artifacts = {
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
    UniswapV3Pool: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"),
    WETH9: require("../context/WETH9.json"),
};

async function getPoolData(poolContract) {
    const [tickSpacing, fee, liquidity, slot0] = await Promise.all([
        poolContract.tickSpacing(),
        poolContract.fee(),
        poolContract.liquidity(),
        poolContract.slot0(),
    ]);

    return{
        tickSpacing: tickSpacing,
        fee: fee,
        liquidity: liquidity,
        sqrtPriceX96: slot0[0],
        tick: slot0[1],
    };    
}

export const addLiquidityExternal = async(
    tokenAddress1,
    tokenAddress2,
    poolAddress,
    poolFee,
    tokenAmount1,
    tokenAmount2
) => {
    try {
        const web3modal = new Web3Modal();
        const connection = await web3modal.connect();
        const provider = new ethers.providers.Web3Provider(connection);
        const signer = provider.getSigner();
        const accountAddress = await signer.getAddress();

        const token1Contract = new Contract(
            tokenAddress1,
            artifacts.WETH9.abi,
            provider
        );

        const token2Contract = new Contract(
            tokenAddress2,
            artifacts.WETH9.abi,
            provider
        );

        // Approve tokens
        await token1Contract
            .connect(signer)
            .approve(
                positionManagerAddress,
                ethers.utils.parseEther(tokenAmount1.toString())
            );
        await token2Contract
            .connect(signer)
            .approve(
                positionManagerAddress,
                ethers.utils.parseEther(tokenAmount2.toString())
            );

        const poolContract = new Contract(
            poolAddress,
            artifacts.UniswapV3Pool.abi,
            provider
        );

        const {chainId} = await provider.getNetwork();

        // Get token details
        const [token1Name, token1Symbol, token1Decimals, token2Name, token2Symbol, token2Decimals] = await Promise.all([
            token1Contract.name(),
            token1Contract.symbol(),
            token1Contract.decimals(),
            token2Contract.name(),
            token2Contract.symbol(),
            token2Contract.decimals()
        ]);

        // Create Token objects
        const TokenA = new Token(
            chainId,
            tokenAddress1,
            token1Decimals,
            token1Symbol,
            token1Name
        );
        const TokenB = new Token(
            chainId,
            tokenAddress2,
            token2Decimals,
            token2Symbol,
            token2Name
        );

        // Get pool data
        const poolData = await getPoolData(poolContract);
        console.log("Pool Data:", poolData);

        // Validate tick is within bounds
        const MIN_TICK = -887272;
        const MAX_TICK = 887272;
        
        if (poolData.tick < MIN_TICK || poolData.tick > MAX_TICK) {
            throw new Error(`Invalid tick: ${poolData.tick}. Must be between ${MIN_TICK} and ${MAX_TICK}`);
        }

        // Create Pool instance - Fix: Pass tick as the last parameter
        const pool = new Pool(
            TokenA,
            TokenB,
            poolData.fee,
            poolData.sqrtPriceX96.toString(),
            poolData.liquidity.toString(),
            poolData.tick // This was missing! This is crucial for the Pool constructor
        );

        // Calculate tick bounds with proper validation
        const tickLower = nearestUsableTick(poolData.tick - poolData.tickSpacing * 2, poolData.tickSpacing);
        const tickUpper = nearestUsableTick(poolData.tick + poolData.tickSpacing * 2, poolData.tickSpacing);

        console.log("Tick bounds:", { tickLower, tickUpper, currentTick: poolData.tick });

        // Validate tick bounds
        if (tickLower >= tickUpper) {
            throw new Error(`Invalid tick range: tickLower (${tickLower}) must be less than tickUpper (${tickUpper})`);
        }

        // Create position with proper liquidity calculation
        const liquidityAmount = ethers.utils.parseEther("0.1"); // Start with smaller amount for testing
        
        const position = new Position({
            pool: pool,
            liquidity: liquidityAmount.toString(),
            tickLower: tickLower,
            tickUpper: tickUpper,
        });

        const {amount0: amount0Desired, amount1: amount1Desired} = position.mintAmounts;

        console.log("Mint amounts:", {
            amount0Desired: amount0Desired.toString(),
            amount1Desired: amount1Desired.toString()
        });

        // Ensure token addresses are in correct order (token0 < token1)
        const [token0Address, token1Address] = tokenAddress1.toLowerCase() < tokenAddress2.toLowerCase() 
            ? [tokenAddress1, tokenAddress2] 
            : [tokenAddress2, tokenAddress1];

        const params = {
            token0: token0Address,
            token1: token1Address,
            fee: poolData.fee,
            tickLower: tickLower,
            tickUpper: tickUpper,
            amount0Desired: amount0Desired.toString(),
            amount1Desired: amount1Desired.toString(), // Fixed typo: was "amoount1Desired"
            amount0Min: 0,
            amount1Min: 0,
            recipient: accountAddress,
            deadline: Math.floor(Date.now()/1000) + 60 * 20, // 20 minutes from now
        };

        console.log("Mint params:", params);

        const NonfungiblePositionManager = new Contract(
            positionManagerAddress,
            artifacts.NonfungiblePositionManager.abi,
            provider
        );

        // Execute transaction with proper gas settings
        const tx = await NonfungiblePositionManager.connect(signer).mint(params, {
            gasLimit: ethers.BigNumber.from("5000000"), // Increased gas limit
            maxFeePerGas: ethers.utils.parseUnits("30", "gwei"),
            maxPriorityFeePerGas: ethers.utils.parseUnits("2", "gwei")
        });

        console.log("Transaction sent:", tx.hash);
        const receipt = await tx.wait();
        console.log("Liquidity added successfully!", receipt);
        
        return receipt;

    } catch (error) {
        console.error("Error in addLiquidityExternal:", error);
        
        // Provide specific error handling
        if (error.message.includes("TICK")) {
            console.error("Tick validation failed. Check pool state and tick bounds.");
        }
        if (error.message.includes("Invariant")) {
            console.error("Invariant failed. This usually means invalid parameters passed to Uniswap SDK.");
        }
        
        throw error;
    }
}