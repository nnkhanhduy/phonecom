import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Create order from cart
router.post('/', async (req, res) => {
    try {
        const { userId, shippingAddress } = req.body;

        // Get cart items
        const cartItems = await prisma.cartItem.findMany({
            where: { userId },
            include: {
                variant: {
                    include: { product: true },
                },
            },
        });

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        // Check stock availability
        for (const item of cartItems) {
            if (item.variant.stockQuantity < item.quantity) {
                return res.status(400).json({
                    error: `Insufficient stock for ${item.variant.product.name} - ${item.variant.name}`
                });
            }
        }

        // Calculate total
        const totalAmount = cartItems.reduce(
            (sum, item) => sum + item.variant.price * item.quantity,
            0
        );

        // Create order with items in a transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    status: 'PENDING',
                    shippingAddress,
                    items: {
                        create: cartItems.map(item => ({
                            variantId: item.variantId,
                            productName: item.variant.product.name,
                            variantName: item.variant.name,
                            price: item.variant.price,
                            quantity: item.quantity,
                        })),
                    },
                },
                include: {
                    items: true,
                    user: {
                        select: { fullName: true },
                    },
                },
            });

            // Clear cart
            await tx.cartItem.deleteMany({
                where: { userId },
            });

            return newOrder;
        });

        res.status(201).json({
            id: order.id,
            userId: order.userId,
            customerName: order.user.fullName,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt.toISOString(),
            notes: [],
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get all orders (staff/admin)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const orders = await prisma.order.findMany({
            where: status ? { status: status as any } : undefined,
            include: {
                items: true,
                staffNotes: {
                    include: {
                        author: {
                            select: { fullName: true },
                        },
                    },
                },
                user: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedOrders = orders.map(order => ({
            id: order.id,
            userId: order.userId,
            customerName: order.user.fullName,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt.toISOString(),
            notes: order.staffNotes.map(note => ({
                id: note.id,
                content: note.content,
                createdAt: note.createdAt.toISOString(),
                authorName: note.author.fullName,
            })),
        }));

        res.json(formattedOrders);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get order by ID
router.get('/:id', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: true,
                staffNotes: {
                    include: {
                        author: {
                            select: { fullName: true },
                        },
                    },
                },
                user: {
                    select: { fullName: true },
                },
            },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({
            id: order.id,
            userId: order.userId,
            customerName: order.user.fullName,
            items: order.items,
            totalAmount: order.totalAmount,
            status: order.status,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt.toISOString(),
            notes: order.staffNotes.map(note => ({
                id: note.id,
                content: note.content,
                createdAt: note.createdAt.toISOString(),
                authorName: note.author.fullName,
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Update order status (staff/admin)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: true },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Handle stock updates based on status transitions
        if (status === 'CONFIRMED' && order.status === 'PENDING') {
            // Deduct stock and record inventory transactions
            await prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    // Deduct stock
                    await tx.variant.update({
                        where: { id: item.variantId },
                        data: {
                            stockQuantity: { decrement: item.quantity },
                        },
                    });

                    // Record inventory transaction
                    await tx.inventoryTx.create({
                        data: {
                            variantId: item.variantId,
                            qtyChange: -item.quantity,
                            reason: `Order confirmed: ${order.id}`,
                            date: new Date(),
                        },
                    });
                }

                // Update order status
                await tx.order.update({
                    where: { id: req.params.id },
                    data: { status },
                });
            });
        } else if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
            // Restore stock if order was confirmed
            if (order.status === 'CONFIRMED') {
                await prisma.$transaction(async (tx) => {
                    for (const item of order.items) {
                        // Restore stock
                        await tx.variant.update({
                            where: { id: item.variantId },
                            data: {
                                stockQuantity: { increment: item.quantity },
                            },
                        });

                        // Record inventory transaction
                        await tx.inventoryTx.create({
                            data: {
                                variantId: item.variantId,
                                qtyChange: item.quantity,
                                reason: `Order cancelled: ${order.id}`,
                                date: new Date(),
                            },
                        });
                    }

                    // Update order status
                    await tx.order.update({
                        where: { id: req.params.id },
                        data: { status },
                    });
                });
            } else {
                // Just update status if not confirmed yet
                await prisma.order.update({
                    where: { id: req.params.id },
                    data: { status },
                });
            }
        } else {
            // Simple status update (e.g., CONFIRMED -> COMPLETED)
            await prisma.order.update({
                where: { id: req.params.id },
                data: { status },
            });
        }

        const updatedOrder = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: true,
                staffNotes: {
                    include: {
                        author: {
                            select: { fullName: true },
                        },
                    },
                },
                user: {
                    select: { fullName: true },
                },
            },
        });

        res.json({
            id: updatedOrder!.id,
            userId: updatedOrder!.userId,
            customerName: updatedOrder!.user.fullName,
            items: updatedOrder!.items,
            totalAmount: updatedOrder!.totalAmount,
            status: updatedOrder!.status,
            shippingAddress: updatedOrder!.shippingAddress,
            createdAt: updatedOrder!.createdAt.toISOString(),
            notes: updatedOrder!.staffNotes.map(note => ({
                id: note.id,
                content: note.content,
                createdAt: note.createdAt.toISOString(),
                authorName: note.author.fullName,
            })),
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
