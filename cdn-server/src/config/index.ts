import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const CONFIG = {
    PORT: process.env.PORT || 4001,
    CDN_AUTH_KEY: process.env.CDN_AUTH_KEY || 'cdn_master_secret_key_2026',
    UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
    BASE_URL: process.env.BASE_URL || 'http://localhost:4001',
    RELATIVE_UPLOAD_PATH: '/uploads'
};

export const UPLOAD_PATH = path.join(process.cwd(), CONFIG.UPLOAD_DIR);
