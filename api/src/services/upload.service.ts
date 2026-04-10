import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';

// ─── Config ───

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'local';

// Allowed upload folders
const ALLOWED_FOLDERS = ['profiles', 'services', 'kyc-docs', 'review-photos', 'chat-media', 'verification-docs'] as const;
export type UploadFolder = (typeof ALLOWED_FOLDERS)[number];

// Private folders that use signed URLs
const PRIVATE_FOLDERS: string[] = ['kyc-docs', 'verification-docs'];

export function isAllowedFolder(folder: string): folder is UploadFolder {
    return ALLOWED_FOLDERS.includes(folder as UploadFolder);
}

// ─── S3 Client (Singleton) ───

let s3Client: S3Client | null = null;
let bucketName: string = '';

function getS3Client(): S3Client {
    if (s3Client) return s3Client;

    if (STORAGE_PROVIDER === 'r2') {
        const accountId = process.env.R2_ACCOUNT_ID!;
        s3Client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY!,
                secretAccessKey: process.env.R2_SECRET_KEY!,
            },
        });
        bucketName = process.env.R2_BUCKET_NAME || 'serviceclone';
    } else {
        s3Client = new S3Client({
            region: process.env.AWS_REGION || 'ap-south-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
            },
        });
        bucketName = process.env.AWS_BUCKET_NAME || 'serviceclone';
    }

    logger.info(`Upload service initialized with ${STORAGE_PROVIDER} provider, bucket: ${bucketName}`);
    return s3Client;
}

// ─── Local Upload (Dev Fallback) ───

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

function ensureLocalDir(folder: string): string {
    const dir = path.join(LOCAL_UPLOAD_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return dir;
}

function getBaseUrl(): string {
    return process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
}

// ─── Service Methods ───

interface UploadResult {
    url: string;
    key: string;
}

/**
 * Upload a file to the configured storage provider.
 */
export async function uploadFile(
    file: Express.Multer.File,
    folder: UploadFolder,
): Promise<UploadResult> {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ext) throw new Error('File has no extension');

    const key = `${folder}/${Date.now()}-${uuidv4()}${ext}`;
    const isPrivate = PRIVATE_FOLDERS.includes(folder);

    // ─── Local Fallback ───
    if (STORAGE_PROVIDER === 'local') {
        const dir = ensureLocalDir(folder);
        const filename = path.basename(key);
        fs.writeFileSync(path.join(dir, filename), file.buffer);
        return { url: `${getBaseUrl()}/uploads/${folder}/${filename}`, key };
    }

    // ─── S3 / R2 Upload ───
    const client = getS3Client();
    await client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ...(isPrivate ? {} : { ACL: 'public-read' }),
    }));

    if (isPrivate) {
        const signedUrl = await getPresignedUrl(key, 3600);
        return { url: signedUrl, key };
    }

    // Public URL
    let publicUrl: string;
    const cdnUrl = process.env.CDN_URL;

    if (cdnUrl) {
        // Ensure cdnUrl doesn't have a trailing slash, or handle it
        const base = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
        publicUrl = `${base}/${key}`;
    } else if (STORAGE_PROVIDER === 'r2') {
        const customDomain = process.env.R2_PUBLIC_DOMAIN;
        publicUrl = customDomain
            ? `https://${customDomain}/${key}`
            : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${bucketName}/${key}`;
    } else if (STORAGE_PROVIDER === 's3') {
        publicUrl = `https://${bucketName}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;
    } else {
        // Fallback for local
        publicUrl = `${getBaseUrl()}/uploads/${folder}/${path.basename(key)}`;
    }

    return { url: publicUrl, key };
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(key: string): Promise<void> {
    if (STORAGE_PROVIDER === 'local') {
        const filePath = path.join(LOCAL_UPLOAD_DIR, key);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return;
    }

    const client = getS3Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
}

/**
 * Generate a pre-signed GET URL for a private file.
 */
export async function getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (STORAGE_PROVIDER === 'local') {
        return `${getBaseUrl()}/uploads/${key}`;
    }

    const client = getS3Client();
    return getSignedUrl(client, new GetObjectCommand({ Bucket: bucketName, Key: key }), { expiresIn });
}
