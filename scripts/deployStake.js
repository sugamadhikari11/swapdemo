const { ethers, network, run } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("----------------------------------------------------");
  console.log("🚀 Deploying contracts with the account:", deployer.address);
  console.log("💰 Account balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");
  console.log("----------------------------------------------------");

  const SepoliaStaking = await ethers.getContractFactory("SepoliaStaking");
  console.log("⏳ Deploying SepoliaStaking...");

  // ✅ Add EIP-1559 gas settings here
  const sepoliaStaking = await SepoliaStaking.deploy({
    maxFeePerGas: ethers.utils.parseUnits("3", "gwei"),           // 2 gwei
    maxPriorityFeePerGas: ethers.utils.parseUnits("1.5", "gwei"), // 1.5 gwei tip
  });

  await sepoliaStaking.deployed();

  console.log("✅ SepoliaStaking deployed to:", sepoliaStaking.address);
  console.log("----------------------------------------------------");

  if (network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("🔍 Waiting for a few block confirmations before verification...");
    await sepoliaStaking.deployTransaction.wait(5);
    try {
      console.log("🚀 Verifying contract on Etherscan...");
      await run("verify:verify", {
        address: sepoliaStaking.address,
        constructorArguments: [],
      });
      console.log("🎉 Contract verified successfully on Etherscan!");
    } catch (error) {
      if (error.message.includes("Reason: Already Verified")) {
        console.log("ℹ️ Contract is already verified on Etherscan!");
      } else {
        console.error("❌ Error verifying contract:", error);
      }
    }
    console.log("----------------------------------------------------");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
