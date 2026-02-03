const axios = require('axios');

module.exports = async (req, res) => {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { wealth, currency } = req.body;

        if (!wealth || !currency) {
            return res.status(400).json({ error: 'Wealth and currency are required' });
        }

        console.log(`Calculating ranking for ${wealth} ${currency}...`);

        // Get the base URL from the request (works in both local and Vercel)
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const baseUrl = `${protocol}://${host}`;

        // Get exchange rates and countries data from our own API
        const [exchangeRatesResponse, countriesResponse] = await Promise.all([
            axios.get(`${baseUrl}/api/exchange-rates`),
            axios.get(`${baseUrl}/api/countries`)
        ]);

        const rates = exchangeRatesResponse.data.rates;
        const countries = countriesResponse.data;

        // Convert wealth to USD first (base currency)
        const wealthInUSD = wealth / rates[currency];

        const results = [];
        let skippedCount = 0;

        countries.forEach(country => {
            // Skip if no currency data
            if (!country.currency || !rates[country.currency]) {
                skippedCount++;
                console.log(`Skipping ${country.name} - currency: ${country.currency || 'none'}`);
                return;
            }

            // Convert wealth to country's currency
            const wealthInCountryCurrency = wealthInUSD * rates[country.currency];

            // Calculate thresholds
            const billionaireThreshold = 1000000000;
            const millionaireThreshold = 1000000;

            let status = 'not-wealthy';
            let wealthInBillions = 0;
            let wealthInMillions = 0;

            if (wealthInCountryCurrency >= billionaireThreshold) {
                status = 'billionaire';
                wealthInBillions = wealthInCountryCurrency / billionaireThreshold;
            } else if (wealthInCountryCurrency >= millionaireThreshold) {
                status = 'millionaire';
                wealthInMillions = wealthInCountryCurrency / millionaireThreshold;
            }

            // Only include countries where user has at least millionaire status
            if (status !== 'not-wealthy') {
                results.push({
                    ...country,
                    status: status,
                    wealthInLocalCurrency: wealthInCountryCurrency,
                    wealthInBillions: wealthInBillions,
                    wealthInMillions: wealthInMillions
                });
            }
        });

        // Sort by wealth in local currency (descending)
        results.sort((a, b) => b.wealthInLocalCurrency - a.wealthInLocalCurrency);

        console.log(`Skipped ${skippedCount} countries due to missing currency data`);
        console.log(`Found ${results.length} countries where user has millionaire+ status`);

        res.json({
            originalWealth: wealth,
            originalCurrency: currency,
            wealthInUSD: wealthInUSD,
            totalCountries: results.length,
            billionaireCountries: results.filter(c => c.status === 'billionaire').length,
            millionaireCountries: results.filter(c => c.status === 'millionaire').length,
            countries: results
        });

    } catch (error) {
        console.error('Error calculating ranking:', error.message);
        console.error('Full error:', error);
        res.status(500).json({
            error: 'Failed to calculate ranking',
            message: error.message
        });
    }
};
