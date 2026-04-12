import axios from 'axios';
import ENV from '../constants/config';

/**
 * CDN Service
 * Handles file uploads to the standalone CDN server
 */
export const cdnService = {
    /**
     * Upload a single file
     */
    uploadSingle: async (file: { uri: string; name: string; type: string }) => {
        const formData = new FormData();
        
        // React Native FormData requires this structure
        formData.append('file', {
            uri: file.uri,
            name: file.name,
            type: file.type,
        } as any);

        try {
            const response = await axios.post(`${ENV.CDN_URL}/v1/cdn/single`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CDN-AUTH-KEY': ENV.CDN_AUTH_KEY,
                },
            });

            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Upload failed');
        } catch (error: any) {
            console.error('CDN Upload Error:', error?.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Upload multiple files
     */
    uploadMultiple: async (files: { uri: string; name: string; type: string }[]) => {
        const formData = new FormData();
        
        files.forEach((file) => {
            formData.append('files', {
                uri: file.uri,
                name: file.name,
                type: file.type,
            } as any);
        });

        try {
            const response = await axios.post(`${ENV.CDN_URL}/v1/cdn/multiple`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'X-CDN-AUTH-KEY': ENV.CDN_AUTH_KEY,
                },
            });

            if (response.data.success) {
                return response.data.data;
            }
            throw new Error(response.data.message || 'Multiple upload failed');
        } catch (error: any) {
            console.error('CDN Multiple Upload Error:', error?.response?.data || error.message);
            throw error;
        }
    }
};
