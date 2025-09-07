const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("IDO Contract", function () {
  async function deployIDOFixture() {
    const [owner, buyer1, buyer2, buyer3, treasury] = await ethers.getSigners();

    // Deploy TRUTH token first
    const TruthToken = await ethers.getContractFactory("TruthToken");
    const truthToken = await TruthToken.deploy(
      "TRUTH Token",
      "TRUTH",
      ethers.parseEther("1000000000"),
      treasury.address,
      treasury.address
    );

    // Deploy PAU Dollar token (mock for testing)
    const PAUDollar = await ethers.getContractFactory("PAUDollar");
    const pUSDToken = await PAUDollar.deploy();

    // Deploy IDO contract
    const IDOContract = await ethers.getContractFactory("IDOContract");
    const ido = await IDOContract.deploy(
      await truthToken.getAddress(),
      await pUSDToken.getAddress(),
      ethers.parseUnits("0.15", 18), // Price: 0.15 pUSD per TRUTH
      ethers.parseEther("150000000"), // 150M TRUTH for sale
      ethers.parseEther("7500"), // Soft cap: 7500 pUSD
      ethers.parseEther("22500"), // Hard cap: 22500 pUSD
      ethers.parseEther("10"), // Min contribution: 10 pUSD
      ethers.parseEther("2000"), // Max contribution: 2000 pUSD
      7 * 24 * 60 * 60 // 7 days duration
    );

    // Transfer IDO allocation to IDO contract
    const idoAllocation = ethers.parseEther("150000000");
    await truthToken.transfer(await ido.getAddress(), idoAllocation);

    // Mint pUSD to buyers for testing
    await pUSDToken.mint(buyer1.address, ethers.parseEther("5000"));
    await pUSDToken.mint(buyer2.address, ethers.parseEther("5000"));
    await pUSDToken.mint(buyer3.address, ethers.parseEther("25000"));

    return { truthToken, pUSDToken, ido, owner, buyer1, buyer2, buyer3, treasury };
  }

  describe("Deployment", function () {
    it("Should set correct initial parameters", async function () {
      const { ido, truthToken, pUSDToken } = await loadFixture(deployIDOFixture);

      expect(await ido.truthToken()).to.equal(await truthToken.getAddress());
      expect(await ido.pUSDToken()).to.equal(await pUSDToken.getAddress());
      expect(await ido.tokenPrice()).to.equal(ethers.parseUnits("0.15", 18));
      expect(await ido.tokensForSale()).to.equal(ethers.parseEther("150000000"));
      expect(await ido.softCap()).to.equal(ethers.parseEther("7500"));
      expect(await ido.hardCap()).to.equal(ethers.parseEther("22500"));
    });

    it("Should initialize in preparation phase", async function () {
      const { ido } = await loadFixture(deployIDOFixture);
      expect(await ido.currentPhase()).to.equal(0); // Preparation phase
    });

    it("Should have correct token allocation", async function () {
      const { ido, truthToken } = await loadFixture(deployIDOFixture);
      const idoBalance = await truthToken.balanceOf(await ido.getAddress());
      expect(idoBalance).to.equal(ethers.parseEther("150000000"));
    });
  });

  describe("Sale Management", function () {
    it("Should start sale correctly", async function () {
      const { ido } = await loadFixture(deployIDOFixture);

      await ido.startSale();
      expect(await ido.currentPhase()).to.equal(1); // Active phase
      expect(await ido.saleStartTime()).to.be.greaterThan(0);
    });

    it("Should only allow owner to start sale", async function () {
      const { ido, buyer1 } = await loadFixture(deployIDOFixture);

      await expect(ido.connect(buyer1).startSale())
        .to.be.revertedWithCustomError(ido, "OwnableUnauthorizedAccount");
    });

    it("Should not allow starting sale twice", async function () {
      const { ido } = await loadFixture(deployIDOFixture);

      await ido.startSale();
      await expect(ido.startSale()).to.be.revertedWith("Sale already started");
    });

    it("Should end sale after duration", async function () {
      const { ido } = await loadFixture(deployIDOFixture);

      await ido.startSale();
      await time.increase(8 * 24 * 60 * 60); // 8 days

      expect(await ido.hasEnded()).to.equal(true);
    });
  });

  describe("Token Purchase", function () {
    it("Should allow token purchase within limits", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("1000");
      const expectedTokens = ethers.parseEther("6666.666666666666666666"); // 1000 / 0.15

      // Approve pUSD spending
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);

      await expect(ido.connect(buyer1).buyTokens(pUSDAmount))
        .to.emit(ido, "TokensPurchased")
        .withArgs(buyer1.address, pUSDAmount, expectedTokens);

      expect(await ido.contributions(buyer1.address)).to.equal(pUSDAmount);
    });

    it("Should reject purchases below minimum", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("5"); // Below 10 pUSD minimum

      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);

      await expect(ido.connect(buyer1).buyTokens(pUSDAmount))
        .to.be.revertedWithCustomError(ido, "BelowMinContribution");
    });

    it("Should reject purchases above maximum", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("3000"); // Above 2000 pUSD maximum

      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);

      await expect(ido.connect(buyer1).buyTokens(pUSDAmount))
        .to.be.revertedWithCustomError(ido, "ExceedsMaxContribution");
    });

    it("Should track cumulative contributions correctly", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const firstAmount = ethers.parseEther("500");
      const secondAmount = ethers.parseEther("300");

      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), firstAmount);
      await ido.connect(buyer1).buyTokens(firstAmount);

      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), secondAmount);
      await ido.connect(buyer1).buyTokens(secondAmount);

      expect(await ido.contributions(buyer1.address)).to.equal(
        ethers.parseEther("800")
      );
    });

    it("Should stop sales when hard cap reached", async function () {
      const { ido, pUSDToken, buyer1, buyer2, buyer3 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      // Fill up to hard cap (22500 pUSD)
      const amount1 = ethers.parseEther("2000");
      const amount2 = ethers.parseEther("2000");
      const amount3 = ethers.parseEther("18500");

      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), amount1);
      await ido.connect(buyer1).buyTokens(amount1);

      await pUSDToken.connect(buyer2).approve(await ido.getAddress(), amount2);
      await ido.connect(buyer2).buyTokens(amount2);

      await pUSDToken.connect(buyer3).approve(await ido.getAddress(), amount3);
      await ido.connect(buyer3).buyTokens(amount3);

      // Should reject additional purchases
      const extraAmount = ethers.parseEther("100");
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), extraAmount);
      
      await expect(ido.connect(buyer1).buyTokens(extraAmount))
        .to.be.revertedWithCustomError(ido, "HardCapReached");
    });

    it("Should reject purchases when sale not active", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);

      const pUSDAmount = ethers.parseEther("1000");
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);

      await expect(ido.connect(buyer1).buyTokens(pUSDAmount))
        .to.be.revertedWithCustomError(ido, "SaleNotActive");
    });
  });

  describe("Token Claiming", function () {
    it("Should allow token claiming after successful sale", async function () {
      const { ido, truthToken, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("1000");
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);
      await ido.connect(buyer1).buyTokens(pUSDAmount);

      await time.increase(8 * 24 * 60 * 60); // End sale
      await ido.finalizeSale();

      const claimableBefore = await ido.getClaimableTokens(buyer1.address);
      await ido.connect(buyer1).claimTokens();

      expect(await truthToken.balanceOf(buyer1.address)).to.equal(claimableBefore);
      expect(await ido.hasClaimed(buyer1.address)).to.equal(true);
    });

    it("Should not allow double claiming", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("1000");
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);
      await ido.connect(buyer1).buyTokens(pUSDAmount);

      await time.increase(8 * 24 * 60 * 60);
      await ido.finalizeSale();

      await ido.connect(buyer1).claimTokens();

      await expect(ido.connect(buyer1).claimTokens())
        .to.be.revertedWith("Already claimed");
    });

    it("Should allow refunds if soft cap not met", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("1000"); // Below 7500 pUSD soft cap
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);
      await ido.connect(buyer1).buyTokens(pUSDAmount);

      await time.increase(8 * 24 * 60 * 60);
      await ido.finalizeSale();

      const balanceBefore = await pUSDToken.balanceOf(buyer1.address);
      await ido.connect(buyer1).claimRefund();
      const balanceAfter = await pUSDToken.balanceOf(buyer1.address);

      expect(balanceAfter - balanceBefore).to.equal(pUSDAmount);
    });
  });

  describe("Emergency Functions", function () {
    it("Should allow emergency pause", async function () {
      const { ido } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      await ido.emergencyPause();
      expect(await ido.paused()).to.equal(true);
    });

    it("Should prevent purchases when paused", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();
      await ido.emergencyPause();

      const pUSDAmount = ethers.parseEther("1000");
      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);

      await expect(ido.connect(buyer1).buyTokens(pUSDAmount))
        .to.be.revertedWithCustomError(ido, "EnforcedPause");
    });
  });

  describe("Events", function () {
    it("Should emit TokensPurchased event", async function () {
      const { ido, pUSDToken, buyer1 } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      const pUSDAmount = ethers.parseEther("1000");
      const expectedTokens = ethers.parseEther("6666.666666666666666666");

      await pUSDToken.connect(buyer1).approve(await ido.getAddress(), pUSDAmount);

      await expect(ido.connect(buyer1).buyTokens(pUSDAmount))
        .to.emit(ido, "TokensPurchased")
        .withArgs(buyer1.address, pUSDAmount, expectedTokens);
    });

    it("Should emit SaleFinalized event", async function () {
      const { ido } = await loadFixture(deployIDOFixture);
      await ido.startSale();

      await time.increase(8 * 24 * 60 * 60);

      await expect(ido.finalizeSale()).to.emit(ido, "SaleFinalized");
    });
  });
});