import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Get variant by ID
router.get('/:id', async (req, res) => {
    try {
        const variant = await prisma.variant.findUnique({
            where: { id: req.params.id },
            include: { product: true },
        });
        if (!variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }
        res.json(variant);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update variant
router.put('/:id', async (req, res) => {
    try {
        const { name, color, capacity, price, stockQuantity, imageUrl } = req.body;
        const variant = await prisma.variant.update({
            where: { id: req.params.id },
            data: { name, color, capacity, price, stockQuantity, imageUrl, status: req.body.status },
            include: { product: true },
        });
        res.json(variant);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete variant
router.delete('/:id', async (req, res) => {
    try {
        await prisma.variant.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get variant inventory history
router.get('/:variantId/inventory', async (req, res) => {
    try {
        const transactions = await prisma.inventoryTx.findMany({
            where: { variantId: req.params.variantId },
            orderBy: { createdAt: 'desc' }, // date -> createdAt
        });
        res.json(transactions);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
