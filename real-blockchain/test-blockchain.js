const Blockchain = require('./src/blockchain');
const Wallet = require('./src/wallet');
const Transaction = require('./src/transaction');
const CryptoUtils = require('./src/crypto');

console.log('🚀 Testing Real Blockchain Implementation');
console.log('=========================================');

async function testBlockchain() {
    try {
        // Initialize blockchain
        console.log('\n1. Initializing blockchain...');
        const blockchain = new Blockchain('./test-blockchain-db');
        
        // Wait for blockchain to initialize
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('✅ Blockchain initialized');
        console.log(`📊 Blockchain stats:`, blockchain.getStats());

        // Generate wallets
        console.log('\n2. Generating wallets...');
        const wallet1 = new Wallet('./test-wallet1');
        const wallet2 = new Wallet('./test-wallet2');
        
        const wallet1Info = wallet1.generateWallet();
        const wallet2Info = wallet2.generateWallet();
        
        console.log('✅ Wallet 1 generated:', wallet1Info.address);
        console.log('✅ Wallet 2 generated:', wallet2Info.address);

        // Mine initial blocks to give wallets coins
        console.log('\n3. Mining initial blocks for wallet funding...');
        
        // Mine block for wallet 1
        const block1 = blockchain.minePendingTransactions(wallet1Info.address);
        if (block1) {
            console.log('✅ Block 1 mined for wallet 1');
        }
        
        // Mine block for wallet 2
        const block2 = blockchain.minePendingTransactions(wallet2Info.address);
        if (block2) {
            console.log('✅ Block 2 mined for wallet 2');
        }

        // Check initial balances
        console.log('\n4. Checking initial balances...');
        const balance1 = blockchain.getBalance(wallet1Info.address);
        const balance2 = blockchain.getBalance(wallet2Info.address);
        
        console.log(`💰 Wallet 1 balance: ${balance1}`);
        console.log(`💰 Wallet 2 balance: ${balance2}`);

        // Create transactions
        console.log('\n5. Creating transactions...');
        const transaction1 = wallet1.createTransaction(wallet2Info.address, 10, 0.001);
        const transaction2 = wallet2.createTransaction(wallet1Info.address, 5, 0.001);
        
        console.log('✅ Transaction 1 created:', transaction1.getHash());
        console.log('✅ Transaction 2 created:', transaction2.getHash());

        // Add transactions to blockchain
        console.log('\n6. Adding transactions to blockchain...');
        blockchain.addTransaction(transaction1);
        blockchain.addTransaction(transaction2);
        
        console.log('✅ Transactions added to pending pool');
        console.log(`📊 Pending transactions: ${blockchain.pendingTransactions.length}`);

        // Mine a block with transactions
        console.log('\n7. Mining block with transactions...');
        const block3 = blockchain.minePendingTransactions(wallet1Info.address);
        
        if (block3) {
            console.log('✅ Block 3 mined successfully!');
            console.log(`📦 Block ${block3.index} hash: ${block3.hash}`);
            console.log(`⏱️  Mining time: ${block3.miningTime}ms`);
            console.log(`🔗 Previous hash: ${block3.previousHash}`);
            console.log(`🌳 Merkle root: ${block3.merkleRoot}`);
            console.log(`📋 Transactions in block: ${block3.transactions.length}`);
        } else {
            console.log('❌ Mining failed');
        }

        // Check final balances
        console.log('\n8. Checking final balances...');
        const finalBalance1 = blockchain.getBalance(wallet1Info.address);
        const finalBalance2 = blockchain.getBalance(wallet2Info.address);
        
        console.log(`💰 Wallet 1 final balance: ${finalBalance1}`);
        console.log(`💰 Wallet 2 final balance: ${finalBalance2}`);

        // Validate blockchain
        console.log('\n9. Validating blockchain...');
        const isValid = blockchain.isChainValid();
        console.log(`✅ Blockchain valid: ${isValid}`);

        // Get transaction history
        console.log('\n10. Transaction history...');
        const history1 = blockchain.getTransactionHistory(wallet1Info.address);
        const history2 = blockchain.getTransactionHistory(wallet2Info.address);
        
        console.log(`📋 Wallet 1 transactions: ${history1.length}`);
        console.log(`📋 Wallet 2 transactions: ${history2.length}`);

        // Show some transaction details
        if (history1.length > 0) {
            console.log('\n📋 Sample transaction from wallet 1:');
            console.log(`   ID: ${history1[0].id}`);
            console.log(`   From: ${history1[0].from}`);
            console.log(`   To: ${history1[0].to}`);
            console.log(`   Amount: ${history1[0].amount}`);
            console.log(`   Confirmed: ${history1[0].confirmed}`);
        }

        // Final stats
        console.log('\n11. Final blockchain stats...');
        const finalStats = blockchain.getStats();
        console.log('📊 Final Stats:', finalStats);

        // Show blockchain structure
        console.log('\n12. Blockchain structure...');
        console.log(`📦 Total blocks: ${blockchain.chain.length}`);
        blockchain.chain.forEach((block, index) => {
            console.log(`   Block ${index}: ${block.hash.substring(0, 16)}... (${block.transactions.length} transactions)`);
        });

        console.log('\n🎉 Real Blockchain Test Completed Successfully!');
        console.log('===============================================');
        
        // Cleanup
        console.log('\n🧹 Cleaning up test data...');
        const fs = require('fs');
        if (fs.existsSync('./test-blockchain-db')) {
            fs.rmSync('./test-blockchain-db', { recursive: true, force: true });
        }
        if (fs.existsSync('./test-wallet1')) {
            fs.rmSync('./test-wallet1', { recursive: true, force: true });
        }
        if (fs.existsSync('./test-wallet2')) {
            fs.rmSync('./test-wallet2', { recursive: true, force: true });
        }
        console.log('✅ Test data cleaned up');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error(error.stack);
    }
}

// Run the test
testBlockchain();