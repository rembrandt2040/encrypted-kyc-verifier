const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("KYCProofSale", function () {
  it("deploys successfully and stores the verifier address", async function () {
    const [owner, verifier] = await ethers.getSigners();
    const KYCProofSale = await ethers.getContractFactory("KYCProofSale");
    
    const kyc = await KYCProofSale.deploy(verifier.address, 0, owner.address);
    await kyc.waitForDeployment();

    const contractVerifier = await kyc.verifierSigner();
    expect(contractVerifier).to.equal(verifier.address);
  });
});
