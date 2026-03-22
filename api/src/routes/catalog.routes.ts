import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate, validateQuery } from '../middleware/validate';
import {
    createCategorySchema,
    updateCategorySchema,
    createServiceSchema,
    updateServiceSchema,
    getNearbyMerchantsSchema,
} from '../validators/marketplace.validators';
import { asyncHandler } from '../utils/async-handler';
import * as catalogController from '../controllers/catalog.controller';

const router = Router();

// ─── PUBLIC ROUTES ───
router.get('/nearby-promos', validateQuery(getNearbyMerchantsSchema), asyncHandler(catalogController.getNearbyPromotions));
router.get('/categories', asyncHandler(catalogController.listCategories));
router.get('/categories/:slug', asyncHandler(catalogController.getCategoryBySlug));
router.get('/services', asyncHandler(catalogController.listServices));
router.get('/merchants/nearby', validateQuery(getNearbyMerchantsSchema), asyncHandler(catalogController.getNearbyMerchants));
router.get('/merchants/:id', asyncHandler(catalogController.getMerchantProfile));
router.get('/services/:slug', asyncHandler(catalogController.getServiceBySlug));
router.get('/services/:id/slots', asyncHandler(catalogController.getAvailableSlots));
router.get('/services/:id/reviews', asyncHandler(catalogController.getServiceReviews));
router.post('/promotions/validate', asyncHandler(catalogController.validatePromoCode));


// ─── ADMIN ROUTES ───
router.post('/categories', authenticate, validate(createCategorySchema), asyncHandler(catalogController.createCategory));
router.put('/categories/:id', authenticate, validate(updateCategorySchema), asyncHandler(catalogController.updateCategory));
router.delete('/categories/:id', authenticate, asyncHandler(catalogController.deleteCategory));
router.post('/services', authenticate, validate(createServiceSchema), asyncHandler(catalogController.createService));
router.put('/services/:id', authenticate, validate(updateServiceSchema), asyncHandler(catalogController.updateService));
router.delete('/services/:id', authenticate, asyncHandler(catalogController.deleteService));

export default router;
