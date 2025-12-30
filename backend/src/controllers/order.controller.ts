import { Request, Response } from 'express';
import prisma from '../db.js';

export const createOrder = async (req: Request, res: Response) => {
    try {
        const { userId, shippingAddress } = req.body;

        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                cartItems: {
                    include: {
                        variant: {
                            include: { product: true },
                        },
                    },
                },
            },
        });

        if (!cart || cart.cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const cartItems = cart.cartItems;

        // Check stock availability
        for (const item of cartItems) {
            if (item.variant.stockQuantity < item.qty) {
                return res.status(400).json({
                    error: `Insufficient stock for ${item.variant.product.name} - ${item.variant.name}`
                });
            }
        }

        const totalAmount = cartItems.reduce(
            (sum, item) => sum + Number(item.variant.price) * item.qty,
            0
        );

        const order = await prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    totalAmount,
                    subtotal: totalAmount,
                    shippingFee: 0,
                    paymentMethod: 'COD',
                    status: 'PENDING',
                    shippingAddress: shippingAddress,
                    items: {
                        create: cartItems.map(item => ({
                            variantId: item.variantId,
                            variantNameSnapshot: item.variant.name,
                            unitPrice: item.variant.price,
                            lineTotal: Number(item.variant.price) * item.qty,
                            quantity: item.qty,
                        })),
                    },
                },
                include: {
                    items: {
                        include: {
                            variant: {
                                include: { product: true }
                            }
                        }
                    },
                    user: {
                        select: { fullName: true },
                    },
                },
            });

            await tx.cartItem.deleteMany({
                where: { cartId: cart.id },
            });
            await tx.cart.update({
                where: { id: cart.id },
                data: { totalItems: 0, totalAmount: 0 }
            });

            return newOrder;
        });

        res.status(201).json({
            id: order.id,
            userId: order.userId,
            customerName: order.user.fullName,
            items: order.items.map(item => ({
                id: item.id,
                variantId: item.variantId,
                productName: item.variant.product.name,
                variantName: item.variantNameSnapshot,
                price: Number(item.unitPrice),
                quantity: item.quantity,
            })),
            totalAmount: Number(order.totalAmount),
            status: order.status,
            shippingAddress: order.shippingAddress,
            createdAt: order.createdAt.toISOString(),
            notes: [],
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllOrders = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const orders = await prisma.order.findMany({
            where: status ? { status: status as string } : undefined,
            include: {
                items: {
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                },
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
            items: order.items.map(item => ({
                id: item.id,
                variantId: item.variantId,
                productName: item.variant.product.name,
                variantName: item.variantNameSnapshot,
                price: Number(item.unitPrice),
                quantity: item.quantity,
            })),
            totalAmount: Number(order.totalAmount),
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
};

export const getOrderById = async (req: Request, res: Response) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                },
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
            items: order.items.map(item => ({
                id: item.id,
                variantId: item.variantId,
                productName: item.variant.product.name,
                variantName: item.variantNameSnapshot,
                price: Number(item.unitPrice),
                quantity: item.quantity,
            })),
            totalAmount: Number(order.totalAmount),
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
};

export const updateOrderStatus = async (req: Request, res: Response) => {
    try {
        const { status } = req.body;

        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { items: { include: { variant: true } } },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        if (status === 'CONFIRMED' && order.status === 'PENDING') {
            await prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    await tx.variant.update({
                        where: { id: item.variantId },
                        data: { stockQuantity: { decrement: item.quantity } },
                    });
                    await tx.inventoryTx.create({
                        data: {
                            variantId: item.variantId,
                            quantity: -item.quantity,
                            type: 'EXPORT',
                            reason: `Order confirmed: ${order.id}`,
                            createdBy: order.userId,
                        },
                    });
                }
                await tx.order.update({
                    where: { id: req.params.id },
                    data: { status, confirmedBy: order.userId, confirmedAt: new Date() },
                });
            });
        } else if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
            if (order.status === 'CONFIRMED') {
                await prisma.$transaction(async (tx) => {
                    for (const item of order.items) {
                        await tx.variant.update({
                            where: { id: item.variantId },
                            data: { stockQuantity: { increment: item.quantity } },
                        });
                        await tx.inventoryTx.create({
                            data: {
                                variantId: item.variantId,
                                quantity: item.quantity,
                                type: 'IMPORT',
                                reason: `Order cancelled: ${order.id}`,
                                createdBy: order.userId,
                            },
                        });
                    }
                    await tx.order.update({
                        where: { id: req.params.id },
                        data: { status, cancelledBy: order.userId, cancelledAt: new Date() },
                    });
                });
            } else {
                await prisma.order.update({
                    where: { id: req.params.id },
                    data: { status, cancelledBy: order.userId, cancelledAt: new Date() },
                });
            }
        } else {
            const updateData: any = { status };
            if (status === 'COMPLETED') {
                updateData.completedBy = order.userId;
                updateData.completedAt = new Date();
            }
            await prisma.order.update({
                where: { id: req.params.id },
                data: updateData,
            });
        }

        const updatedOrder = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: {
                    include: {
                        variant: {
                            include: { product: true }
                        }
                    }
                },
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
            items: updatedOrder!.items.map(item => ({
                id: item.id,
                variantId: item.variantId,
                productName: item.variant.product.name,
                variantName: item.variantNameSnapshot,
                price: Number(item.unitPrice),
                quantity: item.quantity,
            })),
            totalAmount: Number(updatedOrder!.totalAmount),
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
};
