import { Request, Response } from 'express';
import prisma from '../db.js';

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { name, brand, description, imageUrl, variants } = req.body;
        const product = await prisma.product.create({
            data: {
                name,
                brand,
                description,
                imageUrl,
                status: 'ACTIVE', // Default
                variants: variants ? {
                    create: variants,
                } : undefined,
            },
            include: { variants: true },
        });
        res.status(201).json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAllProducts = async (req: Request, res: Response) => {
    try {
        const products = await prisma.product.findMany({
            include: { variants: true },
            orderBy: { createdAt: 'desc' },
        });
        res.json(products);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getProductById = async (req: Request, res: Response) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: req.params.id },
            include: { variants: true },
        });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { name, brand, description, imageUrl, status } = req.body;
        const product = await prisma.product.update({
            where: { id: req.params.id },
            data: { name, brand, description, imageUrl, status },
            include: { variants: true },
        });
        res.json(product);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        await prisma.product.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const addVariant = async (req: Request, res: Response) => {
    try {
        const { name, color, capacity, price, stockQuantity, imageUrl } = req.body;
        const variant = await prisma.variant.create({
            data: {
                productId: req.params.productId,
                name,
                color,
                capacity,
                price,
                stockQuantity: stockQuantity || 0,
                status: 'IN_STOCK',
                imageUrl,
            },
        });
        res.status(201).json(variant);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
