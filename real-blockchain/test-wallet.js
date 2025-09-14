const Wallet = require('./src/wallet');
const Blockchain = require('./src/blockchain');

console.log('🧪 Testing Wallet Generation and Transactions...\n');

// Test 1: Generate a new wallet
console.log('1️⃣ Testing wallet generation...');
const wallet = new Wallet();
const walletInfo = wallet.generateWallet();

console.log('✅ Wallet generated successfully!');
console.log('📧 Address:', walletInfo.address);
console.log('🔑 Public Key:', walletInfo.publicKey.substring(0, 20) + '...');
console.log('🔐 Private Key:', walletInfo.privateKey.substring(0, 20) + '...\n');

// Test 2: Create a blockchain and add some initial balance
console.log('2️⃣ Testing blockchain initialization...');
const blockchain = new Blockchain();

// Add a genesis transaction to give the wallet some balance
const genesisTransaction = {
    from: 'Genesis',
    to: walletInfo.address,
    amount: 100,
    timestamp: Date.now()
};

// Add the transaction to pending transactions
blockchain.pendingTransactions.push(genesisTransaction);

console.log('✅ Blockchain initialized with genesis transaction');
console.log('💰 Initial balance for wallet:', 100, 'coins\n');

// Test 3: Mine a block to confirm the genesis transaction
console.log('3️⃣ Mining genesis block...');
const genesisBlock = blockchain.minePendingTransactions(walletInfo.address);
console.log('✅ Genesis block mined!');
console.log('📦 Block hash:', genesisBlock.hash.substring(0, 20) + '...');
console.log('⛏️  Mined by:', genesisBlock.miner);
console.log('💰 Block reward:', genesisBlock.reward, 'coins\n');

// Test 4: Check wallet balance
console.log('4️⃣ Checking wallet balance...');
const balance = blockchain.getBalance(walletInfo.address);
console.log('💰 Current balance:', balance, 'coins\n');

// Test 5: Create a transaction
console.log('5️⃣ Testing transaction creation...');
try {
    // Create a new wallet for receiving
    const recipientWallet = new Wallet('./test-recipient-wallet');
    const recipientInfo = recipientWallet.generateWallet();
    
    console.log('📧 Recipient address:', recipientInfo.address);
    
    // Create transaction from wallet to recipient
    const transaction = wallet.createTransaction(recipientInfo.address, 25, 0.001);
    
    console.log('✅ Transaction created successfully!');
    console.log('📤 From:', transaction.from);
    console.log('📥 To:', transaction.to);
    console.log('💰 Amount:', transaction.amount);
    console.log('💸 Fee:', transaction.fee);
    console.log('🔐 Signature:', transaction.signature.substring(0, 20) + '...\n');
    
    // Test 6: Add transaction to blockchain
    console.log('6️⃣ Adding transaction to blockchain...');
    blockchain.addTransaction(transaction);
    console.log('✅ Transaction added to pending transactions\n');
    
    // Test 7: Mine another block
    console.log('7️⃣ Mining block with transaction...');
    const newBlock = blockchain.minePendingTransactions(walletInfo.address);
    console.log('✅ Block mined!');
    console.log('📦 Block hash:', newBlock.hash.substring(0, 20) + '...');
    console.log('📋 Transactions in block:', newBlock.transactions.length);
    console.log('⛏️  Mined by:', newBlock.miner);
    console.log('💰 Block reward:', newBlock.reward, 'coins\n');
    
    // Test 8: Check final balances
    console.log('8️⃣ Checking final balances...');
    const senderBalance = blockchain.getBalance(walletInfo.address);
    const recipientBalance = blockchain.getBalance(recipientInfo.address);
    
    console.log('💰 Sender balance:', senderBalance, 'coins');
    console.log('💰 Recipient balance:', recipientBalance, 'coins');
    console.log('📊 Total coins in circulation:', blockchain.getTotalSupply(), 'coins\n');
    
    // Test 9: Validate blockchain
    console.log('9️⃣ Validating blockchain...');
    const isValid = blockchain.isChainValid();
    console.log('✅ Blockchain is valid:', isValid);
    console.log('📊 Blockchain stats:', blockchain.getStats());
    
} catch (error) {
    console.error('❌ Error during transaction test:', error.message);
}

console.log('\n🎉 Wallet and transaction tests completed!');
console.log('📁 Check the ./wallet and ./test-recipient-wallet directories for saved wallet files.');