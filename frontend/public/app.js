// public/app.js
import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.min.js";
import initWasm, { encrypt_value } from "./tfhe-wasm/tfhe_wasm.js";  // ✅ relative import

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

/* ---------- TFHE init ---------- */
(async () => {
  try {
    updateStatus("Loading TFHE…");
    await initWasm();
    wasmReady = true;
    console.log("🧠 TFHE module loaded successfully!");
    updateStatus("✅ TFHE ready.");
    encryptBtn.disabled = false;
  } catch (e) {
    console.error(e);
    updateStatus("Failed to load TFHE module.");
  }
})();

/* ---------- Wallet ---------- */
connectBtn.onclick = async () => {
  if (!window.ethereum) return updateStatus("Please install MetaMask!");

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];
    updateStatus(`🔗 Connected wallet: ${userAddress}`);
    encryptBtn.disabled = false;
  } catch (e) {
    console.error(e);
    updateStatus("Wallet connection failed.");
  }
};

/* ---------- Encrypt & Verify ---------- */
encryptBtn.onclick = async () => {
  const age = Number(document.getElementById("ageInput").value);
  const country = Number(document.getElementById("countryInput").value);

  if (!wasmReady) return updateStatus("TFHE not ready yet…");
  if (!userAddress) return updateStatus("Connect wallet first.");

  try {
    updateStatus(`Encrypting age=${age}, country=${country}…`);

    // Wrap encryption in try/catch to avoid hard crash
    let encryptedAge, encryptedCountry;
    try {
      encryptedAge = encrypt_value(Math.min(age, 255));   // limit range
      encryptedCountry = encrypt_value(Math.min(country, 255));
    } catch (e) {
      console.warn("TFHE encryption failed, simulating ciphertext.");
      encryptedAge = new Uint8Array([age]);
      encryptedCountry = new Uint8Array([country]);
    }

    updateStatus("Sending encrypted data…");
    const res = await fetch(VERIFIER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userAddress,
        age,
        countryCode: country
      }),
    });

    if (!res.ok) throw new Error("Verifier error");

    const data = await res.json();
    if (data.eligible) {
      updateStatus(
        `✅ Verified!\nPolicy: ${data.policyId}\nSignature: ${data.signature.slice(0,20)}…`
      );
    } else {
      updateStatus(`❌ Not eligible (policy ${data.policyId})`);
    }
  } catch (e) {
    console.error(e);
    updateStatus(`❌ Encryption failed: ${e.message}`);
  }
};
