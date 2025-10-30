// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/utils/cryptography/ECDSA.sol";

contract KYCProofSale {
    using ECDSA for bytes32;

    address public verifierSigner;
    mapping(address => bool) public hasPurchased;

    event Purchased(address indexed buyer, string policyId, bool eligible);

    constructor(address _verifierSigner) {
        verifierSigner = _verifierSigner;
    }

    function buy(
        string memory policyId,
        bool eligible,
        bytes memory signature
    ) external {
        require(!hasPurchased[msg.sender], "Already purchased");
        require(eligible, "Not eligible per verifier");

        bytes32 messageHash = keccak256(abi.encodePacked(msg.sender, policyId, eligible));
        address recovered = ECDSA.toEthSignedMessageHash(messageHash).recover(signature);
        require(recovered == verifierSigner, "Invalid verifier signature");

        hasPurchased[msg.sender] = true;
        emit Purchased(msg.sender, policyId, eligible);
    }
}
