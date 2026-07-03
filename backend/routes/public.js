const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const Product = require('../models/Product');
const Social = require('../models/Social');

// Helper: Get full base URL from request
function getBaseUrl(req) {
    return `${req.protocol}://${req.get('host')}`;
}

// Helper: Ensure image URL is absolute
function ensureFullUrl(imageUrl, baseUrl) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }
    if (imageUrl.startsWith('/')) {
        return baseUrl + imageUrl;
    }
    return baseUrl + '/' + imageUrl;
}

// Helper: Process category with full image URLs
function processCategory(cat, baseUrl) {
    const obj = cat.toObject ? cat.toObject() : cat;
    obj.image = ensureFullUrl(obj.image, baseUrl);
    return obj;
}

// Helper: Process product with full image URLs
function processProduct(prod, baseUrl) {
    const obj = prod.toObject ? prod.toObject() : prod;
    if (obj.images && Array.isArray(obj.images)) {
        obj.images = obj.images.map(img => ensureFullUrl(img, baseUrl));
    }
    // Handle populated categoryId
    if (obj.categoryId && typeof obj.categoryId === 'object') {
        if (obj.categoryId.image) {
            obj.categoryId.image = ensureFullUrl(obj.categoryId.image, baseUrl);
        }
    }
    return obj;
}

// Public routes - NO AUTH REQUIRED

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories.map(cat => processCategory(cat, baseUrl)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single category
router.get('/categories/:id', async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(processCategory(category, baseUrl));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all products
router.get('/products', async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const { category } = req.query;
        let query = {};
        if (category) {
            query.categoryId = category;
        }
        const products = await Product.find(query).sort({ createdAt: -1 }).populate('categoryId', 'name image description');
        res.json(products.map(prod => processProduct(prod, baseUrl)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product
router.get('/products/:id', async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const product = await Product.findById(req.params.id).populate('categoryId', 'name image description');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(processProduct(product, baseUrl));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get social links
router.get('/social', async (req, res) => {
    try {
        const social = await Social.find().sort({ createdAt: -1 });
        res.json(social);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;