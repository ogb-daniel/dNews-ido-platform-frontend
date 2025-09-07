// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vesting Contract for TRUTH Token
 * @dev Linear vesting contract with cliff periods
 * Supports multiple beneficiaries with different vesting schedules
 */
contract VestingContract is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct VestingSchedule {
        uint256 totalAmount;        // Total tokens to vest
        uint256 releasedAmount;     // Amount already released
        uint256 startTime;          // Vesting start time
        uint256 cliffDuration;      // Cliff period in seconds
        uint256 duration;           // Total vesting duration in seconds
        bool revocable;             // Can this vesting be revoked
        bool revoked;               // Has this vesting been revoked
    }

    IERC20 public immutable token;
    
    mapping(address => VestingSchedule) public vestingSchedules;
    address[] public beneficiaries;
    
    uint256 public totalVestingAmount;
    uint256 public totalReleasedAmount;

    // Events
    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);

    // Custom errors
    error VestingNotFound();
    error VestingAlreadyExists();
    error CliffNotCompleted();
    error VestingAlreadyRevoked();
    error VestingNotRevocable();
    error NoTokensToRelease();
    error InsufficientContractBalance();

    constructor(address _token) Ownable(msg.sender) {
        require(_token != address(0), "Invalid token address");
        token = IERC20(_token);
    }

    /**
     * @dev Creates a vesting schedule for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @param totalAmount Total amount of tokens to vest
     * @param cliffDuration Duration of cliff period in seconds
     * @param duration Total vesting duration in seconds
     * @param revocable Whether the vesting can be revoked
     */
    function createVestingSchedule(
        address beneficiary,
        uint256 totalAmount,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable
    ) external onlyOwner {
        require(beneficiary != address(0), "Invalid beneficiary address");
        require(totalAmount > 0, "Total amount must be positive");
        require(duration > 0, "Duration must be positive");
        require(cliffDuration <= duration, "Cliff duration cannot exceed total duration");
        
        // Check if beneficiary already has a vesting schedule
        if (vestingSchedules[beneficiary].totalAmount > 0) {
            revert VestingAlreadyExists();
        }

        // Check contract has enough tokens
        uint256 availableTokens = token.balanceOf(address(this));
        require(availableTokens >= totalVestingAmount + totalAmount, "Insufficient contract balance");

        // Create vesting schedule
        vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: totalAmount,
            releasedAmount: 0,
            startTime: block.timestamp,
            cliffDuration: cliffDuration,
            duration: duration,
            revocable: revocable,
            revoked: false
        });

        beneficiaries.push(beneficiary);
        totalVestingAmount += totalAmount;

        emit VestingScheduleCreated(beneficiary, totalAmount, cliffDuration, duration, revocable);
    }

    /**
     * @dev Releases vested tokens for the caller
     */
    function release() external nonReentrant {
        _release(msg.sender);
    }

    /**
     * @dev Releases vested tokens for a specific beneficiary (can be called by anyone)
     * @param beneficiary Address of the beneficiary
     */
    function releaseFor(address beneficiary) external nonReentrant {
        _release(beneficiary);
    }

    /**
     * @dev Internal function to release vested tokens
     * @param beneficiary Address of the beneficiary
     */
    function _release(address beneficiary) internal {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0) revert VestingNotFound();
        if (schedule.revoked) revert VestingAlreadyRevoked();

        uint256 releasableTokens = _releasableAmount(beneficiary);
        if (releasableTokens == 0) revert NoTokensToRelease();

        schedule.releasedAmount += releasableTokens;
        totalReleasedAmount += releasableTokens;

        token.safeTransfer(beneficiary, releasableTokens);
        emit TokensReleased(beneficiary, releasableTokens);
    }

    /**
     * @dev Revokes a vesting schedule (if revocable)
     * @param beneficiary Address of the beneficiary
     */
    function revoke(address beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0) revert VestingNotFound();
        if (!schedule.revocable) revert VestingNotRevocable();
        if (schedule.revoked) return; // Already revoked

        // Release any vested tokens first
        uint256 releasableTokens = _releasableAmount(beneficiary);
        if (releasableTokens > 0) {
            schedule.releasedAmount += releasableTokens;
            totalReleasedAmount += releasableTokens;
            token.safeTransfer(beneficiary, releasableTokens);
            emit TokensReleased(beneficiary, releasableTokens);
        }

        // Mark as revoked
        schedule.revoked = true;
        
        // Return unvested tokens to owner
        uint256 unvestedAmount = schedule.totalAmount - schedule.releasedAmount;
        if (unvestedAmount > 0) {
            totalVestingAmount -= unvestedAmount;
            token.safeTransfer(owner(), unvestedAmount);
        }

        emit VestingRevoked(beneficiary);
    }

    /**
     * @dev Calculates the releasable amount for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return uint256 Amount of tokens that can be released
     */
    function releasableAmount(address beneficiary) external view returns (uint256) {
        return _releasableAmount(beneficiary);
    }

    /**
     * @dev Internal function to calculate releasable amount
     * @param beneficiary Address of the beneficiary
     * @return uint256 Amount of tokens that can be released
     */
    function _releasableAmount(address beneficiary) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0 || schedule.revoked) return 0;

        // Check if cliff period has passed
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        // Calculate vested amount
        uint256 vestedTokens = _vestedAmount(beneficiary);
        return vestedTokens - schedule.releasedAmount;
    }

    /**
     * @dev Calculates the vested amount for a beneficiary
     * @param beneficiary Address of the beneficiary
     * @return uint256 Amount of tokens that have vested
     */
    function vestedAmount(address beneficiary) external view returns (uint256) {
        return _vestedAmount(beneficiary);
    }

    /**
     * @dev Internal function to calculate vested amount
     * @param beneficiary Address of the beneficiary
     * @return uint256 Amount of tokens that have vested
     */
    function _vestedAmount(address beneficiary) internal view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        
        if (schedule.totalAmount == 0) return 0;

        // If revoked, return only what was already released
        if (schedule.revoked) return schedule.releasedAmount;

        // If before cliff, no tokens are vested
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        // If fully vested
        if (block.timestamp >= schedule.startTime + schedule.duration) {
            return schedule.totalAmount;
        }

        // Linear vesting calculation
        uint256 timeVested = block.timestamp - schedule.startTime;
        return (schedule.totalAmount * timeVested) / schedule.duration;
    }

    /**
     * @dev Gets vesting schedule information for a beneficiary
     * @param beneficiary Address of the beneficiary
     */
    function getVestingSchedule(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 duration,
        bool revocable,
        bool revoked,
        uint256 vested,
        uint256 releasable
    ) {
        VestingSchedule memory schedule = vestingSchedules[beneficiary];
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            schedule.startTime,
            schedule.cliffDuration,
            schedule.duration,
            schedule.revocable,
            schedule.revoked,
            _vestedAmount(beneficiary),
            _releasableAmount(beneficiary)
        );
    }

    /**
     * @dev Returns all beneficiaries
     */
    function getBeneficiaries() external view returns (address[] memory) {
        return beneficiaries;
    }

    /**
     * @dev Returns the number of beneficiaries
     */
    function getBeneficiariesCount() external view returns (uint256) {
        return beneficiaries.length;
    }

    /**
     * @dev Emergency function to withdraw tokens (only owner)
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        uint256 availableAmount = token.balanceOf(address(this)) - (totalVestingAmount - totalReleasedAmount);
        require(amount <= availableAmount, "Insufficient available balance");
        token.safeTransfer(owner(), amount);
    }
}