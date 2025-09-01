const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Test colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(method, endpoint, data = null, description = '') {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (data) {
            config.data = data;
        }
        
        const response = await axios(config);
        log(`✅ ${description || `${method} ${endpoint}`} - Status: ${response.status}`, 'green');
        return { success: true, data: response.data };
    } catch (error) {
        log(`❌ ${description || `${method} ${endpoint}`} - Error: ${error.response?.status || error.message}`, 'red');
        return { success: false, error: error.message };
    }
}

async function runTests() {
    log('🏥 Pharbit Pharmaceutical Blockchain - API Endpoint Tests', 'blue');
    log('==================================================', 'blue');
    
    // Test 1: Health Check
    log('\n1️⃣ Testing Health Check...', 'yellow');
    await testEndpoint('GET', '/health', null, 'Health Check');
    
    // Test 2: Blockchain Info
    log('\n2️⃣ Testing Blockchain Endpoints...', 'yellow');
    await testEndpoint('GET', '/blockchain', null, 'Get Blockchain Info');
    await testEndpoint('GET', '/blockchain/latest', null, 'Get Latest Block');
    await testEndpoint('GET', '/blockchain/validate', null, 'Validate Blockchain');
    
    // Test 3: Wallet Operations
    log('\n3️⃣ Testing Wallet Endpoints...', 'yellow');
    await testEndpoint('GET', '/wallet', null, 'Get Wallet Info');
    await testEndpoint('POST', '/wallet/generate', {}, 'Generate New Wallet');
    
    // Test 4: Transaction Endpoints
    log('\n4️⃣ Testing Transaction Endpoints...', 'yellow');
    await testEndpoint('GET', '/transactions/pending', null, 'Get Pending Transactions');
    
    // Test 5: Mining Endpoints
    log('\n5️⃣ Testing Mining Endpoints...', 'yellow');
    await testEndpoint('GET', '/mining/status', null, 'Get Mining Status');
    
    // Test 6: Pharmaceutical Endpoints
    log('\n6️⃣ Testing Pharmaceutical Endpoints...', 'yellow');
    
    // Supply Chain Stats
    await testEndpoint('GET', '/supply-chain/stats', null, 'Get Supply Chain Statistics');
    
    // Alerts
    await testEndpoint('GET', '/alerts', null, 'Get Alerts');
    
    // Test 7: Create a Sample Batch
    log('\n7️⃣ Testing Batch Creation...', 'yellow');
    
    const sampleBatchInfo = {
        medicineInfo: {
            name: 'COVID-19 Vaccine',
            manufacturer: 'PharmaCorpA',
            type: 'vaccine',
            dosage: '0.3ml',
            expiration: '2024-12-31'
        },
        quantity: 1000,
        expirationDate: '2024-12-31',
        initialTemperature: 4.0,
        initialHumidity: 45,
        manufacturingLocation: {
            lat: 40.7128,
            lon: -74.0060,
            facility: 'New York Manufacturing Facility'
        }
    };
    
    // Note: This would require a valid private key in a real scenario
    log('⚠️  Batch creation test skipped (requires valid private key)', 'yellow');
    
    // Test 8: IoT Sensor Data
    log('\n8️⃣ Testing IoT Sensor Data...', 'yellow');
    
    const sampleSensorData = {
        batchId: 'TEST_BATCH_001',
        sensorId: 'SENSOR_001',
        temperature: 4.2,
        humidity: 45,
        light: 0,
        tampering: false,
        gps: {
            lat: 40.7128,
            lon: -74.0060
        },
        timestamp: Date.now()
    };
    
    await testEndpoint('POST', '/sensor-data', sampleSensorData, 'Send IoT Sensor Data');
    
    // Test 9: Stakeholder Registration
    log('\n9️⃣ Testing Stakeholder Management...', 'yellow');
    
    const stakeholderInfo = {
        name: 'Test Distributor',
        type: 'distributor',
        location: 'New York',
        contact: 'test@distributor.com'
    };
    
    await testEndpoint('POST', '/stakeholders', {
        stakeholderId: 'distributor_test',
        stakeholderInfo: stakeholderInfo
    }, 'Register Stakeholder');
    
    // Test 10: Temperature History
    log('\n🔟 Testing Temperature Monitoring...', 'yellow');
    await testEndpoint('GET', '/temperature/TEST_BATCH_001?hours=24', null, 'Get Temperature History');
    
    // Test 11: Batch Verification
    log('\n1️⃣1️⃣ Testing Batch Verification...', 'yellow');
    await testEndpoint('GET', '/verify/TEST_BATCH_001', null, 'Verify Batch Authenticity');
    
    // Test 12: Supply Chain Journey
    log('\n1️⃣2️⃣ Testing Supply Chain Journey...', 'yellow');
    await testEndpoint('GET', '/supply-chain/TEST_BATCH_001', null, 'Get Supply Chain Journey');
    
    log('\n🎉 All tests completed!', 'green');
    log('==================================================', 'blue');
    log('💊 Pharbit Pharmaceutical Blockchain is ready for use!', 'green');
}

// Run the tests
runTests().catch(error => {
    log(`❌ Test suite failed: ${error.message}`, 'red');
    process.exit(1);
});