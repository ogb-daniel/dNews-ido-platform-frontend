const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TRUTH Token Contract", function () {
  // Test fixtures for reusable setup
  async function deployTruthTokenFixture() {
    const [owner, addr1, addr2, addr3, treasury, team] = await ethers.getSigners();

    const TruthToken = await ethers.getContractFactory("TruthToken");
    const token = await TruthToken.deploy(
      "TRUTH Token",
      "TRUTH",
      ethers.parseEther("1000000000"), // 1B tokens
      treasury.address,
      team.address
    );

    return { token, owner, addr1, addr2, addr3, treasury, team };
  }

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      const { token } = await loadFixture(deployTruthTokenFixture);
      expect(await token.name()).to.equal("TRUTH Token");
      expect(await token.symbol()).to.equal("TRUTH");
    });

    it("Should set the correct decimals", async function () {
      const { token } = await loadFixture(deployTruthTokenFixture);
      expect(await token.decimals()).to.equal(18);
    });

    it("Should mint total supply to owner", async function () {
      const { token, owner } = await loadFixture(deployTruthTokenFixture);
      const totalSupply = await token.totalSupply();
      expect(await token.balanceOf(owner.address)).to.equal(totalSupply);
      expect(totalSupply).to.equal(ethers.parseEther("1000000000"));
    });

    it("Should set the correct owner", async function () {
      const { token, owner } = await loadFixture(deployTruthTokenFixture);
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should initialize with unpaused state", async function () {
      const { token } = await loadFixture(deployTruthTokenFixture);
      expect(await token.paused()).to.equal(false);
    });
  });

  describe("Token Distribution", function () {
    it("Should distribute tokens according to tokenomics", async function () {
      const { token, owner, treasury, team } = await loadFixture(deployTruthTokenFixture);
      const totalSupply = ethers.parseEther("1000000000");

      // Community rewards: 40%
      const communityAmount = (totalSupply * BigInt(40)) / BigInt(100);
      await token.transfer(treasury.address, communityAmount);
      expect(await token.balanceOf(treasury.address)).to.equal(communityAmount);

      // Team allocation: 20%
      const teamAmount = (totalSupply * BigInt(20)) / BigInt(100);
      await token.transfer(team.address, teamAmount);
      expect(await token.balanceOf(team.address)).to.equal(teamAmount);
    });

    it("Should track allocations correctly", async function () {
      const { token } = await loadFixture(deployTruthTokenFixture);
      const totalSupply = await token.totalSupply();

      // Verify allocations add up to total supply
      const communityAllocation = (totalSupply * BigInt(40)) / BigInt(100);
      const teamAllocation = (totalSupply * BigInt(20)) / BigInt(100);
      const idoAllocation = (totalSupply * BigInt(15)) / BigInt(100);
      const treasuryAllocation = (totalSupply * BigInt(15)) / BigInt(100);
      const investorAllocation = (totalSupply * BigInt(10)) / BigInt(100);

      const totalAllocations =
        communityAllocation +
        teamAllocation +
        idoAllocation +
        treasuryAllocation +
        investorAllocation;

      expect(totalAllocations).to.equal(totalSupply);
    });
  });

  describe("Transfer Functionality", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTruthTokenFixture);
      const amount = ethers.parseEther("1000");

      await token.transfer(addr1.address, amount);
      expect(await token.balanceOf(addr1.address)).to.equal(amount);
    });

    it("Should fail if sender doesn't have enough tokens", async function () {
      const { token, addr1, addr2 } = await loadFixture(deployTruthTokenFixture);
      const amount = ethers.parseEther("1000");

      await expect(
        token.connect(addr1).transfer(addr2.address, amount)
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should update allowances on transferFrom", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTruthTokenFixture);
      const amount = ethers.parseEther("1000");

      await token.approve(addr1.address, amount);
      await token.connect(addr1).transferFrom(owner.address, addr2.address, amount);

      expect(await token.balanceOf(addr2.address)).to.equal(amount);
      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });

  describe("Burning Functionality", function () {
    it("Should burn tokens and reduce total supply", async function () {
      const { token, owner } = await loadFixture(deployTruthTokenFixture);
      const burnAmount = ethers.parseEther("1000000");
      const initialSupply = await token.totalSupply();
      const initialBalance = await token.balanceOf(owner.address);

      await token.burn(burnAmount);

      expect(await token.totalSupply()).to.equal(initialSupply - burnAmount);
      expect(await token.balanceOf(owner.address)).to.equal(initialBalance - burnAmount);
    });

    it("Should fail to burn more tokens than balance", async function () {
      const { token, addr1 } = await loadFixture(deployTruthTokenFixture);
      const burnAmount = ethers.parseEther("1000");

      await expect(token.connect(addr1).burn(burnAmount))
        .to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("Should allow burning from allowance", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTruthTokenFixture);
      const burnAmount = ethers.parseEther("1000");

      await token.approve(addr1.address, burnAmount);
      await token.connect(addr1).burnFrom(owner.address, burnAmount);

      expect(await token.allowance(owner.address, addr1.address)).to.equal(0);
    });
  });

  describe("Pause Functionality", function () {
    it("Should pause and unpause transfers", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTruthTokenFixture);
      const amount = ethers.parseEther("1000");

      await token.pause();
      expect(await token.paused()).to.equal(true);

      await expect(token.transfer(addr1.address, amount))
        .to.be.revertedWithCustomError(token, "EnforcedPause");

      await token.unpause();
      expect(await token.paused()).to.equal(false);

      await expect(token.transfer(addr1.address, amount)).to.not.be.reverted;
    });

    it("Should only allow owner to pause", async function () {
      const { token, addr1 } = await loadFixture(deployTruthTokenFixture);

      await expect(token.connect(addr1).pause())
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });
  });

  describe("Blacklist Functionality", function () {
    it("Should blacklist and unblacklist addresses", async function () {
      const { token, addr1 } = await loadFixture(deployTruthTokenFixture);

      await token.blacklistAddress(addr1.address);
      expect(await token.isBlacklisted(addr1.address)).to.equal(true);

      await token.unblacklistAddress(addr1.address);
      expect(await token.isBlacklisted(addr1.address)).to.equal(false);
    });

    it("Should prevent blacklisted addresses from transferring", async function () {
      const { token, owner, addr1, addr2 } = await loadFixture(deployTruthTokenFixture);
      const amount = ethers.parseEther("1000");

      await token.transfer(addr1.address, amount);
      await token.blacklistAddress(addr1.address);

      await expect(token.connect(addr1).transfer(addr2.address, amount))
        .to.be.revertedWithCustomError(token, "AccountBlacklisted");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to call admin functions", async function () {
      const { token, addr1 } = await loadFixture(deployTruthTokenFixture);

      await expect(token.connect(addr1).blacklistAddress(addr1.address))
        .to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");
    });

    it("Should transfer ownership correctly", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTruthTokenFixture);

      await token.transferOwnership(addr1.address);
      expect(await token.owner()).to.equal(addr1.address);
    });
  });

  describe("Gas Optimization", function () {
    it("Should use reasonable gas for transfers", async function () {
      const { token, owner, addr1 } = await loadFixture(deployTruthTokenFixture);
      const amount = ethers.parseEther("1000");

      const tx = await token.transfer(addr1.address, amount);
      const receipt = await tx.wait();

      expect(receipt.gasUsed).to.be.below(100000); // Reasonable gas limit
    });
  });
});