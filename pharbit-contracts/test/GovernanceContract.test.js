const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GovernanceContract", function () {
  let governance, owner, other;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const Gov = await ethers.getContractFactory("GovernanceContract");
    governance = await Gov.deploy([owner.address], 1, owner.address);
    await governance.waitForDeployment();
  });

  it("deploys and sets quorum", async () => {
    expect(await governance.quorum()).to.equal(1);
    const owners = await governance.owners();
    expect(owners).to.include(owner.address);
  });

  it("creates proposal, votes and executes", async () => {
    const tx = await governance.createProposal("Test", 60);
    const rc = await tx.wait();
    const ev = rc.logs[0];
    expect(ev).to.be.ok;

    await governance.vote(1, true);
    await ethers.provider.send("evm_increaseTime", [70]);
    await ethers.provider.send("evm_mine");
    const res = await governance.execute(1);
    await expect(res).to.emit(governance, "ProposalExecuted").withArgs(1, true);
  });
});
