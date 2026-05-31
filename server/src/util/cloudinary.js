import crypto from 'crypto';

/**
 * Uploads a base64 image string to Cloudinary if credentials are configured in .env.
 * If credentials are missing, returns the base64 string as a fallback.
 * 
 * @param {string} base64Image - The base64 data URL string (e.g. data:image/png;base64,...)
 * @returns {Promise<string>} The uploaded image secure URL or fallback base64 string.
 */
export async function uploadToCloudinary(base64Image) {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
        console.warn('Cloudinary credentials missing in .env. Storing image as base64 fallback.');
        return base64Image;
    }

    if (!base64Image || !base64Image.startsWith('data:image/')) {
        return base64Image;
    }

    try {
        const timestamp = Math.round(new Date().getTime() / 1000);
        // Cloudinary signed upload parameters must be sorted alphabetically
        // We are signing 'timestamp' only. Format: parameter1=value1&parameter2=value2API_SECRET
        const signatureString = `timestamp=${timestamp}${apiSecret}`;
        const signature = crypto
            .createHash('sha1')
            .update(signatureString)
            .digest('hex');

        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                file: base64Image,
                api_key: apiKey,
                timestamp: timestamp,
                signature: signature,
            }),
        });

        const data = await response.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            console.error('Cloudinary upload response error:', data);
            return base64Image;
        }
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return base64Image;
    }
}
