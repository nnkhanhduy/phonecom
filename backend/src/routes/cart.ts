import { Router } from 'express';
import * as cartController from '../controllers/cart.controller.js';

const router = Router();

// Add item to cart
router.post('/', cartController.addToCart);

// Update cart item quantity
router.put('/:id', cartController.updateCartItem);

// Remove cart item
router.delete('/:id', cartController.removeCartItem);

// Clear user's cart
router.delete('/user/:userId', cartController.clearCart);

export default router;
