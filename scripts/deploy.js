const hre = require("hardhat");

async function main() {
    
    // //ERC20 BOO TOKEN
    // const BooToken = await hre.ethers.getContractFactory("BooToken");
    // const booToken = await BooToken.deploy();
    // await booToken.deployed();
    // console.log(`BOO deployed to ${booToken.address}`);

    //  //ERC20 LIFE TOKEN
    //  const LifeToken = await hre.ethers.getContractFactory("LifeToken");
    //  const lifeToken = await LifeToken.deploy();
    //  await lifeToken.deployed();
    //  console.log(`Life deployed to ${lifeToken.address}`);

    //SingleSwapTOKEN
    const SingleSwapToken = await hre.ethers.getContractFactory("SingleSwapToken");
    const singleSwapToken = await SingleSwapToken.deploy();
    await singleSwapToken.deployed();
    console.log(`SingleSwapToken deployed to ${singleSwapToken.address}`);

    // //SwapMultipleHop
    // const SwapMultiHop = await hre.ethers.getContractFactory("SwapMultiHop");
    // const swapMultiHop = await SwapMultiHop.deploy();
    // await swapMultiHop.deployed();
    // console.log(`SwapMultiHop deployed to ${swapMultiHop.address}`);

}

main().catch((error)=> {
    console.error(error);
    process.exitCode = 1;
}); 