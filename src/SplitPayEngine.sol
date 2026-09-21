// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SplitPayEngine
 * @notice Programmatic native-USDC payout splitter + cancellable time-locked
 *         vault for Arc Mainnet (Chain ID 5042).
 * @dev    Assumes USDC is Arc's native gas/settlement asset, so `msg.value`
 *         denominates USDC and value transfers move dollars directly.
 *
 *         Two primitives:
 *           1. executeSplit  — atomic multi-recipient split in one tx (basis points).
 *           2. Escrow vault  — sender locks funds for a recipient until `releaseTime`.
 *              - After releaseTime: recipient (or sender) can release to recipient.
 *              - Before releaseTime: sender can cancel and reclaim (refund).
 *
 *         This is an honest description of the primitive: a CANCELLABLE
 *         time-locked vault. It is NOT milestone/multi-sig escrow — do not
 *         market it as such.
 */
contract SplitPayEngine {
    // --------------------------------------------------------------------- //
    //  Reentrancy guard (minimal, no external dependency)                    //
    // --------------------------------------------------------------------- //
    uint256 private _lock = 1;
    modifier nonReentrant() {
        require(_lock == 1, "Reentrancy");
        _lock = 2;
        _;
        _lock = 1;
    }

    // --------------------------------------------------------------------- //
    //  Provenance owner                                                      //
    // --------------------------------------------------------------------- //
    /// @notice The deployer, exposed via `owner()` so contract provenance can
    ///         be proven on-chain (e.g. Tally's owner-proven registration).
    /// @dev    This is an identity marker only. There are NO owner-only
    ///         functions, so it grants no privileges and adds no attack
    ///         surface: the splitter and vault stay fully permissionless.
    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    /// @dev Splits are expressed in basis points so 33.33% etc. is representable.
    uint256 private constant BPS_DENOMINATOR = 10_000;

    struct Escrow {
        address sender;
        address recipient;
        uint256 amount;
        uint256 releaseTime;
        bool finalized; // true once released OR refunded (single terminal state)
    }

    uint256 public nextEscrowId;
    mapping(uint256 => Escrow) public escrows;

    event PaymentSplit(address indexed sender, uint256 totalAmount, uint256 recipientCount);
    event EscrowCreated(
        uint256 indexed escrowId,
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 releaseTime
    );
    event EscrowReleased(uint256 indexed escrowId, address indexed recipient, uint256 amount);
    event EscrowRefunded(uint256 indexed escrowId, address indexed sender, uint256 amount);

    // --------------------------------------------------------------------- //
    //  Atomic split                                                          //
    // --------------------------------------------------------------------- //
    /**
     * @param _recipients payout wallets
     * @param _bps        share per recipient in basis points; must total 10000
     * @dev   The final recipient absorbs any rounding dust so the contract
     *        never strands funds (sum of transfers == msg.value exactly).
     */
    function executeSplit(address[] calldata _recipients, uint256[] calldata _bps)
        external
        payable
        nonReentrant
    {
        uint256 len = _recipients.length;
        require(len > 0, "No recipients");
        require(len == _bps.length, "Mismatched inputs");
        require(msg.value > 0, "Must send native USDC");

        uint256 totalBps;
        for (uint256 i = 0; i < len; i++) {
            totalBps += _bps[i];
        }
        require(totalBps == BPS_DENOMINATOR, "BPS must total 10000");

        uint256 distributed;
        for (uint256 i = 0; i < len; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");

            uint256 share;
            if (i == len - 1) {
                share = msg.value - distributed; // dust-safe remainder
            } else {
                share = (msg.value * _bps[i]) / BPS_DENOMINATOR;
                distributed += share;
            }

            (bool ok, ) = payable(_recipients[i]).call{value: share}("");
            require(ok, "Transfer failed");
        }

        emit PaymentSplit(msg.sender, msg.value, len);
    }

    /**
     * @notice Split by explicit per-recipient USDC amounts (not percentages).
     * @param _recipients payout wallets
     * @param _amounts    exact native-USDC amount per recipient; the sum MUST
     *                    equal msg.value, so nothing is stranded or short.
     * @dev   This is the exact-amount counterpart to executeSplit. No rounding:
     *        each recipient receives precisely _amounts[i].
     */
    function executeSplitAmounts(address[] calldata _recipients, uint256[] calldata _amounts)
        external
        payable
        nonReentrant
    {
        uint256 len = _recipients.length;
        require(len > 0, "No recipients");
        require(len == _amounts.length, "Mismatched inputs");
        require(msg.value > 0, "Must send native USDC");

        uint256 total;
        for (uint256 i = 0; i < len; i++) {
            total += _amounts[i];
        }
        require(total == msg.value, "Amounts must equal msg.value");

        for (uint256 i = 0; i < len; i++) {
            require(_recipients[i] != address(0), "Invalid recipient");
            require(_amounts[i] > 0, "Zero amount");

            (bool ok, ) = payable(_recipients[i]).call{value: _amounts[i]}("");
            require(ok, "Transfer failed");
        }

        emit PaymentSplit(msg.sender, msg.value, len);
    }

    // --------------------------------------------------------------------- //
    //  Cancellable time-locked vault                                         //
    // --------------------------------------------------------------------- //
    function createEscrow(address _recipient, uint256 _durationSeconds)
        external
        payable
        returns (uint256 escrowId)
    {
        require(msg.value > 0, "Escrow amount must be > 0");
        require(_recipient != address(0), "Invalid recipient");

        escrowId = nextEscrowId++;
        uint256 releaseTime = block.timestamp + _durationSeconds;

        escrows[escrowId] = Escrow({
            sender: msg.sender,
            recipient: _recipient,
            amount: msg.value,
            releaseTime: releaseTime,
            finalized: false
        });

        emit EscrowCreated(escrowId, msg.sender, _recipient, msg.value, releaseTime);
    }

    /// @notice Pay the recipient after the lock expires.
    function releaseEscrow(uint256 _escrowId) external nonReentrant {
        Escrow storage item = escrows[_escrowId];
        require(!item.finalized, "Already finalized");
        require(block.timestamp >= item.releaseTime, "Still time-locked");
        require(msg.sender == item.recipient || msg.sender == item.sender, "Unauthorized");

        item.finalized = true; // checks-effects-interactions
        uint256 amount = item.amount;

        (bool ok, ) = payable(item.recipient).call{value: amount}("");
        require(ok, "Release transfer failed");

        emit EscrowReleased(_escrowId, item.recipient, amount);
    }

    /// @notice Sender reclaims funds — only allowed BEFORE the lock expires.
    function refundEscrow(uint256 _escrowId) external nonReentrant {
        Escrow storage item = escrows[_escrowId];
        require(!item.finalized, "Already finalized");
        require(msg.sender == item.sender, "Only sender");
        require(block.timestamp < item.releaseTime, "Lock expired; use release");

        item.finalized = true; // checks-effects-interactions
        uint256 amount = item.amount;

        (bool ok, ) = payable(item.sender).call{value: amount}("");
        require(ok, "Refund transfer failed");

        emit EscrowRefunded(_escrowId, item.sender, amount);
    }
}
