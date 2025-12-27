import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Add item to cart
router.post('/', async (req, res) => {
    try {
        const { userId, variantId, quantity } = req.body;

        // Find or create cart for user
        let cart = await prisma.cart.findUnique({
            where: { userId },
            include: { cartItems: true }
        });

        if (!cart) {
            cart = await prisma.cart.create({
                data: { userId },
                include: { cartItems: true }
            });
        }

        // Check if item already in cart
        const existing = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                variantId: variantId,
            },
        });

        let cartItem;

        if (existing) {
            // Update quantity
            cartItem = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { qty: existing.qty + quantity }, // field is qty
                include: {
                    variant: {
                        include: { product: true },
                    },
                },
            });
        } else {
            // Create new cart item
            // Need price for lineAmount (optional, or calculated)
            const variant = await prisma.variant.findUnique({ where: { id: variantId } });
            if (!variant) return res.status(404).json({ error: 'Variant not found' });

            cartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    variantId,
                    qty: quantity,
                    unitPrice: variant.price,
                    lineAmount: Number(variant.price) * quantity,
                },
                include: {
                    variant: {
                        include: { product: true },
                    },
                },
            });
        }

        // Update cart totals (simple recalc)
        // In a real app we might optimize this
        const allItems = await prisma.cartItem.findMany({ where: { cartId: cart.id } });
        const totalItems = allItems.reduce((acc, item) => acc + item.qty, 0);
        const totalAmount = allItems.reduce((acc, item) => acc + Number(item.lineAmount), 0);

        await prisma.cart.update({
            where: { id: cart.id },
            data: { totalItems, totalAmount },
        });

        res.status(201).json({
            id: cartItem.id,
            variantId: cartItem.variantId,
            productName: cartItem.variant.product.name,
            variantName: cartItem.variant.name,
            price: cartItem.variant.price,
            quantity: cartItem.qty,
            imageUrl: cartItem.variant.imageUrl,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update cart item quantity
router.put('/:id', async (req, res) => {
    try {
        const { quantity } = req.body; // new quantity

        if (quantity <= 0) {
            // Remove item
            await prisma.cartItem.delete({
                where: { id: req.params.id },
            });
            // Should update cart totals here too
            return res.status(204).send();
        }

        const cartItem = await prisma.cartItem.findUnique({ where: { id: req.params.id }, include: { variant: true } });
        if (!cartItem) return res.status(404).send();

        // Update
        const updated = await prisma.cartItem.update({
            where: { id: req.params.id },
            data: {
                qty: quantity,
                lineAmount: Number(cartItem.variant.price) * quantity
            },
            include: {
                variant: {
                    include: { product: true },
                },
            },
        });

        // Update cart totals logic omitted for brevity but should be here
        // Re-calcing parent cart
        const allItems = await prisma.cartItem.findMany({ where: { cartId: updated.cartId } });
        const totalItems = allItems.reduce((acc, item) => acc + item.qty, 0);
        const totalAmount = allItems.reduce((acc, item) => acc + Number(item.lineAmount), 0);
        await prisma.cart.update({
            where: { id: updated.cartId },
            data: { totalItems, totalAmount }
        });

        res.json({
            id: updated.id,
            variantId: updated.variantId,
            productName: updated.variant.product.name,
            variantName: updated.variant.name,
            price: updated.variant.price,
            quantity: updated.qty,
            imageUrl: updated.variant.imageUrl,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Remove cart item
router.delete('/:id', async (req, res) => {
    try {
        const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
        if (item) {
            await prisma.cartItem.delete({
                where: { id: req.params.id },
            });
            // Update totals
            const allItems = await prisma.cartItem.findMany({ where: { cartId: item.cartId } });
            const totalItems = allItems.reduce((acc, i) => acc + i.qty, 0);
            const totalAmount = allItems.reduce((acc, i) => acc + Number(i.lineAmount), 0);
            await prisma.cart.update({
                where: { id: item.cartId },
                data: { totalItems, totalAmount }
            });
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Clear user's cart
router.delete('/user/:userId', async (req, res) => {
    try {
        const cart = await prisma.cart.findUnique({ where: { userId: req.params.userId } });
        if (cart) {
            await prisma.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
            await prisma.cart.update({
                where: { id: cart.id },
                data: { totalItems: 0, totalAmount: 0 }
            });
        }
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
