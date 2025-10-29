import express from "express";
import { Wallet, keccak256, toUtf8Bytes, getBytes, hashMessage, solidityPacked } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// ✅ Initialize Verifier wallet
const wallet = new Wallet(process.env.VERIFIER_PRIV_KEY);
console.log("✅ Verifier service started");
console.log("🔑 Verifier signer address:", wallet.address);

// 🧠 Simulate eligibility (this would later use FHE decryption)
function simulateEligibilityCheck(age, countryCode) {
  return age >= 18 && Number(countryCode) === Number(process.env.COUNTRY_CODE_ALLOWED);
}

// 🧾 Endpoint to create attestation
app.post("/attest", async (req, res) => {
  try {
    const { userAddress, age, countryCode } = req.body;
    const eligible = simulateEligibilityCheck(age, countryCode);
    const policyId = process.env.POLICY_ID || "KYC_POLICY_V1";

    // Hash message (address, policyId, eligibility)
    const packedMessage = solidityPacked(["address", "string", "bool"], [userAddress, policyId, eligible]);
    const messageHash = keccak256(packedMessage);
    const signature = await wallet.signMessage(getBytes(messageHash));

    console.log(`✅ Attestation issued for ${userAddress} | eligible=${eligible}`);

    res.json({
      eligible,
      policyId,
      signature,
      verifier: wallet.address,
    });
  } catch (err) {
    console.error("❌ Error issuing attestation:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🚀 Start the verifier server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🌐 Verifier listening on http://localhost:${PORT}`);
});
