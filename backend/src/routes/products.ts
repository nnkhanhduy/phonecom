import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';

const router = Router();

// Create product with variants
router.post('/', productController.createProduct);

// Get all products
router.get('/', productController.getAllProducts);

// Get product by ID
router.get('/:id', productController.getProductById);

// Update product
router.put('/:id', productController.updateProduct);

// Delete product
router.delete('/:id', productController.deleteProduct);

// Add variant to product
router.post('/:productId/variants', productController.addVariant);

export default router;
