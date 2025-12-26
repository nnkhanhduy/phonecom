import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Add item to cart
router.post('/', async (req, res) => {
    try {
        const { userId, variantId, quantity } = req.body;

        // Check if item already in cart
        const existing = await prisma.cartItem.findUnique({
            where: {
                userId_variantId: { userId, variantId },
            },
        });

        if (existing) {
            // Update quantity
            const updated = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { quantity: existing.quantity + quantity },
                include: {
                    variant: {
                        include: { product: true },
                    },
                },
            });

            return res.json({
                id: updated.id,
                variantId: updated.variantId,
                productName: updated.variant.product.name,
                variantName: updated.variant.name,
                price: updated.variant.price,
                quantity: updated.quantity,
                imageUrl: updated.variant.imageUrl,
            });
        }

        // Create new cart item
        const cartItem = await prisma.cartItem.create({
            data: { userId, variantId, quantity },
            include: {
                variant: {
                    include: { product: true },
                },
            },
        });

        res.status(201).json({
            id: cartItem.id,
            variantId: cartItem.variantId,
            productName: cartItem.variant.product.name,
            variantName: cartItem.variant.name,
            price: cartItem.variant.price,
            quantity: cartItem.quantity,
            imageUrl: cartItem.variant.imageUrl,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update cart item quantity
router.put('/:id', async (req, res) => {
    try {
        const { quantity } = req.body;

        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            await prisma.cartItem.delete({
                where: { id: req.params.id },
            });
            return res.status(204).send();
        }

        const cartItem = await prisma.cartItem.update({
            where: { id: req.params.id },
            data: { quantity },
            include: {
                variant: {
                    include: { product: true },
                },
            },
        });

        res.json({
            id: cartItem.id,
            variantId: cartItem.variantId,
            productName: cartItem.variant.product.name,
            variantName: cartItem.variant.name,
            price: cartItem.variant.price,
            quantity: cartItem.quantity,
            imageUrl: cartItem.variant.imageUrl,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Remove cart item
router.delete('/:id', async (req, res) => {
    try {
        await prisma.cartItem.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Clear user's cart
router.delete('/user/:userId', async (req, res) => {
    try {
        await prisma.cartItem.deleteMany({
            where: { userId: req.params.userId },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
