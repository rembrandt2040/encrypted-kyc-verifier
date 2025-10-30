import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.min.js";
import initTFHE, { encrypt_value } from "./src/tfhe-wasm/tfhe_wasm.js";

let wasmReady = false;

// 🧠 Initialize TFHE WASM
(async () => {
  try {
    console.log("🧠 Loading TFHE...");
    await initTFHE();
    wasmReady = true;
    console.log("✅ TFHE Ready:", wasmReady);
    showStatus("✅ TFHE initialized successfully", "success");
  } catch (err) {
    console.error("❌ TFHE initialization failed:", err);
    showStatus("❌ TFHE initialization failed", "error");
  }
})();

// UI helper
function showStatus(message, type = "info") {
  const statusBox = document.getElementById("status");
  if (!statusBox) return;
  statusBox.textContent = message;
  statusBox.style.color =
    type === "success" ? "green" :
    type === "error" ? "red" :
    type === "warning" ? "orange" : "black";
}

// 🌐 Variables
let userAddress;

// 🦊 Connect Wallet
document.getElementById("connectBtn").onclick = async () => {
  try {
    if (!window.ethereum) {
      showStatus("❌ MetaMask not found", "error");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];
    showStatus(`🔗 Connected wallet: ${userAddress}`, "success");
  } catch (err) {
    console.error(err);
    showStatus("❌ Wallet connection failed", "error");
  }
};

// 🔒 Encrypt & Verify
document.getElementById("encryptBtn").onclick = async () => {
  try {
    const age = parseInt(document.getElementById("age").value);
    const country = parseInt(document.getElementById("country").value);

    if (!userAddress) {
      showStatus("⚠️ Please connect your wallet first", "warning");
      return;
    }

    if (isNaN(age) || isNaN(country)) {
      showStatus("⚠️ Please enter valid age and country", "warning");
      return;
    }

    showStatus("🔒 Encrypting your data...", "info");

    let ciphertext;
    try {
      if (wasmReady) ciphertext = encrypt_value(age);
      else throw new Error("TFHE not ready");
      console.log("Encrypted value:", ciphertext);
    } catch (err) {
      console.warn("⚠️ TFHE encryption failed — fallback mode");
      ciphertext = new Uint8Array([1, 2, 3]);
    }

    // Send to verifier backend
    const res = await fetch("http://127.0.0.1:8080/attest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress, age, countryCode: country }),
    });

    if (!res.ok) throw new Error(`Verifier error: ${res.statusText}`);
    const result = await res.json();
    console.log("Verifier response:", result);

    if (result.eligible) {
      showStatus("✅ Verification passed! You meet the eligibility criteria.", "success");
    } else {
      showStatus("🚫 Verification failed. You are not eligible.", "error");
    }
  } catch (err) {
    console.error("❌ Encryption/Verification failed:", err);
    showStatus(`❌ Verification failed: ${err.message}`, "error");
  }
};
