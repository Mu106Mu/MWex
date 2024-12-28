class COSConfig {
    static async getUploadAuth(fileName) {
        try {
            // 从后端获取临时密钥
            const response = await fetch('https://your-api-endpoint/sts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    path: fileName
                })
            });
            
            if (!response.ok) {
                throw new Error('获取上传授权失败');
            }
            
            const auth = await response.json();
            return auth;
        } catch (error) {
            console.error('获取上传授权失败:', error);
            throw error;
        }
    }
} 