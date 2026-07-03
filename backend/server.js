const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// CORS - Allow both local and production frontend
const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',') 
    : [
        'http://localhost:5500',
        'http://localhost:5000',
        'https://luxoraa.vercel.app',
        'https://www.luxoraa.vercel.app'
      ];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - uploads folder (temporary for old images migration)
// Remove this after migrating old images to Cloudinary
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/admin', require('./routes/admin'));
app.use('/api/public', require('./routes/public'));

// ============================================
// SERVE FRONTEND STATIC FILES
// ============================================
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

app.get('/index.html', (req, res) => {
    res.redirect('/');
});

app.get('/categories.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'categories.html'));
});

app.get('/products.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'products.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'about.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(frontendPath, 'admin.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin.html');
});

app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/images/favicon.ico'));
});

// ============================================
// MongoDB Connection
// ============================================
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/luxoraa', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend: http://localhost:${PORT}`);
    console.log(`Admin: http://localhost:${PORT}/admin.html`);
    console.log(`API: http://localhost:${PORT}/api`);
    console.log(`Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME || 'NOT CONFIGURED'}`);
    console.log(`========================================`);
});