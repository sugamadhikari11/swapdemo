const axios = require("axios");

const ETHERSCAN_API_KEY = "S7J2EF8T3ZY16JSSAK2SGH5BYRC98F3WKZ";


exports.getAbi = async(address)=>{
    const url = `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${ETHERSCAN_API_KEY}`;
    const res = await axios.get(url);
    const abi = JSON.parse(res.data.result);
    return abi;
}

exports.getPoolImmutables = async(poolContract)=>{
    const [token0, token1, fee] = await Promise.all([
        poolContract.token0(),
        poolContract.token1(),
        poolContract.fee()
    ]);

    const immutables= {
        token0: token0,
        token1: token1,
        fee: fee,
    };
    return immutables;
}