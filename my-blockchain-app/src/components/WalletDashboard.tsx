import React, { useEffect, useState } from 'react';
import { getWallets, getWalletBalance } from '../api/backend';

const WalletDashboard: React.FC = () => {
    const [wallets, setWallets] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchWallets = async () => {
            const fetchedWallets = await getWallets();
            setWallets(fetchedWallets);
            setLoading(false);
        };

        fetchWallets();
    }, []);

    const handleBalanceFetch = async (address: string) => {
        const balance = await getWalletBalance(address);
        alert(`Balance for ${address}: ${balance}`);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <h2>Wallet Dashboard</h2>
            <ul>
                {wallets.map(wallet => (
                    <li key={wallet.id}>
                        <span>Address: {wallet.address}</span>
                        <span> (Mining Wallet: {wallet.is_mining_wallet ? 'Yes' : 'No'})</span>
                        <button onClick={() => handleBalanceFetch(wallet.address)}>Check Balance</button>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default WalletDashboard;