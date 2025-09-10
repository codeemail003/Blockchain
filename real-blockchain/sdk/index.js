/**
 * PharbitChain JavaScript SDK
 * Lightweight client for web/mobile integrations.
 */
export class PharbitClient {
  constructor(baseUrl = 'http://localhost:3000/api') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  // --- Helpers ---
  async _req(path, opts = {}) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
      ...opts
    });
    const text = await res.text();
    let data; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const msg = (data && data.error) || res.statusText || 'Request failed';
      const err = new Error(msg);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // --- Wallet ---
  getWallet() { return this._req('/wallet'); }
  generateWallet() { return this._req('/wallet/generate', { method: 'POST' }); }
  importWallet(privateKey) { return this._req('/wallet/import', { method: 'POST', body: JSON.stringify({ privateKey }) }); }
  createTransaction(to, amount, fee=0.001) {
    return this._req('/wallet/transaction', { method: 'POST', body: JSON.stringify({ to, amount, fee }) });
  }

  // --- Blockchain ---
  getBlockchain() { return this._req('/blockchain'); }
  getLatestBlock() { return this._req('/blockchain/latest'); }
  getBalance(address) { return this._req(`/balance/${address}`); }
  getTxHistory(address) { return this._req(`/transactions/${address}`); }
  mine(minerAddress) { return this._req('/mine', { method: 'POST', body: JSON.stringify({ minerAddress }) }); }
  health() { return this._req('/health'); }

  // --- Pharma ---
  createBatch(payload) { return this._req('/batch', { method: 'POST', body: JSON.stringify(payload) }); }
  getBatch(batchId) { return this._req(`/batch/${batchId}`); }
  sensorData(payload) { return this._req('/sensor-data', { method: 'POST', body: JSON.stringify(payload) }); }

  // --- Contracts ---
  deployContract({ code, template, initState }) {
    return this._req('/contracts/deploy', { method: 'POST', body: JSON.stringify({ code, template, initState }) });
  }
  callContract(address, ops, gasLimit) {
    return this._req('/contracts/call', { method: 'POST', body: JSON.stringify({ address, ops, gasLimit }) });
  }
  getContractState(address) { return this._req(`/contracts/state/${address}`); }
}

// --- QR Utilities ---
export async function toQRCodeDataUrl(text) {
  const { toDataURL } = await import('qrcode');
  return await toDataURL(text, { errorCorrectionLevel: 'M', margin: 1, width: 220 });
}

export function buildAddressQR(address) {
  return toQRCodeDataUrl(`pharbitchain:address:${address}`);
}

export function buildTxQR({ to, amount, fee }) {
  return toQRCodeDataUrl(`pharbitchain:tx:${JSON.stringify({ to, amount, fee })}`);
}

export function buildBatchQR(batchId) {
  return toQRCodeDataUrl(`pharbitchain:batch:${batchId}`);
}

