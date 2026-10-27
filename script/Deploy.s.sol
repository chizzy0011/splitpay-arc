// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {SplitPayEngine} from "../src/SplitPayEngine.sol";

/**
 * @notice Deploys SplitPayEngine.
 *
 * Testnet (an RPC name from foundry.toml, or a URL):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url arc_testnet --broadcast
 *
 * Live network (spends real gas, run only when ready; add --legacy where the
 * chain does not use EIP-1559 fees):
 *   forge script script/Deploy.s.sol:Deploy --rpc-url bot --broadcast --legacy
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
