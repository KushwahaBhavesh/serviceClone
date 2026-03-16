import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
    createCategorySchema,
    updateCategorySchema,
    createServiceSchema,
    updateServiceSchema,
} from '../validators/marketplace.validators';
import * as catalogService from '../services/catalog.service';

const router = Router();

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
    (req: Request, res: Response, next: NextFunction) => fn(req, res, next).catch(next);

// ─── PUBLIC ROUTES ───

// GET /api/v1/catalog/categories
router.get(
    '/categories',
    asyncHandler(async (req: Request, res: Response) => {
        const parentId = req.query.parentId as string | undefined;
        const categories = await catalogService.listCategories(parentId);
        res.json({ categories });
    }),
);

// GET /api/v1/catalog/categories/:slug
router.get(
    '/categories/:slug',
    asyncHandler(async (req: Request, res: Response) => {
        const category = await catalogService.getCategoryBySlug(String(req.params.slug));
        res.json({ category });
    }),
);

// GET /api/v1/catalog/services
router.get(
    '/services',
    asyncHandler(async (req: Request, res: Response) => {
        const { categoryId, search, page, limit, sortBy } = req.query;
        const result = await catalogService.listServices({
            categoryId: categoryId as string,
            search: search as string,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
            sortBy: sortBy as any,
        });
        res.json(result);
    }),
);

// GET /api/v1/catalog/services/:slug
router.get(
    '/services/:slug',
    asyncHandler(async (req: Request, res: Response) => {
        const service = await catalogService.getServiceBySlug(String(req.params.slug));
        res.json({ service });
    }),
);

// GET /api/v1/catalog/services/:id/slots?date=YYYY-MM-DD
router.get(
    '/services/:id/slots',
    asyncHandler(async (req: Request, res: Response) => {
        const { date } = req.query;
        if (!date) {
            res.status(400).json({ message: 'date query parameter is required' });
            return;
        }
        const result = await catalogService.getAvailableSlots(String(req.params.id), String(date));
        res.json(result);
    }),
);

// GET /api/v1/catalog/services/:id/reviews
router.get(
    '/services/:id/reviews',
    asyncHandler(async (req: Request, res: Response) => {
        const { page, limit } = req.query;
        const result = await catalogService.getServiceReviews(
            String(req.params.id),
            { page: page ? Number(page) : undefined, limit: limit ? Number(limit) : undefined },
        );
        res.json(result);
    }),
);

// POST /api/v1/catalog/promotions/validate
router.post(
    '/promotions/validate',
    asyncHandler(async (req: Request, res: Response) => {
        const { code, orderTotal } = req.body;
        if (!code || !orderTotal) {
            res.status(400).json({ message: 'code and orderTotal are required' });
            return;
        }
        const result = await catalogService.validatePromoCode(String(code), Number(orderTotal));
        res.json(result);
    }),
);

// ─── ADMIN ROUTES (Role-protected in future) ───

// POST /api/v1/catalog/categories
router.post(
    '/categories',
    authenticate,
    validate(createCategorySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const category = await catalogService.createCategory(req.body);
        res.status(201).json({ category });
    }),
);

// PUT /api/v1/catalog/categories/:id
router.put(
    '/categories/:id',
    authenticate,
    validate(updateCategorySchema),
    asyncHandler(async (req: Request, res: Response) => {
        const category = await catalogService.updateCategory(String(req.params.id), req.body);
        res.json({ category });
    }),
);

// DELETE /api/v1/catalog/categories/:id (soft delete)
router.delete(
    '/categories/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        await catalogService.deleteCategory(String(req.params.id));
        res.json({ message: 'Category deactivated' });
    }),
);

// POST /api/v1/catalog/services
router.post(
    '/services',
    authenticate,
    validate(createServiceSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const service = await catalogService.createService(req.body);
        res.status(201).json({ service });
    }),
);

// PUT /api/v1/catalog/services/:id
router.put(
    '/services/:id',
    authenticate,
    validate(updateServiceSchema),
    asyncHandler(async (req: Request, res: Response) => {
        const service = await catalogService.updateService(String(req.params.id), req.body);
        res.json({ service });
    }),
);

// DELETE /api/v1/catalog/services/:id (soft delete)
router.delete(
    '/services/:id',
    authenticate,
    asyncHandler(async (req: Request, res: Response) => {
        await catalogService.deleteService(String(req.params.id));
        res.json({ message: 'Service deactivated' });
    }),
);

export default router;
