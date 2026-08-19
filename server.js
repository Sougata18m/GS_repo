const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');
require('dotenv').config();

// Configure DNS servers to resolve MongoDB Atlas SRV records on Windows
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
    // Ignore if DNS override is restricted
}

const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/expense_tracker';

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from 'Expense Tracker' directory
app.use(express.static(path.join(__dirname, 'Expense Tracker')));

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB successfully!'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('💡 Note: Make sure local MongoDB server is running OR set valid MONGODB_URI in .env file.');
    });

// API Routes

// 1. Get all transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        // Map _id to id for frontend compatibility
        const formatted = transactions.map(tx => ({
            id: tx._id.toString(),
            _id: tx._id.toString(),
            type: tx.type,
            amount: tx.amount,
            category: tx.category,
            date: tx.date
        }));
        res.json(formatted);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Add new transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const { type, amount, category, date } = req.body;
        const newTx = new Transaction({ type, amount, category, date });
        const saved = await newTx.save();
        res.status(201).json({
            id: saved._id.toString(),
            _id: saved._id.toString(),
            type: saved.type,
            amount: saved.amount,
            category: saved.category,
            date: saved.date
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// 3. Delete transaction by ID
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: 'Transaction deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Fallback to index.html for any unmatched route
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'Expense Tracker', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Expense Tracker Server running at http://localhost:${PORT}`);
});
