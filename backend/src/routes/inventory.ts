import { Router } from 'express';
import * as inventoryController from '../controllers/inventory.controller.js';

const router = Router();

// Record inventory transaction (manual restock)
router.post('/transactions', inventoryController.recordTransaction);

// Get all inventory transactions
router.get('/transactions', inventoryController.getTransactions);

// Get inventory summary
router.get('/summary', inventoryController.getInventorySummary);

export default router;
