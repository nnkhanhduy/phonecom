import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Record inventory transaction (manual restock)
router.post('/transactions', async (req, res) => {
    try {
        const { variantId, qtyChange, reason, type, createdBy } = req.body; // type and createdBy required

        // Update variant stock and create transaction
        const result = await prisma.$transaction(async (tx) => {
            // Update stock
            const variant = await tx.variant.update({
                where: { id: variantId },
                data: {
                    stockQuantity: { increment: qtyChange },
                },
            });

            // Record transaction
            const transaction = await tx.inventoryTx.create({
                data: {
                    variantId,
                    quantity: qtyChange, // Schema field is quantity
                    type: type || 'ADJUSTMENT', // Default if missing
                    reason,
                    createdBy: createdBy || 'admin', // Placeholder or fail if strict
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
});

// Get all inventory transactions
router.get('/transactions', async (req, res) => {
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
                    include: {
                        product: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to recent 100 transactions
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
});

// Get inventory summary
router.get('/summary', async (req, res) => {
    try {
        const variants = await prisma.variant.findMany({
            include: {
                product: true,
            },
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
});

export default router;
