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
        
        // 生成签名
        const signKey = CryptoJS.HmacSHA1(keyTime, this.config.SecretKey).toString();
        const stringToSign = `put\n/${key}\n\nhost=${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com\n`;
        const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();
        
        return `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}?q-sign-algorithm=sha1&q-ak=${this.config.SecretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-signature=${signature}`;
    }
} 