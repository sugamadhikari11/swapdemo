// SPDX-License-Identifier: GPPL-2.0-or-later

pragma solidity >=0.7.0 < 0.9.0;

interface IWETH{
    function deposit() external payable;

    function withdraw(uint256) external;

    function totalSupply() external view returns (uint256);
    
    function balanceOf(address account) external view returns (uint256);
    
    function transfer(address recipient, uint amount) external view returns(uint);
    
    function allowance(address spender, uint amount) external view returns (uint);
    
    function approve(address spender, uint amount) external returns (bool);
    
    function transferFrom(address sender, address recipient, uint amount) external returns(bool);

    event Transfer(address indexed from, address indexed to, uint value);

    event Approve(address indexed owner, address indexed spender, uint value);
}