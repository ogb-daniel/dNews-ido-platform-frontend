// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TRUTH Token Contract
 * @dev ERC-20 token for dNews platform with advanced features
 * - Fixed supply of 1 billion tokens
 * - Burnable tokens for deflationary mechanics
 * - Pausable transfers for emergency situations
 * - Blacklist functionality for malicious actors
 * - Gas optimized for efficient transfers
 */
contract TruthToken is ERC20, ERC20Burnable, Pausable, Ownable, ReentrancyGuard {
    // Token Distribution Constants
    uint256 public constant TOTAL_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens
    uint256 public constant COMMUNITY_REWARDS = 400_000_000 * 10**18; // 40%
    uint256 public constant TEAM_ALLOCATION = 200_000_000 * 10**18; // 20%
    uint256 public constant IDO_ALLOCATION = 150_000_000 * 10**18; // 15%
    uint256 public constant DAO_TREASURY = 150_000_000 * 10**18; // 15%
    uint256 public constant PRIVATE_INVESTORS = 100_000_000 * 10**18; // 10%

    // Blacklist mapping
    mapping(address => bool) private _blacklisted;

    // Rate limiting for large transfers
    mapping(address => uint256) private _lastTransferTime;
    uint256 public constant RATE_LIMIT_DELAY = 1 minutes;
    uint256 public constant LARGE_TRANSFER_THRESHOLD = 1_000_000 * 10**18; // 1M tokens

    // Events
    event AddressBlacklisted(address indexed account);
    event AddressUnblacklisted(address indexed account);
    event TokensDistributed(address indexed to, uint256 amount, string category);

    // Custom errors for gas efficiency
    error AccountBlacklisted(address account);
    error TransferRateLimited(address account);
    error InvalidAllocation();

    constructor(
        string memory name,
        string memory symbol,
        uint256 totalSupply,
        address treasury,
        address team
    ) ERC20(name, symbol) Ownable(msg.sender) {
        require(totalSupply == TOTAL_SUPPLY, "Invalid total supply");
        require(treasury != address(0), "Treasury address cannot be zero");
        require(team != address(0), "Team address cannot be zero");

        // Mint total supply to owner for initial distribution
        _mint(msg.sender, totalSupply);
    }

    /**
     * @dev Distributes tokens according to tokenomics
     * @param treasury Address for community rewards and DAO treasury
     * @param team Address for team allocation
     * @param ido Address for IDO contract
     * @param investors Address for private investors
     */
    function distributeTokens(
        address treasury,
        address team,
        address ido,
        address investors
    ) external onlyOwner {
        require(treasury != address(0), "Treasury address cannot be zero");
        require(team != address(0), "Team address cannot be zero");
        require(ido != address(0), "IDO address cannot be zero");
        require(investors != address(0), "Investors address cannot be zero");

        // Transfer allocations
        _transfer(owner(), treasury, COMMUNITY_REWARDS + DAO_TREASURY);
        _transfer(owner(), team, TEAM_ALLOCATION);
        _transfer(owner(), ido, IDO_ALLOCATION);
        _transfer(owner(), investors, PRIVATE_INVESTORS);

        emit TokensDistributed(treasury, COMMUNITY_REWARDS + DAO_TREASURY, "Community + DAO");
        emit TokensDistributed(team, TEAM_ALLOCATION, "Team");
        emit TokensDistributed(ido, IDO_ALLOCATION, "IDO");
        emit TokensDistributed(investors, PRIVATE_INVESTORS, "Private Investors");
    }

    /**
     * @dev Blacklists an address to prevent transfers
     * @param account Address to blacklist
     */
    function blacklistAddress(address account) external onlyOwner {
        require(account != address(0), "Cannot blacklist zero address");
        require(!_blacklisted[account], "Address already blacklisted");
        
        _blacklisted[account] = true;
        emit AddressBlacklisted(account);
    }

    /**
     * @dev Removes an address from blacklist
     * @param account Address to remove from blacklist
     */
    function unblacklistAddress(address account) external onlyOwner {
        require(_blacklisted[account], "Address not blacklisted");
        
        _blacklisted[account] = false;
        emit AddressUnblacklisted(account);
    }

    /**
     * @dev Checks if an address is blacklisted
     * @param account Address to check
     * @return bool True if blacklisted
     */
    function isBlacklisted(address account) external view returns (bool) {
        return _blacklisted[account];
    }

    /**
     * @dev Pauses all token transfers
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Override _update to add blacklist and pause checks
     */
    function _update(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        // Check blacklist
        if (_blacklisted[from]) revert AccountBlacklisted(from);
        if (_blacklisted[to]) revert AccountBlacklisted(to);

        // Rate limiting for large transfers
        if (amount >= LARGE_TRANSFER_THRESHOLD && from != address(0)) {
            if (block.timestamp - _lastTransferTime[from] < RATE_LIMIT_DELAY) {
                revert TransferRateLimited(from);
            }
            _lastTransferTime[from] = block.timestamp;
        }

        super._update(from, to, amount);
    }

    /**
     * @dev Burns tokens from caller's account
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) public override nonReentrant {
        super.burn(amount);
    }

    /**
     * @dev Burns tokens from specified account (with allowance)
     * @param account Account to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burnFrom(address account, uint256 amount) public override nonReentrant {
        super.burnFrom(account, amount);
    }

    /**
     * @dev Emergency function to recover accidentally sent ERC20 tokens
     * @param token Address of the token to recover
     * @param amount Amount to recover
     */
    function recoverERC20(address token, uint256 amount) external onlyOwner {
        require(token != address(this), "Cannot recover TRUTH tokens");
        IERC20(token).transfer(owner(), amount);
    }

    /**
     * @dev Returns the remaining time for rate limit for large transfers
     * @param account Address to check
     * @return uint256 Remaining time in seconds
     */
    function getRateLimitRemainingTime(address account) external view returns (uint256) {
        uint256 lastTransfer = _lastTransferTime[account];
        if (lastTransfer == 0) return 0;
        
        uint256 elapsed = block.timestamp - lastTransfer;
        if (elapsed >= RATE_LIMIT_DELAY) return 0;
        
        return RATE_LIMIT_DELAY - elapsed;
    }
}