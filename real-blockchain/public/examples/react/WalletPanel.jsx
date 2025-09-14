import React, { useState } from 'react';
import { usePharbit } from './PharbitClientProvider.jsx';

export default function WalletPanel() {
  const api = usePharbit();
  const [wallet, setWallet] = useState(null);
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState(1);
  const [fee, setFee] = useState(0.001);
  const [msg, setMsg] = useState('');

  const loadWallet = async () => setWallet(await api.getWallet());
  const gen = async () => { const r = await api.generateWallet(); setWallet(r.wallet); };
  const send = async () => { const r = await api.createTransaction(to, Number(amount), Number(fee)); setMsg(r.message); };

  return (
    <div>
      <h3>Wallet</h3>
      <button onClick={loadWallet}>Load</button>
      <button onClick={gen}>Generate</button>
      <div>Address: <code>{wallet?.address||'-'}</code></div>
      <div>
        <input placeholder="to" value={to} onChange={e=>setTo(e.target.value)} />
        <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
        <input type="number" value={fee} step="0.001" onChange={e=>setFee(e.target.value)} />
        <button onClick={send}>Send</button>
      </div>
      <div>{msg}</div>
    </div>
  );
}

