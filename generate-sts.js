const TencentCloud = require('tencentcloud-sdk-nodejs');
const StsClient = TencentCloud.sts.v20180813.Client;

exports.main = async (event) => {
    const client = new StsClient({
        credential: {
            secretId: process.env.TENCENT_SECRET_ID,
            secretKey: process.env.TENCENT_SECRET_KEY,
        },
        region: 'ap-guangzhou',
        profile: {
            signMethod: 'TC3-HMAC-SHA256',
            httpProfile: {
                reqMethod: 'POST',
                reqTimeout: 30,
                endpoint: 'sts.tencentcloudapi.com',
            },
        },
    });

    const params = {
        Name: 'mw-experiment-upload',
        Policy: JSON.stringify({
            version: '2.0',
            statement: [{
                effect: 'allow',
                action: [
                    'name/cos:PutObject'
                ],
                resource: [
                    'qcs::cos:ap-guangzhou:uid/1333907144:mw-experiment-1333907144/data/*'
                ]
            }]
        })
    };

    try {
        const response = await client.GetFederationToken(params);
        return {
            statusCode: 200,
            body: JSON.stringify({
                authorization: response.Credentials.Token,
                sessionToken: response.Credentials.TmpSecretKey,
                expiration: response.ExpiredTime
            })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
}; 