import { Router } from 'express';
import prisma from '../db.js';

const router = Router();

// Add staff note to order
router.post('/', async (req, res) => {
    try {
        const { orderId, authorId, content } = req.body;

        const note = await prisma.staffNote.create({
            data: {
                orderId,
                authorId,
                content,
            },
            include: {
                author: {
                    select: { fullName: true },
                },
            },
        });

        res.status(201).json({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            authorName: note.author.fullName,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Get all notes for an order
router.get('/order/:orderId', async (req, res) => {
    try {
        const notes = await prisma.staffNote.findMany({
            where: { orderId: req.params.orderId },
            include: {
                author: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        const formattedNotes = notes.map(note => ({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            authorName: note.author.fullName,
        }));

        res.json(formattedNotes);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

// Delete staff note
router.delete('/:id', async (req, res) => {
    try {
        await prisma.staffNote.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

export default router;
