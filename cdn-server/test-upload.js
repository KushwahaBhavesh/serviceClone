const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const CDN_URL = 'http://localhost:4001/v1/cdn';
const AUTH_KEY = 'cdn_master_secret_key_2026';

async function testUpload() {
    console.log('--- Starting CDN Server Test ---');

    try {
        // 1. Check Health
        const health = await axios.get('http://localhost:4001/health');
        console.log('✅ Health Check:', health.data);

        // 2. Prepare Form Data
        const form = new FormData();
        // Create a dummy file for testing (if it doesn't exist)
        const testFilePath = path.join(__dirname, 'test-image.jpg');
        if (!fs.existsSync(testFilePath)) {
            fs.writeFileSync(testFilePath, 'fake image data');
        }
        form.append('file', fs.createReadStream(testFilePath));

        // 3. Test Unauthorized Upload
        try {
            await axios.post(`${CDN_URL}/single`, form, {
                headers: form.getHeaders(),
            });
        } catch (err) {
            console.log('✅ Unauthorized Check: Received expected error');
        }

        // 4. Test Authorized Upload
        console.log('🚀 Sending authorized upload request...');
        const response = await axios.post(`${CDN_URL}/single`, form, {
            headers: {
                ...form.getHeaders(),
                'x-cdn-auth-key': AUTH_KEY
            },
        });

        console.log('✅ Upload Success:', response.data);
        console.log('🔗 File URL:', response.data.data.url);

        // 5. Verify Static Serving
        const staticFileUrl = `http://localhost:4001${response.data.data.url}`;
        const staticCheck = await axios.get(staticFileUrl);
        console.log('✅ Static Serving Check: File accessible');

    } catch (err) {
        console.error('❌ Test Failed:', err.response?.data || err.message);
    }
}

// Note: To run this test, the server must be running.
// If you want me to run it, I'll need to start the server in the background.
// testUpload();
