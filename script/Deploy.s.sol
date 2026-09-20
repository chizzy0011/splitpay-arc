// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {SplitPayEngine} from "../src/SplitPayEngine.sol";

/**
 * @notice Deploys SplitPayEngine.
 *
 * Testnet (Chain ID 5042002):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url arc_testnet --broadcast
 *
 * Mainnet (Chain ID 5042) — spends REAL USDC gas, run only when ready:
 *   forge script script/Deploy.s.sol:Deploy --rpc-url arc_mainnet --broadcast
 */
contract Deploy is Script {
    function run() external returns (SplitPayEngine engine) {
        uint256 pk = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(pk);
        engine = new SplitPayEngine();
        vm.stopBroadcast();

        console2.log("SplitPayEngine deployed at:", address(engine));
        console2.log("Chain ID:", block.chainid);
    }
}
