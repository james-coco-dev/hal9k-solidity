const chai = require("chai");
var chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

const { expectRevert, time } = require("@openzeppelin/test-helpers");
const { artifacts } = require("hardhat");
const HAL9KLtd = artifacts.require('HAL9KLtd');
const Hal9kVault = artifacts.require("Hal9kVault");
const HAL9KNFTPool = artifacts.require("HAL9KNFTPool");
const WETH9 = artifacts.require("WETH9");
const UniswapV2Pair = artifacts.require("UniswapV2Pair");
const UniswapV2Factory = artifacts.require("UniswapV2Factory");
const FeeApprover = artifacts.require("FeeApprover");
const UniswapV2Router02 = artifacts.require("UniswapV2Router02");

contract('HAL9K NFT Pool Test', async (accounts) => {
  const [nate, chris, alice, john, minter, clean] = accounts

  describe("HAL9K NFT Pool", () => {
    beforeEach(async () => {
      this.hal9kVault = await Hal9kVault.new(nate, { from: nate });
      this.hal9kLtd = await HAL9KLtd.new(nate, { from: nate });
      this.hal9kPool = await HAL9KNFTPool.new(nate, chris);
    });
    
    it("Should create and mint the nft card correctly", async () => {
      // Should create and mint the nft card correctly
      this.firstCardId = await this.hal9kLtd.create.call(100, 10, "https://images.hal9k.ai/1", []);
      expect(this.firstCardId.toNumber()).to.equal(1);
      console.log("First card created: ", this.firstCardId.toNumber());

      this.secondCardId = await this.hal9kLtd.create.call(100, 20, "https://images.hal9k.ai/2", []);
      // expect(this.secondCardId.toNumber()).to.equal(2);
      console.log("Second card created: ", this.secondCardId.toNumber());

      this.thirdCardId = await this.hal9kLtd.create.call(100, 30, "https://images.hal9k.ai/3", []);
      // expect(this.thirdCardId.toNumber()).to.equal(3);
      console.log("Third card created: ", this.thirdCardId.toNumber());
    })

    it("Should start hal9k nft card reward", async () => {
      await expect(this.hal9kPool.getDaysPassedAfterStakingStart()).to.eventually.be.rejectedWith("LP token hasn't claimed yet");

      await this.hal9kPool.startHal9KStaking();
      let passedDays = await this.hal9kPool.getDaysPassedAfterStakingStart()
      assert.equal(passedDays, 0);

      await time.increase(60 * 60 * 24 * 7 + 1);
      passedDays = await this.hal9kPool.getDaysPassedAfterStakingStart()
      assert.equal(passedDays, 7);
    })

    it("Should able to move and back one stage", async () => {
      await expect(this.hal9kPool.moveStageBackOrForth(false)).to.eventually.be.rejectedWith("LP token hasn't claimed yet");
      await expect(this.hal9kPool.getCurrentStage()).to.eventually.be.rejectedWith("LP token hasn't claimed yet");
    })

    describe("MoveStageBackOrForth", () => {
      beforeEach(async () => {
        await this.hal9kPool.startHal9KStaking();
      })

      it("Stage should be 0 when stake started", async () => {
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);
      })

      it("Moving Forward: Stage should be 0 after 1 day has passed", async () => {
        await this.hal9kPool.moveStageBackOrForth(false);
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);
      })

      it("Moving Forward: Stage should be 1 after 1 day", async () => {
        // Passed one day
        await time.increase(60 * 60 * 24 * 1);
        await this.hal9kPool.moveStageBackOrForth(false);
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 1);

        // Passed two days
        await time.increase(60 * 60 * 24 * 2);
        await this.hal9kPool.moveStageBackOrForth(false);
        currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 2);
      })

      it("Moving Backward: Stage should be 0", async() => {
        await this.hal9kPool.moveStageBackOrForth(true);
        let currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);

        // Make stage 1
        await time.increase(60 * 60 * 24 * 1);
        await this.hal9kPool.moveStageBackOrForth(false);

        await this.hal9kPool.moveStageBackOrForth(true);
        currentStage = await this.hal9kPool.getCurrentStage();
        assert.equal(currentStage, 0);
      })
    });

    describe("Test Hal9k NFT Card mint and burn", () => {
      beforeEach(async() => {
        this.factory = await UniswapV2Factory.new(alice, { from: alice });
        this.weth = await WETH9.new({ from: john });
        await this.weth.deposit({ from: alice, value: "1000000000000000000000" });

        this.router = await UniswapV2Router02.new(this.factory.address, this.weth.address, { from: alice });
        this.hal9k = await HAL9kToken.new(this.router.address, this.factory.address, { from: alice });
        this.hal9kWETHPair = await UniswapV2Pair.at(await this.factory.getPair(this.weth.address, this.hal9k.address));

        await this.hal9k.startLiquidityGenerationEventForHAL9K();
        await this.hal9k.addLiquidity(true, { from: minter, value: "1000000000000000000"});
        await time.increase(60 * 60 * 24 * 7 + 1);
        await this.hal9k.addLiquidityToUniswapHAL9KxWETHPair();
        await this.hal9k.claimLPTokens({ from: minter });

        assert.equal((await this.weth.balanceOf(this.hal9kWETHPair.address)).valueOf().toString(), "1000000000000000000");
        assert.equal((await this.hal9k.balanceOf(this.hal9kWETHPair.address)).valueOf().toString(), 9000e18);

        await this.hal9kWETHPair.sync();
        console.log(this.hal9k.address);

        this.feeapprover = await FeeApprover.new({ from: alice });
        await this.feeapprover.initialize(this.hal9k.address, this.weth.address, this.factory.address);
        await this.feeapprover.setPaused(false, { from: alice });
        await this.hal9k.setShouldTransferChecker(this.feeapprover.address, {from: alice});
        await this.router.swapExactETHForTokensSupportingFeeOnTransferTokens("1", [await this.router.WETH(), this.hal9k.address], minter, 15999743005,
          { from: minter, value: "5000000000000000000000" });

        console.log("Balance of minter is ",(await this.hal9k.balanceOf(minter)).valueOf().toString());
        assert.equal(await this.factory.getPair(this.hal9k.address, this.weth.address), this.hal9kWETHPair.address);

        this.hal9kvault = await Hal9kVault.new({ from: alice });
        await this.hal9kvault.initialize(this.hal9k.address, dev, clean);
        await this.weth.transfer(minter, "10000000000000000000", { from: alice });
        await this.feeapprover.setHal9kVaultAddress(this.hal9kvault.address, {from: alice});
      });

      if ("Should mint card for user correctly", async () => {

      });
    
      if ("Should burn card for user correctly", async () => {
        
      });
    });
  });

})
