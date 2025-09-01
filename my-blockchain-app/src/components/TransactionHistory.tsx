import React, { useEffect, useState } from 'react';
import { fetchTransactionHistory } from '../api/backend';

const TransactionHistory: React.FC<{ address: string }> = ({ address }) => {
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getTransactionHistory = async () => {
            try {
                const data = await fetchTransactionHistory(address);
                setTransactions(data);
            } catch (err) {
                setError('Failed to fetch transaction history');
            } finally {
                setLoading(false);
            }
        };

        getTransactionHistory();
    }, [address]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Transaction History for {address}</h2>
            <ul>
                {transactions.map((transaction) => (
                    <li key={transaction.id}>
                        <p>Transaction ID: {transaction.id}</p>
                        <p>Amount: {transaction.amount}</p>
                        <p>Date: {new Date(transaction.date).toLocaleString()}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TransactionHistory;