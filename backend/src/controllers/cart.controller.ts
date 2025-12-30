import { Request, Response } from 'express';
import prisma from '../db.js';

export const addToCart = async (req: Request, res: Response) => {
    try {
        const { userId, variantId, quantity } = req.body;

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

        const existing = await prisma.cartItem.findFirst({
            where: {
                cartId: cart.id,
                variantId: variantId,
            },
        });

        let cartItem;

        if (existing) {
            cartItem = await prisma.cartItem.update({
                where: { id: existing.id },
                data: { qty: existing.qty + quantity },
                include: {
                    variant: {
                        include: { product: true },
                    },
                },
            });
        } else {
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
};

export const updateCartItem = async (req: Request, res: Response) => {
    try {
        const { quantity } = req.body;

        if (quantity <= 0) {
            await prisma.cartItem.delete({
                where: { id: req.params.id },
            });
            return res.status(204).send();
        }

        const cartItem = await prisma.cartItem.findUnique({ where: { id: req.params.id }, include: { variant: true } });
        if (!cartItem) return res.status(404).send();

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
};

export const removeCartItem = async (req: Request, res: Response) => {
    try {
        const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
        if (item) {
            await prisma.cartItem.delete({
                where: { id: req.params.id },
            });
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
};

export const clearCart = async (req: Request, res: Response) => {
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
};
