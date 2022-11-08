// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

contract BrokenWallet {
    receive() external payable {
        revert("Broken Wallet");
    }
}
