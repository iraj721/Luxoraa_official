const express = require('express');
const router = express.Router();
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const cloudinary = require('../config/cloudinary');

const { login, verifyToken } = require('../middleware/auth');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Social = require('../models/Social');

// ============================================
// CLOUDINARY UPLOAD HELPERS
// ============================================

// Helper: Check if string is base64 image
function isBase64Image(str) {
    return typeof str === 'string' && str.startsWith('data:image');
}

// Helper: Upload base64 image to Cloudinary
async function uploadBase64ToCloudinary(base64String, folder, width, height) {
    // Remove data:image/...;base64, prefix if present
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Resize with sharp first
    const processedBuffer = await sharp(buffer)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85 })
        .toBuffer();

    // Convert back to base64 for Cloudinary
    const processedBase64 = `data:image/jpeg;base64,${processedBuffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(processedBase64, {
        folder: folder,
        resource_type: 'image',
        transformation: [
            { quality: 'auto:good' },
            { fetch_format: 'auto' }
        ]
    });

    return result.secure_url;
}

// Helper: Upload multiple images to Cloudinary
async function uploadImagesToCloudinary(imagesArray, folder, width, height) {
    const imageUrls = [];
    
    if (!Array.isArray(imagesArray)) return imageUrls;

    for (const item of imagesArray) {
        if (isBase64Image(item)) {
            // New base64 image - upload to Cloudinary
            const url = await uploadBase64ToCloudinary(item, folder, width, height);
            imageUrls.push(url);
        } else if (typeof item === 'string' && item.startsWith('http')) {
            // Already a Cloudinary URL or external URL, keep as is
            imageUrls.push(item);
        }
    }

    return imageUrls;
}

// Helper: Delete image from Cloudinary by URL
async function deleteFromCloudinary(imageUrl) {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
    
    try {
        // Extract public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.jpg
        const urlParts = imageUrl.split('/');
        const filenameWithExt = urlParts[urlParts.length - 1];
        const folder = urlParts[urlParts.length - 2];
        const publicId = `${folder}/${filenameWithExt.split('.')[0]}`;
        
        await cloudinary.uploader.destroy(publicId);
    } catch (err) {
        console.error('Cloudinary delete error:', err);
    }
}

// ============================================
// AUTH ROUTES
// ============================================

router.post('/login', login);

// ============================================
// CATEGORIES CRUD
// ============================================

router.get('/categories', verifyToken, async (req, res) => {
    try {
        const categories = await Category.find().sort({ createdAt: -1 });
        res.json(categories);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/categories', verifyToken, async (req, res) => {
    try {
        let imageUrl = req.body.image;
        
        // Handle base64 image - upload to Cloudinary
        if (isBase64Image(imageUrl)) {
            imageUrl = await uploadBase64ToCloudinary(imageUrl, 'luxoraa/categories', 800, 600);
        }
        
        const category = new Category({
            name: req.body.name,
            image: imageUrl,
            description: req.body.description || ''
        });
        
        await category.save();
        res.status(201).json(category);
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
        
        // Handle image update
        if (isBase64Image(req.body.image)) {
            // Delete old image from Cloudinary
            const oldCategory = await Category.findById(req.params.id);
            if (oldCategory && oldCategory.image) {
                await deleteFromCloudinary(oldCategory.image);
            }
            // Upload new image
            updateData.image = await uploadBase64ToCloudinary(req.body.image, 'luxoraa/categories', 800, 600);
        } else if (req.body.image) {
            updateData.image = req.body.image;
        }
        
        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json(category);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/categories/:id', verifyToken, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        
        // Delete image from Cloudinary
        if (category && category.image) {
            await deleteFromCloudinary(category.image);
        }
        
        await Category.findByIdAndDelete(req.params.id);
        res.json({ message: 'Category deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============================================
// PRODUCTS CRUD
// ============================================

router.get('/products', verifyToken, async (req, res) => {
    try {
        const products = await Product.find()
            .sort({ createdAt: -1 })
            .populate('categoryId', 'name image description');
        res.json(products);
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
            imageUrls = await uploadImagesToCloudinary(images, 'luxoraa/products', 600, 800);
        }
        
        const product = new Product({
            title: req.body.title,
            categoryId: req.body.categoryId,
            images: imageUrls,
            description: req.body.description || '',
            link: req.body.link
        });
        
        await product.save();
        res.status(201).json(product);
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
        
        // Handle images update
        if (req.body.images) {
            const images = Array.isArray(req.body.images) ? req.body.images : JSON.parse(req.body.images);
            
            // Get old product to delete removed images
            const oldProduct = await Product.findById(req.params.id);
            if (oldProduct && oldProduct.images) {
                const newUrls = images.filter(img => img.startsWith('http'));
                const removedImages = oldProduct.images.filter(img => !newUrls.includes(img));
                for (const img of removedImages) {
                    await deleteFromCloudinary(img);
                }
            }
            
            updateData.images = await uploadImagesToCloudinary(images, 'luxoraa/products', 600, 800);
        }
        
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        
        res.json(product);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/products/:id', verifyToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        // Delete all images from Cloudinary
        if (product && product.images) {
            for (const img of product.images) {
                await deleteFromCloudinary(img);
            }
        }
        
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ============================================
// SOCIAL CRUD
// ============================================

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

// ============================================
// DASHBOARD STATS
// ============================================

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