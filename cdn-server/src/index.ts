import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs-extra';
import { CONFIG, UPLOAD_PATH } from './config';
import uploadRoutes from './routes/upload.routes';

const app = express();

// Ensure upload directory exists on startup
fs.ensureDirSync(UPLOAD_PATH);

// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serving static files (CDN)
app.use('/uploads', express.static(UPLOAD_PATH, {
    maxAge: '1y', // Cache for 1 year
    etag: true
}));

// Routes
app.use('/v1/cdn', uploadRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', service: 'CDN-SERVER' });
});

// Start Server
app.listen(CONFIG.PORT, () => {
    console.log(`🚀 CDN Server running at ${CONFIG.BASE_URL}`);
    console.log(`📁 Serving static files from: ${UPLOAD_PATH}`);
});
