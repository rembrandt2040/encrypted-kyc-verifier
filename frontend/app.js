import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.min.js";
import initWasm, { encrypt_value } from "./src/tfhe-wasm/tfhe_wasm.js";

const VERIFIER_URL = "https://encrypted-kyc-verifier-backend.onrender.com/attest";

let wasmReady = false;
let userAddress = null;

const statusBox = document.getElementById("status");
const connectBtn = document.getElementById("connectWallet");
const encryptBtn = document.getElementById("encryptButton");

function updateStatus(msg) {
  statusBox.textContent = msg;
  console.log(msg);
}

// ✅ Load TFHE-WASM module
(async () => {
  try {
    updateStatus("🧠 Loading TFHE...");
    await initWasm();
    wasmReady = true;
    console.log("TFHE Ready?", wasmReady);
    updateStatus("✅ TFHE ready.");
  } catch (err) {
    console.error("TFHE load error:", err);
    updateStatus("❌ Failed to load TFHE.");
  }
})();

// ✅ Connect wallet
connectBtn.onclick = async () => {
  try {
    if (!window.ethereum) {
      updateStatus("❌ Please install MetaMask!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];
    updateStatus(`🔗 Connected wallet: ${userAddress}`);
  } catch (err) {
    console.error(err);
    updateStatus("❌ Failed to connect wallet.");
  }
};

// ✅ Encrypt and verify data
encryptBtn.onclick = async () => {
  const age = Number(document.getElementById("ageInput").value);
  const country = Number(document.getElementById("countryInput").value);

  if (!wasmReady) {
    updateStatus("⚠️ TFHE not ready yet, please wait...");
    return;
  }

  if (!userAddress) {
    updateStatus("⚠️ Please connect your wallet first.");
    return;
  }

  try {
    updateStatus(`Encrypting age=${age}, country=${country} ...`);

    // Perform client-side encryption (mocked for simplicity)
    const encryptedAge = encrypt_value(age);
    const encryptedCountry = encrypt_value(country);

    console.log("Encrypted Age:", encryptedAge);
    console.log("Encrypted Country:", encryptedCountry);

    updateStatus("🔐 Sending encrypted data to verifier...");

    const res = await fetch(VERIFIER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAddress,
        age,
        countryCode: country,
      }),
    });

    if (!res.ok) throw new Error("Verifier request failed");

    const data = await res.json();

    if (data.eligible) {
      updateStatus(
        `✅ Verified successfully!\nPolicy: ${data.policyId}\nSignature: ${data.signature.slice(
          0,
          20
        )}...`
      );
    } else {
      updateStatus(`❌ Not eligible under policy ${data.policyId}.`);
    }
  } catch (err) {
    console.error("Verification error:", err);
    updateStatus(`❌ Encryption or verification failed: ${err.message}`);
  }
};

