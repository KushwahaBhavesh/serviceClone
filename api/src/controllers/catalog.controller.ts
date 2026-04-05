import { Request, Response } from 'express';
import { sendSuccess, sendCreated } from '../utils/response';
import { BadRequestError } from '../middleware/error-handler';
import * as catalogService from '../services/catalog.service';

// ─── PUBLIC ───

export async function listCategories(req: Request, res: Response) {
    const parentId = req.query.parentId as string | undefined;
    const categories = await catalogService.listCategories(parentId);
    sendSuccess(res, { categories });
}

export async function listUnits(req: Request, res: Response) {
    const units = await catalogService.listUnits();
    sendSuccess(res, { units });
}

export async function getCategoryBySlug(req: Request, res: Response) {
    const category = await catalogService.getCategoryBySlug(String(req.params.slug));
    sendSuccess(res, { category });
}

export async function listServices(req: Request, res: Response) {
    const { categoryId, search, page, limit, sortBy } = req.query;
    const result = await catalogService.listServices({
        categoryId: categoryId as string,
        search: search as string,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        sortBy: sortBy as any,
    });
    sendSuccess(res, result);
}

export async function getNearbyMerchants(req: Request, res: Response) {
    const result = await catalogService.getNearbyMerchants(req.query as any);
    sendSuccess(res, { merchants: result });
}

export async function getNearbyPromotions(req: Request, res: Response) {
    const { latitude, longitude, limit } = req.query;
    console.log('[CatalogController] getNearbyPromotions:', { latitude, longitude, limit });
    
    if (!latitude || !longitude) {
        throw new BadRequestError('latitude and longitude are required');
    }
    const result = await catalogService.getNearbyPromotions({
        latitude: Number(latitude),
        longitude: Number(longitude),
        limit: limit ? Number(limit) : 5,
    });
    sendSuccess(res, { promotions: result });
}

export async function getMerchantProfile(req: Request, res: Response) {
    const profile = await catalogService.getMerchantProfileById(String(req.params.id));
    sendSuccess(res, { merchant: profile });
}

export async function getServiceBySlug(req: Request, res: Response) {
    const service = await catalogService.getServiceBySlug(String(req.params.slug));
    sendSuccess(res, { service });
}

export async function getAvailableSlots(req: Request, res: Response) {
    const { date } = req.query;
    if (!date) throw new BadRequestError('date query parameter is required');
    const result = await catalogService.getAvailableSlots(String(req.params.id), String(date));
    sendSuccess(res, result);
}

export async function getServiceReviews(req: Request, res: Response) {
    const { page, limit } = req.query;
    const result = await catalogService.getServiceReviews(String(req.params.id), {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
    });
    sendSuccess(res, result);
}

export async function validatePromoCode(req: Request, res: Response) {
    const { code, orderTotal } = req.body;
    if (!code || !orderTotal) throw new BadRequestError('code and orderTotal are required');
    const result = await catalogService.validatePromoCode(String(code), Number(orderTotal));
    sendSuccess(res, result);
}

// ─── ADMIN ───

export async function createCategory(req: Request, res: Response) {
    const category = await catalogService.createCategory(req.body);
    sendCreated(res, { category });
}

export async function updateCategory(req: Request, res: Response) {
    const category = await catalogService.updateCategory(String(req.params.id), req.body);
    sendSuccess(res, { category });
}

export async function deleteCategory(req: Request, res: Response) {
    await catalogService.deleteCategory(String(req.params.id));
    sendSuccess(res, null, 'Category deactivated');
}

export async function createService(req: Request, res: Response) {
    const service = await catalogService.createService(req.body);
    sendCreated(res, { service });
}

export async function updateService(req: Request, res: Response) {
    const service = await catalogService.updateService(String(req.params.id), req.body);
    sendSuccess(res, { service });
}

export async function deleteService(req: Request, res: Response) {
    await catalogService.deleteService(String(req.params.id));
    sendSuccess(res, null, 'Service deactivated');
}
