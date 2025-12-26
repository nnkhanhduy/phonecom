import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Create product with variants
router.post('/', async (req, res) => {
    try {
        const { name, brand, description, variants } = req.body;
        const product = await prisma.product.create({
            data: {
                name,
                brand,
                description,
                variants: variants ? {
                    create: variants,
                } : undefined,
            },
            include: { variants: true },
        });
        res.status(201).json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get all products
router.get('/', async (req, res) => {
    try {
        const products = await prisma.product.findMany({
            include: { variants: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { variants: true },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update product
router.put('/:id', async (req, res) => {
    try {
        const { name, brand, description } = req.body;
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: { name, brand, description },
            include: { variants: true },
        });
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete product
router.delete('/:id', async (req, res) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Add variant to product
router.post('/:productId/variants', async (req, res) => {
    try {
        const { name, color, capacity, price, stockQuantity, imageUrl } = req.body;
        const variant = await prisma.variant.create({
            data: {
                productId: req.params.productId,
                name,
                color,
                capacity,
                price,
                stockQuantity: stockQuantity || 0,
                imageUrl,
            },
        });
        res.status(201).json(variant);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
