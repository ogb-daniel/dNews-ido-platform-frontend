// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title IDO Contract for TRUTH Token
 * @dev Initial DEX Offering contract that accepts PAU Dollar (pUSD) as payment
 * Features:
 * - Multi-phase sale (Preparation, Active, Finalization, Claim)
 * - Contribution limits per address
 * - Soft/Hard cap mechanism
 * - Refund system if soft cap not met
 * - Whitelist functionality
 */
contract IDOContract is Pausable, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Sale phases
    enum Phase {
        PREPARATION,
        ACTIVE,
        FINALIZATION,
        CLAIM,
        ENDED
    }

    // Token interfaces
    IERC20 public immutable truthToken;
    IERC20 public immutable pUSDToken;

    // Sale configuration
    uint256 public immutable tokenPrice; // pUSD per TRUTH (scaled by 10^18)
    uint256 public immutable tokensForSale;
    uint256 public immutable softCap;
    uint256 public immutable hardCap;
    uint256 public immutable minContribution;
    uint256 public immutable maxContribution;
    uint256 public immutable saleDuration;

    // Sale state
    Phase public currentPhase = Phase.PREPARATION;
    uint256 public saleStartTime;
    uint256 public saleEndTime;
    uint256 public totalRaised;
    uint256 public totalParticipants;
    bool public saleFinalized;

    // User data
    mapping(address => uint256) public contributions; // pUSD contributed by user
    mapping(address => uint256) public tokenAllocations; // TRUTH tokens allocated to user
    mapping(address => bool) public hasClaimed;
    mapping(address => bool) public hasRefunded;
    mapping(address => bool) public whitelist;
    
    // Settings
    bool public whitelistEnabled = false;

    // Events
    event SaleStarted(uint256 startTime, uint256 endTime);
    event TokensPurchased(address indexed buyer, uint256 pUSDAmount, uint256 truthAmount);
    event TokensClaimed(address indexed claimer, uint256 amount);
    event RefundClaimed(address indexed claimer, uint256 amount);
    event SaleFinalized(bool successful, uint256 totalRaised);
    event AddressWhitelisted(address indexed account);
    event AddressRemovedFromWhitelist(address indexed account);
    event WhitelistToggled(bool enabled);

    // Custom errors
    error SaleNotActive();
    error SaleEnded();
    error InvalidPhase();
    error BelowMinContribution();
    error ExceedsMaxContribution();
    error HardCapReached();
    error NotWhitelisted();
    error AlreadyClaimed();
    error AlreadyRefunded();
    error NoContribution();
    error SoftCapMet();
    error InsufficientBalance();

    constructor(
        address _truthToken,
        address _pUSDToken,
        uint256 _tokenPrice,
        uint256 _tokensForSale,
        uint256 _softCap,
        uint256 _hardCap,
        uint256 _minContribution,
        uint256 _maxContribution,
        uint256 _saleDuration
    ) Ownable(msg.sender) {
        require(_truthToken != address(0), "Invalid TRUTH token address");
        require(_pUSDToken != address(0), "Invalid pUSD token address");
        require(_tokenPrice > 0, "Token price must be positive");
        require(_tokensForSale > 0, "Tokens for sale must be positive");
        require(_softCap > 0 && _softCap <= _hardCap, "Invalid soft cap");
        require(_minContribution > 0, "Min contribution must be positive");
        require(_maxContribution >= _minContribution, "Max contribution must be >= min");
        require(_saleDuration > 0, "Sale duration must be positive");

        truthToken = IERC20(_truthToken);
        pUSDToken = IERC20(_pUSDToken);
        tokenPrice = _tokenPrice;
        tokensForSale = _tokensForSale;
        softCap = _softCap;
        hardCap = _hardCap;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
        saleDuration = _saleDuration;
    }

    /**
     * @dev Starts the token sale
     */
    function startSale() external onlyOwner {
        require(currentPhase == Phase.PREPARATION, "Sale already started");
        require(truthToken.balanceOf(address(this)) >= tokensForSale, "Insufficient TRUTH tokens");

        saleStartTime = block.timestamp;
        saleEndTime = block.timestamp + saleDuration;
        currentPhase = Phase.ACTIVE;

        emit SaleStarted(saleStartTime, saleEndTime);
    }

    /**
     * @dev Purchases TRUTH tokens with pUSD
     * @param pUSDAmount Amount of pUSD to spend
     */
    function buyTokens(uint256 pUSDAmount) external nonReentrant whenNotPaused {
        _buyTokens(pUSDAmount);
    }

    /**
     * @dev Internal function to purchase tokens
     * @param pUSDAmount Amount of pUSD to spend
     */
    function _buyTokens(uint256 pUSDAmount) internal {
        require(currentPhase == Phase.ACTIVE, "Sale not active");
        require(block.timestamp <= saleEndTime, "Sale ended");
        require(pUSDAmount >= minContribution, "Below minimum contribution");
        
        if (whitelistEnabled) {
            require(whitelist[msg.sender], "Not whitelisted");
        }

        // Check contribution limits
        uint256 newContribution = contributions[msg.sender] + pUSDAmount;
        require(newContribution <= maxContribution, "Exceeds maximum contribution");

        // Check if hard cap would be exceeded
        require(totalRaised + pUSDAmount <= hardCap, "Hard cap reached");

        // Calculate TRUTH tokens to allocate
        uint256 truthAmount = (pUSDAmount * 10**18) / tokenPrice;
        require(truthAmount > 0, "Token amount must be positive");

        // Transfer pUSD from buyer
        pUSDToken.safeTransferFrom(msg.sender, address(this), pUSDAmount);

        // Update state
        if (contributions[msg.sender] == 0) {
            totalParticipants++;
        }
        contributions[msg.sender] = newContribution;
        tokenAllocations[msg.sender] += truthAmount;
        totalRaised += pUSDAmount;

        emit TokensPurchased(msg.sender, pUSDAmount, truthAmount);
    }

    /**
     * @dev Purchase tokens with referral (for potential bonus features)
     * @param pUSDAmount Amount of pUSD to spend
     * @param referrer Address of referrer
     */
    function buyTokensWithReferral(uint256 pUSDAmount, address referrer) external {
        // For now, this just calls the regular buy function
        // Can be extended later to include referral bonuses
        require(referrer != msg.sender, "Cannot refer yourself");
        require(referrer != address(0), "Invalid referrer");
        
        _buyTokens(pUSDAmount);
        // Future: Implement referral bonus logic here
    }

    /**
     * @dev Claims TRUTH tokens after successful sale
     */
    function claimTokens() external nonReentrant {
        require(currentPhase == Phase.CLAIM, "Claiming not active");
        require(saleFinalized, "Sale not finalized");
        require(totalRaised >= softCap, "Soft cap not met");
        require(tokenAllocations[msg.sender] > 0, "No tokens to claim");
        require(!hasClaimed[msg.sender], "Already claimed");

        uint256 tokenAmount = tokenAllocations[msg.sender];
        hasClaimed[msg.sender] = true;

        truthToken.safeTransfer(msg.sender, tokenAmount);
        emit TokensClaimed(msg.sender, tokenAmount);
    }

    /**
     * @dev Claims refund if soft cap not met
     */
    function claimRefund() external nonReentrant {
        require(saleFinalized, "Sale not finalized");
        require(totalRaised < softCap, "Soft cap was met");
        require(contributions[msg.sender] > 0, "No contribution to refund");
        require(!hasRefunded[msg.sender], "Already refunded");

        uint256 refundAmount = contributions[msg.sender];
        hasRefunded[msg.sender] = true;

        pUSDToken.safeTransfer(msg.sender, refundAmount);
        emit RefundClaimed(msg.sender, refundAmount);
    }

    /**
     * @dev Finalizes the sale
     */
    function finalizeSale() external onlyOwner {
        require(currentPhase == Phase.ACTIVE, "Sale not active");
        require(
            block.timestamp > saleEndTime || totalRaised >= hardCap,
            "Sale not ended or hard cap not reached"
        );
        require(!saleFinalized, "Sale already finalized");

        saleFinalized = true;
        bool successful = totalRaised >= softCap;

        if (successful) {
            currentPhase = Phase.CLAIM;
            // Transfer raised pUSD to owner
            pUSDToken.safeTransfer(owner(), totalRaised);
            
            // Return unsold tokens to owner
            uint256 unsoldTokens = truthToken.balanceOf(address(this)) - getTotalTokensAllocated();
            if (unsoldTokens > 0) {
                truthToken.safeTransfer(owner(), unsoldTokens);
            }
        } else {
            currentPhase = Phase.ENDED;
            // Return all TRUTH tokens to owner
            uint256 tokenBalance = truthToken.balanceOf(address(this));
            if (tokenBalance > 0) {
                truthToken.safeTransfer(owner(), tokenBalance);
            }
        }

        emit SaleFinalized(successful, totalRaised);
    }

    /**
     * @dev Emergency pause function
     */
    function emergencyPause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Resume from emergency pause
     */
    function emergencyUnpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Adds addresses to whitelist
     * @param accounts Array of addresses to whitelist
     */
    function addToWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = true;
            emit AddressWhitelisted(accounts[i]);
        }
    }

    /**
     * @dev Removes addresses from whitelist
     * @param accounts Array of addresses to remove
     */
    function removeFromWhitelist(address[] calldata accounts) external onlyOwner {
        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = false;
            emit AddressRemovedFromWhitelist(accounts[i]);
        }
    }

    /**
     * @dev Toggles whitelist requirement
     * @param enabled Whether whitelist is enabled
     */
    function setWhitelistEnabled(bool enabled) external onlyOwner {
        whitelistEnabled = enabled;
        emit WhitelistToggled(enabled);
    }

    // View functions
    function hasEnded() external view returns (bool) {
        return block.timestamp > saleEndTime || totalRaised >= hardCap;
    }

    function getRemainingTokens() external view returns (uint256) {
        if (totalRaised == 0) return tokensForSale;
        return tokensForSale - getTotalTokensAllocated();
    }

    function getTotalTokensAllocated() public view returns (uint256) {
        return (totalRaised * 10**18) / tokenPrice;
    }

    function getContribution(address user) external view returns (uint256) {
        return contributions[user];
    }

    function getClaimableTokens(address user) external view returns (uint256) {
        if (hasClaimed[user] || totalRaised < softCap) return 0;
        return tokenAllocations[user];
    }

    function isWhitelisted(address account) external view returns (bool) {
        return !whitelistEnabled || whitelist[account];
    }

    function getSaleInfo() external view returns (
        Phase phase,
        uint256 startTime,
        uint256 endTime,
        uint256 raised,
        uint256 participants,
        bool finalized
    ) {
        return (currentPhase, saleStartTime, saleEndTime, totalRaised, totalParticipants, saleFinalized);
    }
}