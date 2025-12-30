import { Request, Response } from 'express';
import prisma from '../db.js';

export const createAddress = async (req: Request, res: Response) => {
    try {
        const { userId, recipientName, phoneNumber, line1, ward, district, province, isDefault } = req.body;

        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId },
                data: { isDefault: false },
            });
        }

        const address = await prisma.address.create({
            data: {
                userId,
                recipientName,
                phoneNumber,
                line1,
                ward,
                district,
                province,
                isDefault: isDefault || false,
            },
        });
        res.status(201).json(address);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const getAddressById = async (req: Request, res: Response) => {
    try {
        const address = await prisma.address.findUnique({
            where: { id: req.params.id },
        });
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }
        res.json(address);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const updateAddress = async (req: Request, res: Response) => {
    try {
        const { recipientName, phoneNumber, line1, ward, district, province, isDefault } = req.body;

        const address = await prisma.address.findUnique({
            where: { id: req.params.id },
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: address.userId, id: { not: req.params.id } },
                data: { isDefault: false },
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id: req.params.id },
            data: { recipientName, phoneNumber, line1, ward, district, province, isDefault },
        });
        res.json(updatedAddress);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteAddress = async (req: Request, res: Response) => {
    try {
        await prisma.address.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const setAddressDefault = async (req: Request, res: Response) => {
    try {
        const address = await prisma.address.findUnique({
            where: { id: req.params.id },
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        await prisma.address.updateMany({
            where: { userId: address.userId },
            data: { isDefault: false },
        });

        const updatedAddress = await prisma.address.update({
            where: { id: req.params.id },
            data: { isDefault: true },
        });

        res.json(updatedAddress);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
