import { Router } from 'express';
import * as variantController from '../controllers/variant.controller.js';

const router = Router();

// Get variant by ID
router.get('/:id', variantController.getVariantById);

// Update variant
router.put('/:id', variantController.updateVariant);

// Delete variant
router.delete('/:id', variantController.deleteVariant);

// Get variant inventory history
router.get('/:variantId/inventory', variantController.getVariantInventory);

export default router;
