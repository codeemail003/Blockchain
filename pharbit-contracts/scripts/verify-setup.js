const { existsSync, readFileSync } = require('fs');
const { execSync } = require('child_process');

console.log("🔍 Verifying Pharbit Contracts Setup");
console.log("====================================");

let allGood = true;

// Check if we're in the right directory
if (!existsSync('package.json') || !existsSync('hardhat.config.cjs')) {
    console.log("❌ Not in pharbit-contracts directory");
    allGood = false;
} else {
    console.log("✅ In correct directory");
}

// Check package.json
try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    if (packageJson.type !== 'commonjs') {
        console.log("❌ package.json type should be 'commonjs'");
        allGood = false;
    } else {
        console.log("✅ package.json configured for CommonJS");
    }
    
    if (!packageJson.scripts['deploy:localhost']) {
        console.log("❌ Missing deploy:localhost script");
        allGood = false;
    } else {
        console.log("✅ deploy:localhost script found");
    }
} catch (e) {
    console.log("❌ Error reading package.json:", e.message);
    allGood = false;
}

// Check hardhat config
if (!existsSync('hardhat.config.cjs')) {
    console.log("❌ hardhat.config.cjs not found");
    allGood = false;
} else {
    console.log("✅ hardhat.config.cjs found");
}

// Check deployment script
if (!existsSync('scripts/deploy-localhost.js')) {
    console.log("❌ scripts/deploy-localhost.js not found");
    allGood = false;
} else {
    console.log("✅ scripts/deploy-localhost.js found");
}

// Check export script
if (!existsSync('scripts/export-addresses.js')) {
    console.log("❌ scripts/export-addresses.js not found");
    allGood = false;
} else {
    console.log("✅ scripts/export-addresses.js found");
}

// Check deploy script
if (!existsSync('deploy.sh')) {
    console.log("❌ deploy.sh not found");
    allGood = false;
} else {
    console.log("✅ deploy.sh found");
}

// Check contracts
const contracts = [
    'contracts/PharbitGovernance.sol',
    'contracts/PharbitStakeholder.sol',
    'contracts/PharbitSensor.sol',
    'contracts/PharbitBatch.sol',
    'contracts/PharbitSupplyChain.sol'
];

let contractsFound = 0;
contracts.forEach(contract => {
    if (existsSync(contract)) {
        contractsFound++;
    }
});

if (contractsFound === contracts.length) {
    console.log("✅ All 5 contracts found");
} else {
    console.log(`❌ Only ${contractsFound}/5 contracts found`);
    allGood = false;
}

// Check if contracts compile
try {
    console.log("🔨 Testing contract compilation...");
    execSync('npm run compile', { stdio: 'pipe' });
    console.log("✅ Contracts compile successfully");
} catch (e) {
    console.log("❌ Contract compilation failed");
    allGood = false;
}

// Check Node.js version
try {
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    if (majorVersion >= 16) {
        console.log(`✅ Node.js version ${nodeVersion} is compatible`);
    } else {
        console.log(`❌ Node.js version ${nodeVersion} is too old (need 16+)`);
        allGood = false;
    }
} catch (e) {
    console.log("❌ Error checking Node.js version");
    allGood = false;
}

console.log("\n" + "=".repeat(40));
if (allGood) {
    console.log("🎉 All checks passed! Ready for deployment.");
    console.log("\nNext steps:");
    console.log("1. Run: ./deploy.sh");
    console.log("2. Or: npm run deploy:full");
} else {
    console.log("❌ Some checks failed. Please fix the issues above.");
    process.exit(1);
}