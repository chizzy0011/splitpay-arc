// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {SplitPayEngine} from "../src/SplitPayEngine.sol";

contract SplitPayEngineTest is Test {
    SplitPayEngine internal engine;

    address internal alice = makeAddr("alice"); // sender
    address internal r1 = makeAddr("r1");
    address internal r2 = makeAddr("r2");
    address internal r3 = makeAddr("r3");

    function setUp() public {
        engine = new SplitPayEngine();
        vm.deal(alice, 1_000 ether);
    }

    // ------------------------------------------------------------------ //
    //  Provenance owner                                                   //
    // ------------------------------------------------------------------ //
    /// @dev owner() must return the deployer so provenance is verifiable
    ///      on-chain (e.g. Tally owner-proven registration). setUp deploys
    ///      the engine from this test contract, so it is the owner.
    function test_Owner_IsDeployer() public view {
        assertEq(engine.owner(), address(this), "owner() should be the deployer");
    }

    // ------------------------------------------------------------------ //
    //  executeSplit                                                       //
    // ------------------------------------------------------------------ //
    function test_Split_5050_Even() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = r2;
        uint256[] memory bps = new uint256[](2);
        bps[0] = 5_000;
        bps[1] = 5_000;

        vm.prank(alice);
        engine.executeSplit{value: 10 ether}(rec, bps);

        assertEq(r1.balance, 5 ether);
        assertEq(r2.balance, 5 ether);
        assertEq(address(engine).balance, 0, "no funds stranded");
    }

    /// @dev 100 wei split 3333/3333/3334 — proves dust goes to the last
    ///      recipient and the contract never strands value.
    function test_Split_DustGoesToLastRecipient() public {
        address[] memory rec = new address[](3);
        rec[0] = r1;
        rec[1] = r2;
        rec[2] = r3;
        uint256[] memory bps = new uint256[](3);
        bps[0] = 3_333;
        bps[1] = 3_333;
        bps[2] = 3_334;

        vm.prank(alice);
        engine.executeSplit{value: 100}(rec, bps);

        assertEq(r1.balance, 33); // floor(100 * 3333 / 10000)
        assertEq(r2.balance, 33);
        assertEq(r3.balance, 34); // remainder: 100 - 66
        assertEq(r1.balance + r2.balance + r3.balance, 100, "value conserved");
        assertEq(address(engine).balance, 0, "no dust stranded");
    }

    function test_Split_RevertsWhenBpsNot10000() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = r2;
        uint256[] memory bps = new uint256[](2);
        bps[0] = 4_000;
        bps[1] = 5_000; // totals 9000

        vm.prank(alice);
        vm.expectRevert("BPS must total 10000");
        engine.executeSplit{value: 1 ether}(rec, bps);
    }

    function test_Split_RevertsOnMismatchedArrays() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = r2;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10_000;

        vm.prank(alice);
        vm.expectRevert("Mismatched inputs");
        engine.executeSplit{value: 1 ether}(rec, bps);
    }

    function test_Split_RevertsOnZeroValue() public {
        address[] memory rec = new address[](1);
        rec[0] = r1;
        uint256[] memory bps = new uint256[](1);
        bps[0] = 10_000;

        vm.prank(alice);
        vm.expectRevert("Must send native USDC");
        engine.executeSplit{value: 0}(rec, bps);
    }

    function test_Split_RevertsOnZeroAddressRecipient() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = address(0);
        uint256[] memory bps = new uint256[](2);
        bps[0] = 5_000;
        bps[1] = 5_000;

        vm.prank(alice);
        vm.expectRevert("Invalid recipient");
        engine.executeSplit{value: 1 ether}(rec, bps);
    }

    // ------------------------------------------------------------------ //
    //  executeSplitAmounts (exact per-recipient amounts)                  //
    // ------------------------------------------------------------------ //
    function test_SplitAmounts_ExactPayouts() public {
        address[] memory rec = new address[](3);
        rec[0] = r1;
        rec[1] = r2;
        rec[2] = r3;
        uint256[] memory amt = new uint256[](3);
        amt[0] = 7 ether;
        amt[1] = 2 ether;
        amt[2] = 1 ether;

        vm.prank(alice);
        engine.executeSplitAmounts{value: 10 ether}(rec, amt);

        assertEq(r1.balance, 7 ether);
        assertEq(r2.balance, 2 ether);
        assertEq(r3.balance, 1 ether);
        assertEq(address(engine).balance, 0, "no funds stranded");
    }

    function test_SplitAmounts_RevertsWhenSumNotEqualValue() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = r2;
        uint256[] memory amt = new uint256[](2);
        amt[0] = 6 ether;
        amt[1] = 3 ether; // sums to 9, not 10

        vm.prank(alice);
        vm.expectRevert("Amounts must equal msg.value");
        engine.executeSplitAmounts{value: 10 ether}(rec, amt);
    }

    function test_SplitAmounts_RevertsOnZeroAmount() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = r2;
        uint256[] memory amt = new uint256[](2);
        amt[0] = 10 ether;
        amt[1] = 0;

        vm.prank(alice);
        vm.expectRevert("Zero amount");
        engine.executeSplitAmounts{value: 10 ether}(rec, amt);
    }

    function test_SplitAmounts_RevertsOnMismatchedArrays() public {
        address[] memory rec = new address[](2);
        rec[0] = r1;
        rec[1] = r2;
        uint256[] memory amt = new uint256[](1);
        amt[0] = 10 ether;

        vm.prank(alice);
        vm.expectRevert("Mismatched inputs");
        engine.executeSplitAmounts{value: 10 ether}(rec, amt);
    }

    // ------------------------------------------------------------------ //
    //  Escrow: release                                                    //
    // ------------------------------------------------------------------ //
    function test_Escrow_ReleaseAfterTimelock() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.warp(block.timestamp + 61);
        vm.prank(r1);
        engine.releaseEscrow(id);

        assertEq(r1.balance, 1 ether);
        assertEq(address(engine).balance, 0);
    }

    function test_Escrow_ReleaseRevertsBeforeTimelock() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.prank(r1);
        vm.expectRevert("Still time-locked");
        engine.releaseEscrow(id);
    }

    function test_Escrow_ReleaseRevertsForStranger() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.warp(block.timestamp + 61);
        vm.prank(r2); // neither sender nor recipient
        vm.expectRevert("Unauthorized");
        engine.releaseEscrow(id);
    }

    function test_Escrow_CannotReleaseTwice() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.warp(block.timestamp + 61);
        vm.prank(r1);
        engine.releaseEscrow(id);

        vm.prank(r1);
        vm.expectRevert("Already finalized");
        engine.releaseEscrow(id);
    }

    // ------------------------------------------------------------------ //
    //  Escrow: refund                                                     //
    // ------------------------------------------------------------------ //
    function test_Escrow_RefundBeforeTimelock() public {
        uint256 before = alice.balance;

        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.prank(alice);
        engine.refundEscrow(id);

        assertEq(alice.balance, before, "sender made whole");
        assertEq(address(engine).balance, 0);
    }

    function test_Escrow_RefundRevertsAfterTimelock() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.warp(block.timestamp + 61);
        vm.prank(alice);
        vm.expectRevert("Lock expired; use release");
        engine.refundEscrow(id);
    }

    function test_Escrow_RefundRevertsForNonSender() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.prank(r1); // recipient can't refund
        vm.expectRevert("Only sender");
        engine.refundEscrow(id);
    }

    function test_Escrow_CannotRefundAfterRelease() public {
        vm.prank(alice);
        uint256 id = engine.createEscrow{value: 1 ether}(r1, 60);

        vm.warp(block.timestamp + 61);
        vm.prank(r1);
        engine.releaseEscrow(id);

        vm.prank(alice);
        vm.expectRevert(); // finalized (and lock already expired)
        engine.refundEscrow(id);
    }
}
