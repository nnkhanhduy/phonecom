import { Request, Response } from 'express';
import prisma from '../db.js';

export const createUser = async (req: Request, res: Response) => {
    try {
        const { fullName, email } = req.body;

        // All new registrations default to CUSTOMER
        const roleName = 'CUSTOMER';
        const roleRecord = await prisma.role.findFirst({
            where: { name: roleName }
        });

        if (!roleRecord) {
            return res.status(400).json({ error: `Role '${roleName}' not found` });
        }

        const user = await prisma.user.create({
            data: {
                fullName,
                email,
                roleId: roleRecord.id
            },
            include: { addresses: true, role: true },
        });
        res.status(201).json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            include: { addresses: true, role: true },
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: { addresses: true, role: true },
        });
        res.json(users);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const { fullName, email, role } = req.body;

        let updateData: any = { fullName, email };

        if (role) {
            const roleRecord = await prisma.role.findFirst({
                where: { name: role }
            });
            if (!roleRecord) {
                return res.status(400).json({ error: `Role '${role}' not found` });
            }
            updateData.roleId = roleRecord.id;
        }

        const user = await prisma.user.update({
            where: { id: req.params.id },
            data: updateData,
            include: { addresses: true, role: true },
        });
        res.json(user);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        await prisma.user.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getUserCart = async (req: Request, res: Response) => {
    try {
        const cart = await prisma.cart.findUnique({
            where: { userId: req.params.userId },
            include: {
                cartItems: {
                    include: {
                        variant: {
                            include: {
                                product: true
                            }
                        }
                    }
                }
            }
        });

        if (!cart) {
            return res.json([]);
        }

        const formattedCart = cart.cartItems.map(item => ({
            id: item.id,
            variantId: item.variantId,
            productName: item.variant.product.name,
            variantName: item.variant.name,
            price: item.variant.price,
            quantity: item.qty,
            imageUrl: item.variant.imageUrl,
        }));

        res.json(formattedCart);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getUserOrders = async (req: Request, res: Response) => {
    try {
        const orders = await prisma.order.findMany({
            where: { userId: req.params.userId },
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

export const getUserAddresses = async (req: Request, res: Response) => {
    try {
        const addresses = await prisma.address.findMany({
            where: { userId: req.params.userId },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        });
        res.json(addresses);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
