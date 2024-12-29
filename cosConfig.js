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
        const headers = { 'content-type': 'text/csv' };
        const params = {};
        
        // 3. 生成 HeaderList 和 UrlParamList
        const headerList = Object.keys(headers).sort().join(';').toLowerCase();
        const urlParamList = Object.keys(params).sort().join(';').toLowerCase();
        
        // 4. 生成 HttpString
        const httpString = [
            method.toLowerCase(),
            pathname,
            this.obj2str(params),
            this.obj2str(headers),
            ''
        ].join('\n');
        
        // 5. 生成 StringToSign
        const stringToSign = [
            'sha1',
            keyTime,
            CryptoJS.SHA1(httpString).toString(),
            ''
        ].join('\n');
        
        // 6. 计算签名
        const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString();
        
        // 7. 生成授权参数
        const query = {
            'q-sign-algorithm': 'sha1',
            'q-ak': this.config.SecretId,
            'q-sign-time': keyTime,
            'q-key-time': keyTime,
            'q-header-list': headerList,
            'q-url-param-list': urlParamList,
            'q-signature': signature
        };
        
        // 8. 构建完整URL
        const queryString = Object.entries(query)
            .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
            .join('&');
            
        return `https://${this.config.Bucket}.cos.${this.config.Region}.myqcloud.com/${key}?${queryString}`;
    }

    // 辅助函数：将对象转换为字符串
    static obj2str(obj) {
        const items = Object.entries(obj)
            .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
            .map(([key, value]) => `${key.toLowerCase()}=${value}`);
        return items.join('&');
    }
} 