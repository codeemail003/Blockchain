const express = require('express');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// User Registration
router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    const password_hash = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
        .from('users')
        .insert([{ email, password_hash }]);

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json({ message: 'User registered successfully', user: data });
});

// User Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (error || !user) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate session token or JWT here (not implemented in this example)
    res.status(200).json({ message: 'Login successful', user });
});

module.exports = router;