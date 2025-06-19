import {ethers, BigNumber, Signer} from "ethers";
import axios  from "axios";
import Web3Modal from "web3modal";
import { MIXED_ROUTE_QUOTER_V1_ADDRESSES } from "@uniswap/smart-order-router";

const bn = require("bignumber.js");
bn.config({EXPONENTIAL_AT: 999999, DECIMAL_PLACES:40});

const UNISWAP_V3_FACTORY_ADDRESS = '0xa85233C63b9Ee964Add6F2cffe00Fd84eb32338f';
const NON_FUNABLE_MANAGER = '0xc5a5C42992dECbae36851359345FE25997F5C42d';
const artifacts = {
    UniswapV3Factory: require("@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json"),
    NonfungiblePositionManager: require("@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json"),
};

export const fetchPoolContract = (signerOrProvider) =>
    new ethers.Contract(
        UNISWAP_V3_FACTORY_ADDRESS,
        artifacts.UniswapV3Factory.abi,
        signerOrProvider
    );

export const fetchPositionContract = (signerOrProvider) =>
    new ethers.Contract(
        NON_FUNABLE_MANAGER,
        artifacts.NonfungiblePositionManager.abi,
        signerOrProvider
);

const encodePriceSqrt = (reserve1, reserve0) => {
    return BigNumber.from(
        new bn(reserve1.toString())
            .div(reserve0.toString())
            .sqrt()
            .multipliedBy(new bn(2).pow(96))
            .integerValue(3)
            .toString()
    );
};

export const connectingWithPoolContract = async(
    address1,
    address2,
    fee, 
    tokenFee1,
    tokenFee2
) => {
    const web3modal = new Web3Modal();
    const connection = await web3modal.connect();

    const provider = new ethers.providers.Web3Provider(connection);
    await provider.send("eth_requestAccounts", []); // 🔐 Add this
    const signer = provider.getSigner();

    const address = await signer.getAddress(); // 🧾 Validate
    console.log("Signer address:", address); // Should not be null

    console.log(signer);
    console.log("Token0:", address1);
    console.log("Token1:", address2);
    console.log("Fee:", fee);
 

        
    const createPoolContract = await fetchPositionContract(signer);
    const price = encodePriceSqrt(tokenFee1, tokenFee2);
    console.log("Encoded Price:", price.toString());
    console.log(price);
    const transaction = await createPoolContract
        .connect(signer)
        .createAndInitializePoolIfNecessary(address1, address2, fee, price,{
            gasLimit: 5000000,
        });

    await transaction.wait();

    const factory = await fetchPoolContract(signer);
    const poolAddress = await factory.getPool(address1, address2, fee);
    
    return poolAddress;

};
