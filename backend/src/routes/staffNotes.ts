import { Router } from 'express';
import * as staffNoteController from '../controllers/staffNote.controller.js';

const router = Router();

// Add staff note to order
router.post('/', staffNoteController.addStaffNote);

// Get all notes for an order
router.get('/order/:orderId', staffNoteController.getOrderNotes);

// Update staff note
router.put('/:id', staffNoteController.updateStaffNote);

// Delete staff note
router.delete('/:id', staffNoteController.deleteStaffNote);

export default router;
