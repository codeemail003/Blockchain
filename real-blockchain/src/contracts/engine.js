const { Level } = require('level');
const SimpleVM = require('./vm');
const Crypto = require('../crypto');

class ContractEngine {
    constructor(dbPath = './contract-state', maxGas = 10000) {
        this.db = new Level(dbPath, { valueEncoding: 'json' });
        this.vm = new SimpleVM(maxGas);
    }

    async open() {
        try { await this.db.open(); } catch (_) {}
    }

    contractKey(addr) { return `contract:${addr}`; }
    stateKey(addr) { return `state:${addr}`; }

    generateAddress(code) {
        const seed = JSON.stringify(code) + Date.now();
        return '0x' + Crypto.sha256(seed).slice(0, 40);
    }

    async deploy({ code, initState }) {
        const address = this.generateAddress(code);
        await this.db.put(this.contractKey(address), { address, code, createdAt: Date.now() });
        await this.db.put(this.stateKey(address), initState || {});
        return { address };
    }

    async call({ address, ops, gasLimit }) {
        const contract = await this.db.get(this.contractKey(address));
        const state = await this.db.get(this.stateKey(address));
        const vm = new SimpleVM(gasLimit || this.vm.maxGas);
        const res = vm.run(ops || contract.code, state, {});
        await this.db.put(this.stateKey(address), res.state);
        return res;
    }

    async getState(address) {
        try { return await this.db.get(this.stateKey(address)); } catch { return null; }
    }
    async getContract(address) {
        try { return await this.db.get(this.contractKey(address)); } catch { return null; }
    }
}

module.exports = ContractEngine;

