const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.AIRTABLE_API_KEY}).base('你的Base ID');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);
        await base('实验数据').create([
            {
                fields: data
            }
        ]);

        return {
            statusCode: 200,
            body: JSON.stringify({success: true})
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({error: error.message})
        };
    }
}; 