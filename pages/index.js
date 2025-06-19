// pages/index.js
import React from "react";
import Swap from "../Components/Swap";       // Adjust to match your file names
import Pool from "../Components/Pool";
import Stake from "../Components/Stake";
const Home = () => {
  return (
    <div>
      <h1>Welcome to Uniswap Clone</h1>
      <Swap />
      <Pool/>
      <Stake/>
    </div>
  );
};

export default Home;
