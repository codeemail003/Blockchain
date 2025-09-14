// Pharma-oriented contract templates defined in the SimpleVM DSL

const DrugBatchTracking = {
    name: 'DrugBatchTracking',
    ops: [
        { op: 'set', key: 'status', value: 'produced' },
        { op: 'set', key: 'owner', value: 'manufacturer' },
        { op: 'emit', event: 'BatchCreated', data: { status: 'produced' } }
    ]
};

const SupplyChainVerification = {
    name: 'SupplyChainVerification',
    ops: [
        { op: 'set', key: 'verified', value: false },
        { op: 'ifEq', key: 'temperatureSafe', value: true, then: [
            { op: 'set', key: 'verified', value: true },
            { op: 'emit', event: 'Verified', data: { reason: 'temperature_ok' } }
        ], else: [
            { op: 'emit', event: 'VerifyFailed', data: { reason: 'temperature_violation' } }
        ]}
    ]
};

const QualityAssurance = {
    name: 'QualityAssurance',
    ops: [
        { op: 'set', key: 'qaStatus', value: 'pending' },
        { op: 'ifEq', key: 'testsPassed', value: true, then: [
            { op: 'set', key: 'qaStatus', value: 'approved' },
            { op: 'emit', event: 'QAApproved', data: {} }
        ], else: [
            { op: 'set', key: 'qaStatus', value: 'rejected' },
            { op: 'emit', event: 'QARejected', data: {} }
        ]}
    ]
};

const TemperatureMonitoring = {
    name: 'TemperatureMonitoring',
    ops: [
        { op: 'ifEq', key: 'temperatureSafe', value: false, then: [
            { op: 'emit', event: 'TempAlert', data: { message: 'Temperature out of range' } }
        ], else: [
            { op: 'emit', event: 'TempOk', data: {} }
        ]}
    ]
};

module.exports = {
    DrugBatchTracking,
    SupplyChainVerification,
    QualityAssurance,
    TemperatureMonitoring
};

