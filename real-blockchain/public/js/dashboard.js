// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the dashboard
    initializeDashboard();
    
    // Set up real-time updates
    setupWebSocket();
    
    // Initialize charts
    initializeCharts();
    
    // Set up event handlers
    setupEventHandlers();
});

// Initialize dashboard with data
async function initializeDashboard() {
    try {
        // Fetch initial metrics
        const metrics = await fetchMetrics();
        updateMetrics(metrics);
        
        // Fetch active batches
        const batches = await fetchBatches();
        updateBatchTable(batches);
        
        // Fetch recent activity
        const activities = await fetchRecentActivity();
        updateActivityFeed(activities);
        
        // Fetch compliance data
        const compliance = await fetchComplianceData();
        updateComplianceTable(compliance);
        
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        showError('Dashboard initialization failed');
    }
}

// WebSocket connection for real-time updates
function setupWebSocket() {
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        
        switch(data.type) {
            case 'METRICS_UPDATE':
                updateMetrics(data.metrics);
                break;
                
            case 'NEW_BATCH':
                addBatchToTable(data.batch);
                break;
                
            case 'TEMPERATURE_ALERT':
                showAlert(data.alert);
                break;
                
            case 'NEW_ACTIVITY':
                addActivityToFeed(data.activity);
                break;
        }
    };
    
    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
        showError('Real-time updates disconnected');
    };
}

// Initialize Charts
function initializeCharts() {
    // Batch Performance Chart
    const batchCtx = document.getElementById('batch-performance-chart').getContext('2d');
    new Chart(batchCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Successful Batches',
                data: [12, 19, 15, 17, 14, 16],
                borderColor: '#4caf50',
                tension: 0.1
            }]
        },
        options: {
            responsive: true
        }
    });
    
    // Temperature Compliance Chart
    const tempCtx = document.getElementById('temperature-chart').getContext('2d');
    new Chart(tempCtx, {
        type: 'bar',
        data: {
            labels: ['Within Range', 'Warning', 'Critical'],
            datasets: [{
                label: 'Temperature Readings',
                data: [75, 20, 5],
                backgroundColor: [
                    '#4caf50',
                    '#ff9800',
                    '#f44336'
                ]
            }]
        },
        options: {
            responsive: true
        }
    });
}

// Event Handlers
function setupEventHandlers() {
    // Create Batch Form
    document.getElementById('create-batch-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            const formData = new FormData(e.target);
            const response = await createBatch(formData);
            if (response.success) {
                showSuccess('Batch created successfully');
                addBatchToTable(response.batch);
            }
        } catch (error) {
            showError('Failed to create batch');
        }
    });
    
    // Verify Batch Form
    document.getElementById('verify-batch-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            const batchId = e.target.elements.batchId.value;
            const response = await verifyBatch(batchId);
            if (response.valid) {
                showSuccess('Batch verified successfully');
            } else {
                showError('Batch verification failed');
            }
        } catch (error) {
            showError('Failed to verify batch');
        }
    });
    
    // Settings Form
    document.getElementById('settings-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        try {
            const settings = {
                temperatureUnit: e.target.elements['temp-unit'].value,
                emailNotifications: e.target.elements['email-notifications'].checked,
                smsNotifications: e.target.elements['sms-notifications'].checked
            };
            await updateSettings(settings);
            showSuccess('Settings updated successfully');
        } catch (error) {
            showError('Failed to update settings');
        }
    });
}

// API Calls
async function fetchMetrics() {
    const response = await fetch('/api/metrics');
    return response.json();
}

async function fetchBatches() {
    const response = await fetch('/api/batches');
    return response.json();
}

async function createBatch(formData) {
    const response = await fetch('/api/batches', {
        method: 'POST',
        body: formData
    });
    return response.json();
}

async function verifyBatch(batchId) {
    const response = await fetch(`/api/batches/${batchId}/verify`);
    return response.json();
}

async function fetchRecentActivity() {
    const response = await fetch('/api/activity');
    return response.json();
}

async function fetchComplianceData() {
    const response = await fetch('/api/compliance');
    return response.json();
}

async function updateSettings(settings) {
    const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
    });
    return response.json();
}

// UI Updates
function updateMetrics(metrics) {
    document.getElementById('active-batches').textContent = metrics.activeBatches;
    document.getElementById('compliance-rate').textContent = `${metrics.complianceRate}%`;
    document.getElementById('cold-chain-status').textContent = metrics.coldChainStatus;
    document.getElementById('pending-approvals').textContent = metrics.pendingApprovals;
}

function updateBatchTable(batches) {
    const tableBody = document.getElementById('batch-table-body');
    tableBody.innerHTML = '';
    
    batches.forEach(batch => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${batch.id}</td>
            <td>${batch.product}</td>
            <td>${new Date(batch.createdDate).toLocaleDateString()}</td>
            <td><span class="badge bg-${getBatchStatusColor(batch.status)}">${batch.status}</span></td>
            <td>${batch.temperature}°C</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewBatchDetails('${batch.id}')">
                    <i class="ri-eye-line"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="verifyBatch('${batch.id}')">
                    <i class="ri-shield-check-line"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

function updateActivityFeed(activities) {
    const feed = document.getElementById('activity-feed');
    feed.innerHTML = '';
    
    activities.forEach(activity => {
        const item = document.createElement('div');
        item.className = 'list-group-item';
        item.innerHTML = `
            <div class="d-flex w-100 justify-content-between">
                <h6 class="mb-1">${activity.type}</h6>
                <small>${formatTimestamp(activity.timestamp)}</small>
            </div>
            <p class="mb-1">${activity.description}</p>
        `;
        feed.appendChild(item);
    });
}

function updateComplianceTable(compliance) {
    const tableBody = document.getElementById('compliance-table-body');
    tableBody.innerHTML = '';
    
    compliance.forEach(report => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${report.id}</td>
            <td>${report.type}</td>
            <td>${new Date(report.date).toLocaleDateString()}</td>
            <td><span class="badge bg-${getComplianceStatusColor(report.status)}">${report.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="viewReport('${report.id}')">
                    <i class="ri-file-list-line"></i>
                </button>
                <button class="btn btn-sm btn-success" onclick="downloadReport('${report.id}')">
                    <i class="ri-download-line"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Utility Functions
function showAlert(alert) {
    const container = document.getElementById('alerts-container');
    const alertEl = document.createElement('div');
    alertEl.className = `alert alert-${alert.type} alert-dismissible fade show`;
    alertEl.innerHTML = `
        ${alert.message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    container.appendChild(alertEl);
}

function showSuccess(message) {
    showAlert({
        type: 'success',
        message: message
    });
}

function showError(message) {
    showAlert({
        type: 'danger',
        message: message
    });
}

function getBatchStatusColor(status) {
    const colors = {
        'ACTIVE': 'success',
        'PENDING': 'warning',
        'COMPLETED': 'primary',
        'RECALLED': 'danger'
    };
    return colors[status] || 'secondary';
}

function getComplianceStatusColor(status) {
    const colors = {
        'COMPLIANT': 'success',
        'WARNING': 'warning',
        'VIOLATION': 'danger'
    };
    return colors[status] || 'secondary';
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Batch Operations
function viewBatchDetails(batchId) {
    // Implementation for viewing batch details
    console.log('Viewing batch:', batchId);
}

function downloadReport(reportId) {
    // Implementation for downloading compliance report
    console.log('Downloading report:', reportId);
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDashboard,
        setupWebSocket,
        initializeCharts,
        setupEventHandlers
    };
}