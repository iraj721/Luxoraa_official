const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const { login, verifyToken } = require('../middleware/auth');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Social = require('../models/Social');

// Multer setup for image uploads (optional - for direct file uploads)
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images allowed'), false);
        }
    }
});

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

// Helper: Process and save image from buffer
async function processImage(buffer, filename, width, height) {
    const processed = await sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();
    
    const filepath = path.join(__dirname, '../uploads', filename);
    await sharp(processed).toFile(filepath);
    return `/uploads/${filename}`;
}

// Helper: Process and save image from base64
async function processBase64Image(base64String, filename, width, height) {
    // Remove data:image/...;base64, prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const processed = await sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();
    
    const filepath = path.join(__dirname, '../uploads', filename);
    await sharp(processed).toFile(filepath);
    return `/uploads/${filename}`;
}

// Helper: Check if string is base64 image
function isBase64Image(str) {
    return typeof str === 'string' && str.startsWith('data:image');
}

// Helper: Process images (handles both base64 and file uploads)
async function processImages(input, filenamePrefix, width, height) {
    const imageUrls = [];
    
    if (Array.isArray(input)) {
        for (const item of input) {
            if (isBase64Image(item)) {
                const filename = `${filenamePrefix}_${uuidv4()}.jpg`;
                const url = await processBase64Image(item, filename, width, height);
                imageUrls.push(url);
            } else if (typeof item === 'string' && item.startsWith('/uploads/')) {
                // Already processed image URL, keep as is
                imageUrls.push(item);
            }
        }
    }
    
    return imageUrls;
}

// Helper: Process product response with full URLs
function processProductResponse(prod, baseUrl) {
    const obj = prod.toObject ? prod.toObject() : prod;
    if (obj.images && Array.isArray(obj.images)) {
        obj.images = obj.images.map(img => ensureFullUrl(img, baseUrl));
    }
    if (obj.categoryId && typeof obj.categoryId === 'object') {
        if (obj.categoryId.image) {
            obj.categoryId.image = ensureFullUrl(obj.categoryId.image, baseUrl);
        }
    }
    return obj;
}

function processCategoryResponse(cat, baseUrl) {
    const obj = cat.toObject ? cat.toObject() : cat;
    obj.image = ensureFullUrl(obj.image, baseUrl);
    return obj;
}

// Auth routes
router.post('/login', login);

// Categories CRUD
router.get('/categories', verifyToken, async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories.map(cat => processCategoryResponse(cat, baseUrl)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/categories', verifyToken, async (req, res) => {
    try {
        let imageUrl = req.body.image;
        
        // Handle base64 image
        if (isBase64Image(imageUrl)) {
            const filename = `cat_${uuidv4()}.jpg`;
            imageUrl = await processBase64Image(imageUrl, filename, 800, 600);
        }
        
        const category = new Category({
            name: req.body.name,
            image: imageUrl,
            description: req.body.description || ''
        });
        
        await category.save();
        const baseUrl = getBaseUrl(req);
        res.status(201).json(processCategoryResponse(category, baseUrl));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/categories/:id', verifyToken, async (req, res) => {
    try {
        const updateData = {
            name: req.body.name,
            description: req.body.description || ''
        };
        
        // Handle base64 image
        if (isBase64Image(req.body.image)) {
            const filename = `cat_${uuidv4()}.jpg`;
            updateData.image = await processBase64Image(req.body.image, filename, 800, 600);
        } else if (req.body.image) {
            updateData.image = req.body.image;
        }
        
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        const baseUrl = getBaseUrl(req);
        res.json(processCategoryResponse(category, baseUrl));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/categories/:id', verifyToken, async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Products CRUD
router.get('/products', verifyToken, async (req, res) => {
    try {
        const baseUrl = getBaseUrl(req);
        const products = await Product.find().sort({ createdAt: -1 }).populate('categoryId', 'name image description');
        res.json(products.map(prod => processProductResponse(prod, baseUrl)));
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/products', verifyToken, async (req, res) => {
    try {
        let imageUrls = [];
        
        // Handle images array from frontend
        if (req.body.images) {
            const images = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
            imageUrls = await processImages(images, 'prod', 600, 800);
        }
        
        const product = new Product({
            title: req.body.title,
            categoryId: req.body.categoryId,
            images: imageUrls,
            description: req.body.description || '',
            link: req.body.link
        });
        
        await product.save();
        const baseUrl = getBaseUrl(req);
        res.status(201).json(processProductResponse(product, baseUrl));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/products/:id', verifyToken, async (req, res) => {
    try {
        const updateData = {
            title: req.body.title,
            categoryId: req.body.categoryId,
            description: req.body.description || '',
            link: req.body.link
        };
        
        // Handle images array from frontend
        if (req.body.images) {
            const images = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
            updateData.images = await processImages(images, 'prod', 600, 800);
        }
        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        const baseUrl = getBaseUrl(req);
        res.json(processProductResponse(product, baseUrl));
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/products/:id', verifyToken, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Social CRUD
router.get('/social', verifyToken, async (req, res) => {
    try {
        const social = await Social.find().sort({ createdAt: -1 });
        res.json(social);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/social', verifyToken, async (req, res) => {
    try {
        const social = new Social({
            name: req.body.name,
            icon: req.body.icon,
            url: req.body.url
        });
        await social.save();
        res.status(201).json(social);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/social/:id', verifyToken, async (req, res) => {
    try {
        const social = await Social.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                icon: req.body.icon,
                url: req.body.url
            },
            { new: true }
        );
        res.json(social);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/social/:id', verifyToken, async (req, res) => {
    try {
        await Social.findByIdAndDelete(req.params.id);
        res.json({ message: 'Social link deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Dashboard stats
router.get('/stats', verifyToken, async (req, res) => {
    try {
        const categories = await Category.countDocuments();
        const products = await Product.countDocuments();
        const social = await Social.countDocuments();
        
        res.json({ categories, products, social });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;