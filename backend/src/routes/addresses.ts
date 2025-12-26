import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Create address for user
router.post('/', async (req, res) => {
    try {
        const { userId, recipientName, phone, addressLine, city, isDefault } = req.body;

        // If setting as default, unset other defaults for this user
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
                phone,
                addressLine,
                city,
                isDefault: isDefault || false,
            },
        });
        res.status(201).json(address);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get address by ID
router.get('/:id', async (req, res) => {
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
});

// Update address
router.put('/:id', async (req, res) => {
    try {
        const { recipientName, phone, addressLine, city, isDefault } = req.body;

        const address = await prisma.address.findUnique({
            where: { id: req.params.id },
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // If setting as default, unset other defaults
        if (isDefault) {
            await prisma.address.updateMany({
                where: { userId: address.userId, id: { not: req.params.id } },
                data: { isDefault: false },
            });
        }

        const updatedAddress = await prisma.address.update({
            where: { id: req.params.id },
            data: { recipientName, phone, addressLine, city, isDefault },
        });
        res.json(updatedAddress);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete address
router.delete('/:id', async (req, res) => {
    try {
        await prisma.address.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Set address as default
router.put('/:id/default', async (req, res) => {
    try {
        const address = await prisma.address.findUnique({
            where: { id: req.params.id },
        });

        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Unset all defaults for this user
        await prisma.address.updateMany({
            where: { userId: address.userId },
            data: { isDefault: false },
        });

        // Set this one as default
        const updatedAddress = await prisma.address.update({
            where: { id: req.params.id },
            data: { isDefault: true },
        });

        res.json(updatedAddress);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
