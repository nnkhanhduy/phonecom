import { Router } from 'express';
import * as orderController from '../controllers/order.controller.js';

const router = Router();

// Create order from cart
router.post('/', orderController.createOrder);

// Get all orders (staff/admin)
router.get('/', orderController.getAllOrders);

// Get order by ID
router.get('/:id', orderController.getOrderById);

// Update order status (staff/admin)
router.put('/:id/status', orderController.updateOrderStatus);

export default router;
