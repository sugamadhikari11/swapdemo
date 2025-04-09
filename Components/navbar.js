'use client'
import React, { useContext } from "react";
import { SwapTokenContext } from '../context/SwapContext';

export const Navbar = () => {
  const { connectWallet, ether, account, networkConnect, tokenData } = useContext(SwapTokenContext);

  return (
    <nav>
      <div className="navbar-content">
        <h2>Navbar</h2>
        <div>
          <p><strong>Account:</strong> {account ? account : "Not Connected"}</p>
          <p><strong>Ether:</strong> {ether ? ether : "N/A"}</p>
          <p><strong>Network:</strong> {networkConnect ? networkConnect : "Not Connected"}</p>
        </div>

        {/* Show Connect Wallet button if account is not connected */}
        {!account && (
          <button onClick={connectWallet} className="connect-wallet-btn">
            Connect Wallet
          </button>
        )}

        {/* Display token data */}
        {tokenData && tokenData.length > 0 && (
          <div className="token-data">
            <h3>Token Balances</h3>
            {tokenData.map((token, index) => (
              <div key={index} className="token-item">
                <p><strong>{token.name} ({token.symbol})</strong></p>
                <p>Balance: {token.tokenBalance}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};
