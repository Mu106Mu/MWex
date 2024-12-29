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
        
        // 2. 准备签名所需参数
        const method = 'put';
        const pathname = '/' + key;
        
        // 3. 生成 FormatString，使用 URL 编码的 content-type
        const formatString = [
            method.toLowerCase(),
            pathname,
            '',  // 空行
            'content-type=' + encodeURIComponent('text/csv'),
            ''   // 结尾空行
        ].join('\n');
        
        // 4. 计算 sha1
        const sha1FormatString = CryptoJS.SHA1(formatString).toString();
        
        // 5. 生成 StringToSign
        const stringToSign = [
            'sha1',
            keyTime,
            sha1FormatString
        ].join('\n');
        
        // 6. 计算签名
        const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();

        // 添加调试日志
        console.log('Debug Info:', {
            formatString,
            sha1FormatString,
            stringToSign,
            signature
        });
        
        // 7. 生成授权参数
        const query = {
            'q-sign-algorithm': 'sha1',
            'q-ak': this.config.SecretId,
            'q-sign-time': keyTime,
            'q-key-time': keyTime,
            'q-header-list': 'content-type',
            'q-url-param-list': '',
            'q-signature': signature
        };
        
        // 8. 构建完整URL
        const queryString = Object.entries(query)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
            
        return `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}?${queryString}`;
    }
} 