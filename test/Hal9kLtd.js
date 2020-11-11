const { expect } = require("chai");
const { BigNumber } = require("ethers");

describe("Hal9kLtd contract", () => {
  let owner;

  before(async () => {
    [owner] = await ethers.getSigners();
    this.Hal9kLtd = await ethers.getContractFactory("HAL9KLtd");
  })

  beforeEach(async () => {
    // Get the ContractFactory and Signers here.
    this.hal9kLtd = await this.Hal9kLtd.deploy(owner.address);
    await this.hal9kLtd.deployed();
  });

  it("Should able to mint hal9k cards correctly", async () => {
    const firstHal = await this.hal9kLtd.create(100, 0, "https://images.hal9k.ai/1", []);
    // const firstHalId = firstHal.value;

    // await this.hal9kLtd.mint(owner.address, firstHalId, 5, []);
    // expect(await this.hal9kLtd._exists(firstHalId)).to.equal(true);
  });
});