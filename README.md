🧠 Encrypted KYC Verifier

A privacy-preserving KYC attestation dApp built for the Zama Builders Track, demonstrating how users can prove compliance (age and residency) without revealing private information.
This project uses a simulated TFHE flow (via WASM) and an off-chain attestation service that signs eligibility proofs.

🌐 Live Demo
Component	URL	Host
Frontend (User dApp)	🔗 https://encrypted-kyc-verifier.vercel.app
	Vercel
Verifier Backend (Off-chain Attestation Service)	⚙️ https://encrypted-kyc-verifier-backend.onrender.com
	Render
Verifier Smart Contract (Sepolia Testnet)	📜 0xbE5307b187B8BB38F2D5da8daEfBde6c3E4dF7a4	Ethereum Sepolia
🧩 Architecture Overview

This project implements a three-part architecture:

1️⃣ Frontend (Vercel)

Pure HTML + JavaScript + Ethers.js

Integrates a WASM module (tfhe-wasm) for encrypted simulation

Connects to MetaMask for wallet-based identity

Calls the backend /attest API for verification

Displays signed attestation results

2️⃣ Verifier Backend (Render)

Node.js + Express + Ethers.js

Off-chain verifier signs eligibility proofs

Simple policy: user is eligible if
age ≥ 18 and countryCode == 826 (UK)

Returns { eligible, policyId, signature }

3️⃣ Smart Contract (Sepolia)

Optional component to verify signature proofs on-chain

Contract: KYCProofSale.sol

Uses OpenZeppelin’s ECDSA for signature recovery and policy validation

🔐 TFHE Integration

The dApp currently simulates Zama’s TFHE workflow using prebuilt WASM stubs.
The goal is to perform eligibility checks on encrypted inputs without revealing user data.

🧱 Current Simulation Flow
Step	Description
Encrypt age/country	done in tfhe_wasm.js
Send encrypted inputs	from frontend → backend
Simulate FHE logic	backend performs comparison (age ≥ 18)
Return signed eligibility proof	backend signs with verifier key
⚙️ TFHE Integration Journey & Challenges

One of the core goals of this project was to integrate Zama’s tfhe-rs library directly into a browser-based frontend to perform client-side encrypted eligibility checks.

During implementation, we faced significant practical challenges that shaped the project’s final architecture:

🧩 Challenge 1 — Compilation Barriers

Building tfhe-rs to WebAssembly using wasm-pack required large memory and CPU capacity.

On mid-range hardware (Intel i3 laptop), the build process could take over an hour and often failed due to wasm-bindgen memory exhaustion.

The generated WASM bundle exceeded the limits of Vercel’s static deployment runtime.

Decision: Simulate TFHE encryption using a lightweight Rust-inspired JS/WASM stub, allowing the dApp flow to run in real time.

⚡ Challenge 2 — Browser Integration Complexity

The official Zama tfhe-rs repo contains multiple crates (tfhe, tfhe-core, tfhe-zk-poc), not all browser-optimized.

The frontend build system required low-level glue code to manage memory between Rust and JS.

Webpack/Vite bundlers and WASM MIME configuration added extra friction for a single-page dApp deployment.

Decision: Replace direct TFHE calls with a modular encryption wrapper (tfhe_wasm.js), keeping interfaces identical to real TFHE APIs so that drop-in replacement is trivial later.

🔐 Challenge 3 — End-to-End Latency & Deployment Constraints

TFHE encryption/decryption cycles are computationally heavy.

Running them fully in-browser caused performance bottlenecks, particularly during Vercel’s static build.

Render’s free-tier backend could not efficiently handle serialized FHE ciphertexts.

Decision: Offload cryptographic operations to an off-chain verifier service, simulating homomorphic evaluation logic (age ≥ 18, country == UK).
This architecture mirrors a real-world hybrid FHE system where sensitive data processing happens off-chain, while on-chain verification remains lightweight.

🧱 Final Architecture (Hybrid FHE Approach)
Layer	Description	Implementation
Frontend	TFHE-inspired encryption + MetaMask	JS + WASM stub
Backend	Off-chain eligibility computation + signature	Express + Ethers.js
Blockchain	Smart contract for on-chain proof validation	Solidity (Sepolia)

This approach maintains the conceptual flow of Fully Homomorphic Encryption (FHE) while staying deployment-feasible under current hardware and platform constraints.
It is intentionally designed so that when tfhe-rs browser-ready builds stabilize, the encryption calls can be swapped in without modifying the app flow.

🛠️ Local Setup
Prerequisites

Node.js ≥ 18

MetaMask (connected to Sepolia)

npm

1️⃣ Clone the repo
git clone https://github.com/rembrandt2040/encrypted-kyc-verifier.git
cd encrypted-kyc-verifier

2️⃣ Setup the verifier backend
cd verifier
npm install


Create .env inside /verifier:

VERIFIER_PRIV_KEY=0xYOUR_PRIVATE_KEY_HERE
COUNTRY_CODE_ALLOWED=826
POLICY_ID=KYC_ELIGIBLE
PORT=8080


Run locally:

node index.js


✅ Server will start on:
http://127.0.0.1:8080

3️⃣ Run frontend locally
cd ..
npx serve public


Visit → http://localhost:3000

🚀 Deployment
Frontend (Vercel)

Deployment root: /public

Auto-deploys from GitHub

.wasm MIME configured via vercel.json

Backend (Render)

Deployment root: /verifier

Environment variables configured in Render dashboard

Public endpoint:
https://encrypted-kyc-verifier-backend.onrender.com/attest

🔎 User Flow

User opens the dApp on Vercel

Connects MetaMask (Sepolia)

Enters Age + Country Code

TFHE encrypts the data (simulated)

Data sent to /attest endpoint

Verifier backend checks eligibility & signs message

Frontend shows result:

Encrypting age=25, country=826…
✅ Verified!
Policy: KYC_ELIGIBLE
Signature: 0x1234abcd...

⚖️ Security & Privacy Notes

Private keys stored only in .env on Render (never on GitHub)

No raw KYC data stored

All communication secured via HTTPS

Ready for drop-in replacement of Zama’s TFHE encryption libraries

🧠 Challenge Alignment (Zama Scoring)
Category	Weight	Description
Tech Architecture (35%)	✅ Original verifier system simulating FHE logic	
Working Demo (15%)	✅ Live frontend + backend demo deployed	
Testing (10%)	Manual + browser-based functional verification	
UI/UX (10%)	✅ Clean, intuitive, single-page interface	
Presentation Video (10%)	To be recorded — walkthrough of both services	
Development Effort (10%)	✅ Multi-layer integration (Solidity + JS + WASM)	
Business Potential (10%)	✅ Reusable privacy verification system for DeFi/ID apps	
📜 License

MIT License © 2025 rembrandt2040

🧠 Credits

Built by rembrandt2040 for the Zama Builders Track.
Demonstrates encrypted eligibility proofs using TFHE simulation, decentralized identity, and smart contract-verified attestations.
