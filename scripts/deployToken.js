async function  main() {
    const [owner] = await ethers.getSigners();

    SRS = await ethers.getContractFactory("SRS");
    srs = await SRS.deploy();

    RSS = await ethers.getContractFactory("RSS");
    rss = await RSS.deploy();

    SSR = await ethers.getContractFactory("SSR");
    ssr = await SSR.deploy();


    console.log("srsAddress=", `'${srs.address}'`);
    console.log("rssAddress=", `'${rss.address}'`);
    console.log("ssrAddress=", `'${ssr.address}'`);
    console.log("Owner (deployer) address:", owner.address);

}

// npx hardhat run --network localhost  scripts/deployToken.js

main()
    .then(() => process.exit(0))
    .catch((error)=>{
        console.error(error);
        process.exit(1);
    });