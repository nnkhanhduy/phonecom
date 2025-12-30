import { Router } from 'express';
import * as userController from '../controllers/user.controller.js';

const router = Router();

// Create user
router.post('/', userController.createUser);

// Get user by ID
router.get('/:id', userController.getUserById);

// Get all users
router.get('/', userController.getAllUsers);

// Update user
router.put('/:id', userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

// Get user's cart
router.get('/:userId/cart', userController.getUserCart);

// Get user's orders
router.get('/:userId/orders', userController.getUserOrders);

// Get user's addresses
router.get('/:userId/addresses', userController.getUserAddresses);

export default router;
