import { Request, Response } from 'express';
import { getChatResponse } from '../services/ai.js';

export const handleChat = async (req: Request, res: Response) => {
    const { message, history } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    try {
        const response = await getChatResponse(message, history || []);
        res.json({ response });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
