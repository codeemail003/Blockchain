import { supabase } from '../supabaseClient';

export const signup = async (email, password) => {
    const { user, error } = await supabase.auth.signUp({
        email,
        password,
    });
    return { user, error };
};

export const login = async (email, password) => {
    const { user, error } = await supabase.auth.signIn({
        email,
        password,
    });
    return { user, error };
};

export const createWallet = async () => {
    const response = await fetch('/api/wallet/create', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
    });
    return response.json();
};

export const getWalletBalance = async (address) => {
    const response = await fetch(`/api/wallet/balance/${address}`, {
        method: 'GET',
        credentials: 'include',
    });
    return response.json();
};

export const getWalletHistory = async (address) => {
    const response = await fetch(`/api/wallet/history/${address}`, {
        method: 'GET',
        credentials: 'include',
    });
    return response.json();
};

export const setMiningWallet = async (walletId) => {
    const response = await fetch('/api/wallet/mining', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletId }),
        credentials: 'include',
    });
    return response.json();
};

export const sendTransaction = async (transactionDetails) => {
    const response = await fetch('/api/transaction/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionDetails),
        credentials: 'include',
    });
    return response.json();
};