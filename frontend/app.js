import { ethers } from "https://cdn.jsdelivr.net/npm/ethers@6.11.1/dist/ethers.min.js";
import init, { encrypt_value, decrypt_value } from "./src/tfhe-wasm/tfhe_wasm.js";

let wasmReady = false;
let userAddress = null;

// 🧠 Initialize TFHE WASM
(async () => {
  const statusEl = document.getElementById("status");
  statusEl.innerText = "🧠 Loading TFHE...";
  try {
    await init();
    wasmReady = true;
    console.log("✅ TFHE ready.");
    console.log("TFHE Ready?", wasmReady);
    statusEl.innerText = "✅ TFHE Ready.";
  } catch (err) {
    console.error("❌ TFHE init failed:", err);
    statusEl.innerText = "❌ TFHE init failed.";
  }
})();

// 🦊 Connect wallet
document.getElementById("connectWallet").onclick = async () => {
  try {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    userAddress = accounts[0];

    document.getElementById("walletStatus").innerText = `🔗 Connected: ${userAddress}`;
  } catch (err) {
    console.error("❌ Wallet connection failed:", err);
    document.getElementById("walletStatus").innerText = "❌ Wallet connection failed.";
  }
};

// 🧩 Check Verifier Connection
async function checkVerifierConnection() {
  const verifierEl = document.getElementById("verifierStatus");
  verifierEl.innerText = "🌐 Connecting to verifier...";
  try {
    const response = await fetch("http://localhost:8080/");
    if (response.ok) {
      verifierEl.innerText = "✅ Verifier online.";
    } else {
      verifierEl.innerText = "⚠️ Verifier not responding.";
    }
  } catch {
    verifierEl.innerText = "❌ Verifier offline.";
  }
}
checkVerifierConnection();

// 🔐 Encrypt + Verify button
document.getElementById("encryptVerifyBtn").onclick = async () => {
  const age = parseInt(document.getElementById("ageInput").value);
  const countryCode = parseInt(document.getElementById("countryInput").value);
  const resultEl = document.getElementById("result");
  const decryptEl = document.getElementById("decryptedOutput");
  const ciphertextEl = document.getElementById("cipherPreview");
  const btn = document.getElementById("encryptVerifyBtn");

  if (!wasmReady) {
    alert("TFHE not ready yet. Try again in a few seconds.");
    return;
  }

  if (!userAddress) {
    alert("Please connect your wallet first.");
    return;
  }

  console.log(`Encrypting age=${age}, country=${countryCode} ...`);

  // 🌀 Show loading
  btn.disabled = true;
  btn.innerText = "⏳ Encrypting...";

  try {
    // 🧠 Encrypt locally (TFHE WASM)
    const encryptedAge = encrypt_value(age);
    const ciphertextB64 = btoa(String.fromCharCode(...encryptedAge));
    ciphertextEl.innerText = `🧩 Ciphertext (Base64): ${ciphertextB64.slice(0, 64)}...`;
    console.log("🔒 Encrypted (Base64):", ciphertextB64);

    // 🧩 Demo: Decrypt locally to show round-trip success
    const decryptedAge = decrypt_value(encryptedAge);
    decryptEl.innerText = `🔓 Decrypted Age: ${decryptedAge}`;
    console.log("🔓 Decrypted Age:", decryptedAge);

    // 🌐 Send to verifier
    const response = await fetch("http://localhost:8080/attest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAddress, age, countryCode }),
    });

    if (!response.ok) {
      throw new Error(`Verifier returned ${response.status}`);
    }

    const data = await response.json();
    console.log("Verifier response:", data);

    if (data.eligible) {
      resultEl.innerText = "✅ Eligible for KYC-verified sale.";
      resultEl.style.color = "green";
    } else {
      resultEl.innerText = "❌ Not eligible.";
      resultEl.style.color = "red";
    }
  } catch (err) {
    console.error("❌ Encryption or verification failed:", err);
    resultEl.innerText = "❌ Encryption or verification failed.";
    resultEl.style.color = "red";
  } finally {
    btn.disabled = false;
    btn.innerText = "Encrypt + Verify";
  }
};
