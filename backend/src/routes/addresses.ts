import { Router } from 'express';
import * as addressController from '../controllers/address.controller.js';

const router = Router();

// Create address for user
router.post('/', addressController.createAddress);

// Get address by ID
router.get('/:id', addressController.getAddressById);

// Update address
router.put('/:id', addressController.updateAddress);

// Delete address
router.delete('/:id', addressController.deleteAddress);

// Set address as default
router.put('/:id/default', addressController.setAddressDefault);

export default router;
