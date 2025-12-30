import { Router } from 'express';
import * as chatController from '../controllers/chat.controller.js';

const router = Router();

router.post('/', chatController.handleChat);

export default router;
