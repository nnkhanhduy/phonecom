import { Request, Response } from 'express';
import prisma from '../db.js';

export const recordTransaction = async (req: Request, res: Response) => {
    try {
        const { variantId, qtyChange, reason, type, createdBy } = req.body;

        const result = await prisma.$transaction(async (tx) => {
            const variant = await tx.variant.update({
                where: { id: variantId },
                data: { stockQuantity: { increment: qtyChange } },
            });

            const transaction = await tx.inventoryTx.create({
                data: {
                    variantId,
                    quantity: qtyChange,
                    type: type || 'ADJUSTMENT',
                    reason,
                    createdBy: createdBy || 'admin',
                    createdAt: new Date(),
                },
            });

            return { variant, transaction };
        });

        res.status(201).json({
            id: result.transaction.id,
            variantId: result.transaction.variantId,
            qtyChange: result.transaction.quantity,
            reason: result.transaction.reason,
            date: result.transaction.createdAt.toISOString(),
            newStockQuantity: result.variant.stockQuantity,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const { variantId, startDate, endDate } = req.query;

        const transactions = await prisma.inventoryTx.findMany({
            where: {
                variantId: variantId ? String(variantId) : undefined,
                createdAt: {
                    gte: startDate ? new Date(String(startDate)) : undefined,
                    lte: endDate ? new Date(String(endDate)) : undefined,
                },
            },
            include: {
                variant: {
                    include: { product: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const formattedTransactions = transactions.map(tx => ({
            id: tx.id,
            variantId: tx.variantId,
            productName: tx.variant.product.name,
            variantName: tx.variant.name,
            qtyChange: tx.quantity,
            reason: tx.reason,
            date: tx.createdAt.toISOString(),
            currentStock: tx.variant.stockQuantity,
        }));

        res.json(formattedTransactions);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getInventorySummary = async (req: Request, res: Response) => {
    try {
        const variants = await prisma.variant.findMany({
            include: { product: true },
            orderBy: { stockQuantity: 'asc' },
        });

        const summary = variants.map(variant => ({
            variantId: variant.id,
            productName: variant.product.name,
            variantName: variant.name,
            stockQuantity: variant.stockQuantity,
            price: variant.price,
            lowStock: variant.stockQuantity < 10,
        }));

        res.json(summary);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
