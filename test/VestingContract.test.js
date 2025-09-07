const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Vesting Contract", function () {
  async function deployVestingFixture() {
    const [owner, beneficiary, team, investor] = await ethers.getSigners();

    const TruthToken = await ethers.getContractFactory("TruthToken");
    const token = await TruthToken.deploy(
      "TRUTH Token",
      "TRUTH",
      ethers.parseEther("1000000000"),
      owner.address,
      owner.address
    );

    const VestingContract = await ethers.getContractFactory("VestingContract");
    const vesting = await VestingContract.deploy(await token.getAddress());

    return { token, vesting, owner, beneficiary, team, investor };
  }

  describe("Vesting Schedule Creation", function () {
    it("Should create team vesting schedule", async function () {
      const { vesting, team } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("200000000"); // 20% for team
      const cliff = 365 * 24 * 60 * 60; // 1 year cliff
      const duration = 4 * 365 * 24 * 60 * 60; // 4 year vesting

      await vesting.createVestingSchedule(
        team.address,
        amount,
        cliff,
        duration,
        true // revocable
      );

      const schedule = await vesting.vestingSchedules(team.address);
      expect(schedule.totalAmount).to.equal(amount);
      expect(schedule.cliffDuration).to.equal(cliff);
      expect(schedule.duration).to.equal(duration);
    });

    it("Should create investor vesting schedule", async function () {
      const { vesting, investor } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("100000000"); // 10% for investors
      const cliff = 6 * 30 * 24 * 60 * 60; // 6 month cliff
      const duration = 2 * 365 * 24 * 60 * 60; // 2 year vesting

      await vesting.createVestingSchedule(
        investor.address,
        amount,
        cliff,
        duration,
        false // non-revocable
      );

      const schedule = await vesting.vestingSchedules(investor.address);
      expect(schedule.totalAmount).to.equal(amount);
      expect(schedule.revocable).to.equal(false);
    });
  });

  describe("Token Release", function () {
    it("Should not release tokens before cliff", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("1000000");
      const cliff = 365 * 24 * 60 * 60; // 1 year
      const duration = 2 * 365 * 24 * 60 * 60; // 2 years

      await vesting.createVestingSchedule(
        beneficiary.address,
        amount,
        cliff,
        duration,
        true
      );
      await token.transfer(await vesting.getAddress(), amount);

      // Try to release before cliff
      await expect(vesting.connect(beneficiary).release())
        .to.be.revertedWith("Cliff period not completed");
    });

    it("Should release correct amount after cliff", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("1000000");
      const cliff = 30 * 24 * 60 * 60; // 30 days
      const duration = 365 * 24 * 60 * 60; // 1 year total

      await vesting.createVestingSchedule(
        beneficiary.address,
        amount,
        cliff,
        duration,
        true
      );
      await token.transfer(await vesting.getAddress(), amount);

      // Fast forward past cliff
      await time.increase(cliff + 1);

      const releasableAmount = await vesting.releasableAmount(beneficiary.address);
      await vesting.connect(beneficiary).release();

      expect(await token.balanceOf(beneficiary.address)).to.equal(releasableAmount);
    });

    it("Should handle full vesting period completion", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("1000000");
      const cliff = 0; // No cliff
      const duration = 365 * 24 * 60 * 60; // 1 year

      await vesting.createVestingSchedule(
        beneficiary.address,
        amount,
        cliff,
        duration,
        true
      );
      await token.transfer(await vesting.getAddress(), amount);

      // Fast forward past full duration
      await time.increase(duration + 1);

      await vesting.connect(beneficiary).release();
      expect(await token.balanceOf(beneficiary.address)).to.equal(amount);
    });
  });

  describe("Revocation", function () {
    it("Should allow owner to revoke vesting", async function () {
      const { vesting, token, beneficiary } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("1000000");
      const cliff = 0;
      const duration = 365 * 24 * 60 * 60;

      await vesting.createVestingSchedule(
        beneficiary.address,
        amount,
        cliff,
        duration,
        true
      );
      await token.transfer(await vesting.getAddress(), amount);

      await time.increase(duration / 2); // Halfway through vesting
      await vesting.revoke(beneficiary.address);

      const schedule = await vesting.vestingSchedules(beneficiary.address);
      expect(schedule.revoked).to.equal(true);
    });

    it("Should not allow revoking non-revocable schedule", async function () {
      const { vesting, beneficiary } = await loadFixture(deployVestingFixture);

      const amount = ethers.parseEther("1000000");
      await vesting.createVestingSchedule(
        beneficiary.address,
        amount,
        0,
        365 * 24 * 60 * 60,
        false
      );

      await expect(vesting.revoke(beneficiary.address))
        .to.be.revertedWith("Vesting schedule not revocable");
    });
  });
});