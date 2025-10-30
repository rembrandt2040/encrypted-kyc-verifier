import express from "express";
import cors from "cors";
import { Wallet, keccak256, toUtf8Bytes } from "ethers";
import dotenv from "dotenv";

// ✅ Load environment variables
dotenv.config();

// ✅ Initialize Express app
const app = express();
app.use(cors()); // Allow requests from frontend (localhost:3000)
app.use(express.json());

// ✅ Initialize verifier wallet from .env
const wallet = new Wallet(process.env.VERIFIER_PRIV_KEY);
console.log("🔑 Verifier signer address:", wallet.address);

// ✅ Simulated eligibility check (replace with TFHE later)
function simulateEligibilityCheck(age, countryCode) {
  // Example: Eligible if 18+ and country code matches environment setting
  return age >= 18 && Number(countryCode) === Number(process.env.COUNTRY_CODE_ALLOWED);
}

// ✅ POST endpoint to issue attestations
app.post("/attest", async (req, res) => {
  try {
    const { userAddress, age, countryCode } = req.body;

    if (!userAddress || age === undefined || !countryCode) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    console.log(`📩 Received attestation request from ${userAddress}`);
    console.log(`🧩 Age: ${age}, Country: ${countryCode}`);

    const eligible = simulateEligibilityCheck(age, countryCode);
    const policyId = process.env.POLICY_ID || "KYC_ELIGIBLE";

    // Build hash message
    const messageHash = keccak256(toUtf8Bytes(`${userAddress}-${policyId}-${eligible}`));

    // Sign the message with verifier's private key
    const signature = await wallet.signMessage(messageHash);

    console.log(`✅ Eligibility: ${eligible}, Signature: ${signature.slice(0, 10)}...`);

    // Respond with attestation
    res.json({
      eligible,
      policyId,
      signature,
    });

  } catch (error) {
    console.error("❌ Error in /attest endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Start server
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`🚀 Verifier service live at http://127.0.0.1:${PORT}`);
});
