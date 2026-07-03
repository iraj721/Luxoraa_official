const express = require('express');
const router = express.Router();

const Category = require('../models/Category');
const Product = require('../models/Product');
const Social = require('../models/Social');

// Public routes - NO AUTH REQUIRED
// Images are already full Cloudinary URLs, no processing needed

// Get all categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single category
router.get('/categories/:id', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ message: 'Category not found' });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get all products
router.get('/products', async (req, res) => {
    try {
        const { category } = req.query;
        let query = {};
        if (category) {
            query.categoryId = category;
        }
        const products = await Product.find(query)
            .sort({ createdAt: -1 })
            .populate('categoryId', 'name image description');
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get single product
router.get('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'name image description');
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
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