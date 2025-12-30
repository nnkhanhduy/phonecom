import { Request, Response } from 'express';
import prisma from '../db.js';

export const addStaffNote = async (req: Request, res: Response) => {
    try {
        const { orderId, authorId, content } = req.body;

        const note = await prisma.staffNote.create({
            data: {
                orderId,
                staffId: authorId,
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
};

export const getOrderNotes = async (req: Request, res: Response) => {
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
};

export const updateStaffNote = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const note = await prisma.staffNote.update({
            where: { id: req.params.id },
            data: { content },
            include: {
                author: {
                    select: { fullName: true },
                },
            },
        });

        res.json({
            id: note.id,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            authorName: note.author.fullName,
        });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteStaffNote = async (req: Request, res: Response) => {
    try {
        await prisma.staffNote.delete({
            where: { id: req.params.id },
        });
        res.status(204).send();
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
};
