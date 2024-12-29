class COSConfig {
    // COS 配置信息
    static config = {
        Bucket: 'mw-experiment-1333907144',
        Region: 'ap-guangzhou',
        SecretId: 'AKIDrb8UekcK0XuNkHtSxJTSGAj8qOipyAHK',    // 替换为你的 SecretId
        SecretKey: 'y0YzEJExeCinjbKuMTTIvWJxnbDi2BHE'        // 替换为你的 SecretKey
    };

    static async getUploadAuth(fileName) {
        try {
            // 使用临时授权
            return {
                authorization: 'q-sign-algorithm=sha1&q-ak=' + this.config.SecretId + '&q-sign-time=' + 
                             Math.floor(Date.now() / 1000) + ';' + (Math.floor(Date.now() / 1000) + 3600),
                sessionToken: null
            };
        } catch (error) {
            console.error('获取上传授权失败:', error);
            throw error;
        }
    }
} 