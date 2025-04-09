'use client'
import React, { useContext } from "react";
import { SwapTokenContext } from '../context/SwapContext';

export const Navbar = () => {
  const { ether, account, networkConnect } = useContext(SwapTokenContext);

  return (
    <nav>
      <div className="navbar-content">
        <h2>Navbar</h2>
        <div>
          <p><strong>Account:</strong> {account ? account : "Not Connected"}</p>
          <p><strong>Ether:</strong> {ether ? ether : "N/A"}</p>
          <p><strong>Network:</strong> {networkConnect ? networkConnect : "Not Connected"}</p>
        </div>
      </div>
    </nav>
  );
};
