const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LuckyBase Contracts", function () {
  let treasury, leaderboard, diceGame, usdc;
  let owner, player1, player2;

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();

    const Treasury = await ethers.getContractFactory("Treasury");
    treasury = await Treasury.deploy(owner.address);
    await treasury.waitForDeployment();

    const Leaderboard = await ethers.getContractFactory("Leaderboard");
    leaderboard = await Leaderboard.deploy(owner.address);
    await leaderboard.waitForDeployment();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const DiceGame = await ethers.getContractFactory("DiceGame");
    diceGame = await DiceGame.deploy(
      owner.address,
      await treasury.getAddress(),
      await leaderboard.getAddress(),
      await usdc.getAddress()
    );
    await diceGame.waitForDeployment();

    await leaderboard.setAuthorizedGame(await diceGame.getAddress(), true);

    // Transfer some USDC to players
    await usdc.transfer(player1.address, ethers.parseUnits("100", 6));
    await usdc.transfer(player2.address, ethers.parseUnits("100", 6));
  });

  describe("Treasury", function () {
    it("Should collect ETH fees correctly", async function () {
      const fee = ethers.parseEther("0.01");
      await player1.sendTransaction({
        to: await treasury.getAddress(),
        value: fee
      });
      expect(await treasury.getBalance()).to.equal(fee);
    });

    it("Should allow owner to withdraw ETH", async function () {
      const fee = ethers.parseEther("0.1");
      await player1.sendTransaction({
        to: await treasury.getAddress(),
        value: fee
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      await treasury.withdraw(fee);
      const finalBalance = await ethers.provider.getBalance(owner.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("DiceGame - ETH", function () {
    it("Should create a game with correct stake", async function () {
      const stake = ethers.parseEther("0.1");
      await expect(diceGame.connect(player1).createGameETH({ value: stake }))
        .to.emit(diceGame, "GameCreated")
        .withArgs(0, player1.address, ethers.ZeroAddress, stake);

      const game = await diceGame.games(0);
      expect(game.player1).to.equal(player1.address);
      expect(game.stake).to.equal(stake);
      expect(game.isActive).to.be.true;
    });

    it("Should allow very small stake (0.00004 ETH)", async function () {
      const stake = ethers.parseEther("0.00004");
      await expect(diceGame.connect(player1).createGameETH({ value: stake }))
        .to.emit(diceGame, "GameCreated")
        .withArgs(0, player1.address, ethers.ZeroAddress, stake);
    });

    it("Should resolve a game when player 2 joins", async function () {
      const stake = ethers.parseEther("0.1");
      await diceGame.connect(player1).createGameETH({ value: stake });

      await expect(diceGame.connect(player2).joinGame(0, { value: stake }))
        .to.emit(diceGame, "GameResolved");

      const game = await diceGame.games(0);
      expect(game.isActive).to.be.false;

      // Treasury should have 10% of 0.2 ETH = 0.02 ETH
      expect(await treasury.getBalance()).to.equal(ethers.parseEther("0.02"));
    });
  });

  describe("DiceGame - USDC", function () {
    it("Should create a game with USDC", async function () {
      const stake = ethers.parseUnits("10", 6);
      await usdc.connect(player1).approve(await diceGame.getAddress(), stake);

      await expect(diceGame.connect(player1).createGameUSDC(stake))
        .to.emit(diceGame, "GameCreated")
        .withArgs(0, player1.address, await usdc.getAddress(), stake);
    });

    it("Should resolve a USDC game", async function () {
      const stake = ethers.parseUnits("10", 6);
      await usdc.connect(player1).approve(await diceGame.getAddress(), stake);
      await diceGame.connect(player1).createGameUSDC(stake);

      await usdc.connect(player2).approve(await diceGame.getAddress(), stake);
      await expect(diceGame.connect(player2).joinGame(0))
        .to.emit(diceGame, "GameResolved");

      // Treasury should have 10% of 20 USDC = 2 USDC
      expect(await usdc.balanceOf(await treasury.getAddress())).to.equal(ethers.parseUnits("2", 6));
    });
  });

  describe("DiceGame - General", function () {
    it("Should allow refund after 24 hours", async function () {
      const stake = ethers.parseEther("0.1");
      await diceGame.connect(player1).createGameETH({ value: stake });

      // Try refund early
      await expect(diceGame.connect(player1).refund(0))
        .to.be.revertedWith("Wait 24 hours");

      // Advance time by 24 hours + 1 second
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine");

      const initialBalance = await ethers.provider.getBalance(player1.address);
      await diceGame.connect(player1).refund(0);
      const finalBalance = await ethers.provider.getBalance(player1.address);

      expect(finalBalance).to.be.gt(initialBalance);
    });
  });
});
