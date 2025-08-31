const { Wallets, Gateway } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Function to prompt user for input
function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer.trim());
        });
    });
}

async function interactiveTransaction() {
    try {
        console.log('🚀 Pharbit Blockchain - Interactive Transaction Creator');
        console.log('=====================================================');
        console.log('');

        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..', 'config', 'connection-org1.json');
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system based wallet for managing identities
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('❌ An identity for the user "appUser" does not exist in the wallet');
            console.log('Please run the registerUser.js application before retrying');
            rl.close();
            return;
        }

        // Create a new gateway for connecting to our peer node
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network
        const contract = network.getContract('transaction-tracking');

        console.log('✅ Connected to blockchain network successfully!');
        console.log('');

        // Get user input
        console.log('📝 Enter Transaction Details:');
        console.log('-----------------------------');
        
        const sender = await askQuestion('Sender Address: ');
        const receiver = await askQuestion('Receiver Address: ');
        const amountStr = await askQuestion('Amount: ');

        // Validate input
        if (!sender || !receiver || !amountStr) {
            console.log('❌ Error: All fields are required!');
            rl.close();
            await gateway.disconnect();
            return;
        }

        const amount = parseFloat(amountStr);
        if (isNaN(amount) || amount <= 0) {
            console.log('❌ Error: Amount must be a positive number!');
            rl.close();
            await gateway.disconnect();
            return;
        }

        if (sender === receiver) {
            console.log('❌ Error: Sender and receiver cannot be the same!');
            rl.close();
            await gateway.disconnect();
            return;
        }

        console.log('');
        console.log('📋 Transaction Summary:');
        console.log(`Sender: ${sender}`);
        console.log(`Receiver: ${receiver}`);
        console.log(`Amount: ${amount}`);
        console.log('');

        const confirm = await askQuestion('Do you want to proceed with this transaction? (y/n): ');
        if (confirm.toLowerCase() !== 'y' && confirm.toLowerCase() !== 'yes') {
            console.log('❌ Transaction cancelled by user.');
            rl.close();
            await gateway.disconnect();
            return;
        }

        console.log('');
        console.log('🚀 Executing Transaction...');
        console.log('==========================');

        // Check if sender account exists, create if not
        try {
            await contract.evaluateTransaction('GetAccount', sender);
            console.log('✅ Sender account found');
        } catch (error) {
            console.log('⚠️  Sender account not found, creating with initial balance...');
            const initialBalance = await askQuestion('Enter initial balance for sender (default 100): ');
            const balance = initialBalance ? parseFloat(initialBalance) : 100.0;
            await contract.submitTransaction('CreateAccount', sender, balance);
            console.log(`✅ Sender account created with balance: ${balance}`);
        }

        // Check if receiver account exists, create if not
        try {
            await contract.evaluateTransaction('GetAccount', receiver);
            console.log('✅ Receiver account found');
        } catch (error) {
            console.log('⚠️  Receiver account not found, creating with initial balance...');
            const initialBalance = await askQuestion('Enter initial balance for receiver (default 50): ');
            const balance = initialBalance ? parseFloat(initialBalance) : 50.0;
            await contract.submitTransaction('CreateAccount', receiver, balance);
            console.log(`✅ Receiver account created with balance: ${balance}`);
        }

        // Get initial balances
        console.log('');
        console.log('📊 Initial Account Balances:');
        try {
            const senderAccount = await contract.evaluateTransaction('GetAccount', sender);
            const senderData = JSON.parse(senderAccount.toString());
            console.log(`Sender: ${senderData.balance}`);
        } catch (error) {
            console.log('Error getting sender balance');
        }

        try {
            const receiverAccount = await contract.evaluateTransaction('GetAccount', receiver);
            const receiverData = JSON.parse(receiverAccount.toString());
            console.log(`Receiver: ${receiverData.balance}`);
        } catch (error) {
            console.log('Error getting receiver balance');
        }

        // Execute the transaction
        console.log('');
        console.log('🔄 Processing transaction...');
        const result = await contract.submitTransaction('CreateTransaction', sender, receiver, amount);

        console.log('✅ Transaction completed successfully!');
        console.log(`Transaction ID: ${result.toString()}`);

        // Get final balances
        console.log('');
        console.log('📊 Final Account Balances:');
        try {
            const senderAccount = await contract.evaluateTransaction('GetAccount', sender);
            const senderData = JSON.parse(senderAccount.toString());
            console.log(`Sender: ${senderData.balance}`);
        } catch (error) {
            console.log('Error getting sender balance');
        }

        try {
            const receiverAccount = await contract.evaluateTransaction('GetAccount', receiver);
            const receiverData = JSON.parse(receiverAccount.toString());
            console.log(`Receiver: ${receiverData.balance}`);
        } catch (error) {
            console.log('Error getting receiver balance');
        }

        // Show transaction details
        console.log('');
        console.log('📋 Transaction Details:');
        const allTransactions = await contract.evaluateTransaction('GetAllTransactions');
        const transactions = JSON.parse(allTransactions.toString());
        
        if (transactions.length > 0) {
            const latestTransaction = transactions[transactions.length - 1];
            console.log(`Transaction ID: ${latestTransaction.id}`);
            console.log(`From: ${latestTransaction.sender}`);
            console.log(`To: ${latestTransaction.receiver}`);
            console.log(`Amount: ${latestTransaction.quantity}`);
            console.log(`Status: ${latestTransaction.status}`);
            console.log(`Timestamp: ${latestTransaction.timestamp}`);
            console.log(`TX Hash: ${latestTransaction.txHash}`);
        }

        console.log('');
        console.log('🎉 Transaction block created successfully!');
        console.log('Your transaction has been added to the blockchain.');

        // Ask if user wants to create another transaction
        console.log('');
        const another = await askQuestion('Do you want to create another transaction? (y/n): ');
        if (another.toLowerCase() === 'y' || another.toLowerCase() === 'yes') {
            console.log('');
            await gateway.disconnect();
            rl.close();
            // Restart the application
            require('./interactive-transaction.js');
            return;
        }

        // Disconnect from the gateway
        await gateway.disconnect();
        rl.close();

        console.log('');
        console.log('👋 Thank you for using Pharbit Blockchain!');

    } catch (error) {
        console.error(`❌ Failed to create transaction: ${error}`);
        rl.close();
        process.exit(1);
    }
}

// Function to show help
function showHelp() {
    console.log('');
    console.log('📖 Interactive Transaction Creator Help:');
    console.log('=======================================');
    console.log('');
    console.log('This application allows you to create blockchain transactions');
    console.log('by simply entering the sender, receiver, and amount.');
    console.log('');
    console.log('Input Format:');
    console.log('- Sender Address: Any valid address (e.g., 0x1234... or ABC123...)');
    console.log('- Receiver Address: Any valid address (e.g., 0x5678... or XYZ789...)');
    console.log('- Amount: Positive number (e.g., 10, 25.5, 100)');
    console.log('');
    console.log('Features:');
    console.log('- Automatic account creation if not exists');
    console.log('- Balance validation');
    console.log('- Transaction confirmation');
    console.log('- Real-time balance updates');
    console.log('- Transaction history');
    console.log('');
}

// Main execution
async function main() {
    console.log('🚀 Starting Interactive Transaction Creator...');
    console.log('Type "help" for instructions or press Enter to continue');
    
    const input = await askQuestion('');
    
    if (input.toLowerCase() === 'help') {
        showHelp();
        const continueInput = await askQuestion('Press Enter to start creating transactions...');
    }
    
    await interactiveTransaction();
}

// Run the application
if (require.main === module) {
    main();
}

module.exports = { interactiveTransaction };