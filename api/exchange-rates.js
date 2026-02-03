const axios = require('axios');

// Cache for exchange rates (Vercel serverless uses Redis or can use in-memory for short durations)
let exchangeRatesCache = {
    data: null,
    timestamp: null,
    ttl: 3600000 // 1 hour
};

const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/';

module.exports = async (req, res) => {
    try {
        const now = Date.now();

        // Check cache
        if (exchangeRatesCache.data && (now - exchangeRatesCache.timestamp) < exchangeRatesCache.ttl) {
            console.log('Using cached exchange rates');
            return res.json(exchangeRatesCache.data);
        }

        console.log('Fetching fresh exchange rates...');
        const response = await axios.get(EXCHANGE_RATE_API + 'USD', {
            timeout: 10000
        });

        exchangeRatesCache = {
            data: response.data,
            timestamp: now,
            ttl: exchangeRatesCache.ttl
        };

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching exchange rates:', error.message);

        // Return cached data if available, even if expired
        if (exchangeRatesCache.data) {
            console.log('Returning stale cache due to API failure');
            return res.json(exchangeRatesCache.data);
        }

        res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
};
