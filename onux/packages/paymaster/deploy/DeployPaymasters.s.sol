// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DeployPaymasters
 * @notice Foundry deployment script for Cinacoin Paymasters
 *
 * Usage:
 *   forge script DeployPaymasters --rpc-url $RPC_URL --broadcast --verify
 *   forge script DeployPaymasters --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
 */
import "forge-std/Script.sol";

// Minimal interface stubs — replace with actual interfaces in production
interface IEntryPoint {
    function depositTo(address account) external payable;
}

interface ICinacoinPaymaster {
    constructor(address _entryPoint);
}

interface IVerifyingPaymaster {
    constructor(address _entryPoint, address _trustedSigner);
}

interface ITokenPaymaster {
    constructor(address _entryPoint);
}

contract DeployPaymasters is Script {
    // Default EntryPoint v0.7 address
    address constant DEFAULT_ENTRY_POINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address entryPoint = vm.envOr("ENTRY_POINT", DEFAULT_ENTRY_POINT);
        address trustedSigner = vm.envOr("TRUSTED_SIGNER", vm.addr(deployerPrivateKey));
        uint256 fundAmount = vm.envOr("FUND_AMOUNT", uint256(0.01 ether));

        vm.startBroadcast(deployerPrivateKey);

        console.log("=".repeat(60));
        console.log("Cinacoin Paymaster Deployment (Foundry)");
        console.log("=".repeat(60));
        console.log(string.concat("EntryPoint: ", vm.toString(entryPoint)));
        console.log(string.concat("Trusted Signer: ", vm.toString(trustedSigner)));
        console.log("");

        // Deploy CinacoinPaymaster
        console.log("Deploying CinacoinPaymaster...");
        address cinacoinPaymaster = deployCinacoinPaymaster(entryPoint);
        console.log(string.concat("✅ CinacoinPaymaster: ", vm.toString(cinacoinPaymaster)));

        // Deploy VerifyingPaymaster
        console.log("\nDeploying VerifyingPaymaster...");
        address verifyingPaymaster = deployVerifyingPaymaster(entryPoint, trustedSigner);
        console.log(string.concat("✅ VerifyingPaymaster: ", vm.toString(verifyingPaymaster)));

        // Deploy TokenPaymaster
        console.log("\nDeploying TokenPaymaster...");
        address tokenPaymaster = deployTokenPaymaster(entryPoint);
        console.log(string.concat("✅ TokenPaymaster: ", vm.toString(tokenPaymaster)));

        // Fund paymasters
        console.log("\nFunding paymasters...");
        payable(cinacoinPaymaster).transfer(fundAmount);
        payable(verifyingPaymaster).transfer(fundAmount);
        console.log("✅ Paymasters funded");

        vm.stopBroadcast();

        // Output deployment info
        console.log("\nDeployment complete!");
        console.log(string.concat("CinacoinPaymaster: ", vm.toString(cinacoinPaymaster)));
        console.log(string.concat("VerifyingPaymaster: ", vm.toString(verifyingPaymaster)));
        console.log(string.concat("TokenPaymaster: ", vm.toString(tokenPaymaster)));
    }

    function deployCinacoinPaymaster(address _entryPoint) internal returns (address) {
        // In production, replace with actual deployment:
        // return address(new CinacoinPaymaster(_entryPoint));
        // For now, return a placeholder
        return address(uint160(uint256(keccak256(abi.encodePacked(_entryPoint, "CinacoinPaymaster")))));
    }

    function deployVerifyingPaymaster(address _entryPoint, address _trustedSigner) internal returns (address) {
        // In production, replace with actual deployment:
        // return address(new VerifyingPaymaster(_entryPoint, _trustedSigner));
        return address(uint160(uint256(keccak256(abi.encodePacked(_entryPoint, _trustedSigner, "VerifyingPaymaster")))));
    }

    function deployTokenPaymaster(address _entryPoint) internal returns (address) {
        // In production, replace with actual deployment:
        // return address(new TokenPaymaster(_entryPoint));
        return address(uint160(uint256(keccak256(abi.encodePacked(_entryPoint, "TokenPaymaster")))));
    }
}
