class COSConfig {
    // COS 配置信息
    static config = {
        Bucket: 'mw-experiment-1333907144',
        Region: 'ap-guangzhou',
        SecretId: 'AKIDrb8UekcK0XuNkHtSxJTSGAj8qOipyAHK',    // 替换为你的 SecretId
        SecretKey: 'y0YzEJExeCinjbKuMTTIvWJxnbDi2BHE'        // 替换为你的 SecretKey
    };

    static getSignedUrl(key) {
        const now = Math.floor(Date.now() / 1000);
        const expireTime = now + 3600;
        const keyTime = `${now};${expireTime}`;
        
        // 1. 生成 SignKey
        const signKey = CryptoJS.HmacSHA1(keyTime, this.config.SecretKey).toString();
        
        // 2. 构建 HttpString
        const httpString = 'put\n/' + key + '\n\n';
        
        // 3. 生成 StringToSign
        const stringToSign = httpString;
        
        // 4. 计算签名
        const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();
        
        // 5. 生成授权参数
        const query = {
            'q-sign-algorithm': 'sha1',
            'q-ak': this.config.SecretId,
            'q-sign-time': keyTime,
            'q-key-time': keyTime,
            'q-header-list': '',
            'q-url-param-list': '',
            'q-signature': signature
        };
        
        // 6. 构建完整URL
        const queryString = Object.entries(query)
            .map(([key, value]) => `${key}=${value}`)
            .join('&');
            
        return `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}?${queryString}`;
    }
} 