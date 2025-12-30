import { Request, Response } from 'express';
import prisma from '../db.js';

export const getVariantById = async (req: Request, res: Response) => {
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
};

export const updateVariant = async (req: Request, res: Response) => {
    try {
        const { name, color, capacity, price, stockQuantity, imageUrl, status } = req.body;
        const variant = await prisma.variant.update({
            where: { id: req.params.id },
            data: { name, color, capacity, price, stockQuantity, imageUrl, status },
            include: { product: true },
        });
        res.json(variant);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteVariant = async (req: Request, res: Response) => {
    try {
        await prisma.variant.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getVariantInventory = async (req: Request, res: Response) => {
    try {
        const transactions = await prisma.inventoryTx.findMany({
            where: { variantId: req.params.variantId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(transactions);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
