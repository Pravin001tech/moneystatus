const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// API Keys (using free APIs)
const EXCHANGE_RATE_API = 'https://api.exchangerate-api.com/v4/latest/';
const REST_COUNTRIES_API = 'https://restcountries.com/v3.1/all';

// Cache for exchange rates (update every hour)
let exchangeRatesCache = {
    data: null,
    timestamp: null,
    ttl: 3600000 // 1 hour
};

// Cache for countries data (update every 24 hours)
let countriesCache = {
    data: null,
    timestamp: null,
    ttl: 86400000 // 24 hours
};

// Interesting facts database (generated dynamically)
const interestingFacts = [
    "is home to unique cultural traditions and has a rich history spanning thousands of years.",
    "has diverse landscapes ranging from mountains to coastlines, offering breathtaking natural beauty.",
    "boasts a unique cuisine that has influenced food culture around the world.",
    "has made significant contributions to art, literature, and human civilization.",
    "features stunning architecture that blends ancient traditions with modern innovation.",
    "is known for its technological advancements and innovative spirit.",
    "has a vibrant cultural scene with festivals celebrated throughout the year.",
    "possesses natural wonders and unique ecosystems found nowhere else on Earth.",
    "has a rich musical heritage that has influenced global music trends.",
    "is renowned for its fashion, design, and creative industries.",
    "has produced Nobel laureates and pioneers in various fields of science and arts.",
    "offers a unique blend of historical landmarks and modern urban development."
];

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Wealth Ranker API is running' });
});

// Get real-time exchange rates
app.get('/api/exchange-rates', async (req, res) => {
    try {
        const now = Date.now();

        // Check cache
        if (exchangeRatesCache.data && (now - exchangeRatesCache.timestamp) < exchangeRatesCache.ttl) {
            console.log('Using cached exchange rates');
            return res.json(exchangeRatesCache.data);
        }

        console.log('Fetching fresh exchange rates...');
        const response = await axios.get(EXCHANGE_RATE_API + 'USD');

        exchangeRatesCache = {
            data: response.data,
            timestamp: now,
            ttl: exchangeRatesCache.ttl
        };

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching exchange rates:', error.message);
        res.status(500).json({ error: 'Failed to fetch exchange rates' });
    }
});

// Get all countries with their data
app.get('/api/countries', async (req, res) => {
    try {
        const now = Date.now();

        // Check cache
        if (countriesCache.data && (now - countriesCache.timestamp) < countriesCache.ttl) {
            console.log('Using cached countries data');
            return res.json(countriesCache.data);
        }

        console.log('Fetching countries data...');

        // Try multiple endpoints with fallback
        let response;
        const endpoints = [
            'https://restcountries.com/v3.1/all?fields=name,flags,currencies,region,subregion,population,capital,languages',
            'https://restcountries.com/v3.1/all',
            'https://restcountries.com/v2/all?fields=name,flags,currencies,region,subregion,population,capital,languages'
        ];

        for (const endpoint of endpoints) {
            try {
                console.log(`Trying endpoint: ${endpoint}`);
                response = await axios.get(endpoint, {
                    timeout: 10000,
                    headers: {
                        'User-Agent': 'WealthRanker/1.0'
                    }
                });
                if (response.data && response.data.length > 0) {
                    console.log(`Successfully fetched ${response.data.length} countries`);
                    break;
                }
            } catch (err) {
                console.log(`Endpoint failed: ${endpoint} - ${err.message}`);
                continue;
            }
        }

        if (!response || !response.data || response.data.length === 0) {
            throw new Error('All API endpoints failed');
        }

        // Process and format countries data
        const processedCountries = response.data
            .filter(country => country.name && country.name.common) // Filter out invalid entries
            .map(country => {
                const currencyCode = country.currencies ? Object.keys(country.currencies)[0] : 'USD';
                const currencyData = country.currencies ? Object.values(country.currencies)[0] : null;

                return {
                    name: country.name.common,
                    officialName: country.name.official || country.name.common,
                    flag: country.flags?.emoji || getFlagEmoji(country.cca2 || ''),
                    flagUrl: country.flags?.png || country.flags?.svg || '',
                    currency: currencyCode,
                    currencyName: currencyData?.name || 'Dollar',
                    currencySymbol: currencyData?.symbol || '$',
                    region: country.region || 'World',
                    subregion: country.subregion || '',
                    population: country.population || 0,
                    capital: country.capital && country.capital[0] ? country.capital[0] : 'N/A',
                    languages: country.languages ? Object.values(country.languages) : [],
                    interestingFact: generateInterestingFact(country)
                };
            });

        console.log(`Processed ${processedCountries.length} countries`);

        countriesCache = {
            data: processedCountries,
            timestamp: now,
            ttl: countriesCache.ttl
        };

        res.json(processedCountries);
    } catch (error) {
        console.error('Error fetching countries:', error.message);
        console.error('Full error:', error);

        // Return cached data if available, even if expired
        if (countriesCache.data) {
            console.log('Returning stale cache due to API failure');
            return res.json(countriesCache.data);
        }

        res.status(500).json({
            error: 'Failed to fetch countries data',
            message: error.message,
            tip: 'Please try again in a few minutes or check if restcountries.com is accessible'
        });
    }
});

// Helper function to generate flag emoji from country code
function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

// Calculate wealth ranking across all countries
app.post('/api/calculate-ranking', async (req, res) => {
    try {
        const { wealth, currency } = req.body;

        if (!wealth || !currency) {
            return res.status(400).json({ error: 'Wealth and currency are required' });
        }

        console.log(`Calculating ranking for ${wealth} ${currency}...`);

        // Get exchange rates and countries data
        const [exchangeRatesData, countriesData] = await Promise.all([
            axios.get('http://localhost:3000/api/exchange-rates'),
            axios.get('http://localhost:3000/api/countries')
        ]);

        const rates = exchangeRatesData.data.rates;
        const countries = countriesData.data;

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

            // Calculate billionaire threshold (1 billion in local currency)
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
        res.status(500).json({ error: 'Failed to calculate ranking' });
    }
});

// Generate interesting fact based on country data
function generateInterestingFact(country) {
    const facts = [];

    // Handle country name - support both raw API and processed data
    const countryName = country.name?.common || country.name || 'This country';

    if (country.population) {
        const populationStr = country.population >= 1000000000
            ? `${(country.population / 1000000000).toFixed(1)} billion`
            : country.population >= 1000000
            ? `${(country.population / 1000000).toFixed(1)} million`
            : `${country.population.toLocaleString()}`;

        facts.push(`has a population of ${populationStr} people`);
    }

    // Handle capital - could be array or string
    let capitalCity = 'N/A';
    if (Array.isArray(country.capital)) {
        capitalCity = country.capital[0] || 'N/A';
    } else if (country.capital) {
        capitalCity = country.capital;
    }

    if (capitalCity && capitalCity !== 'N/A') {
        facts.push(`with ${capitalCity} as its capital city`);
    }

    if (country.region) {
        facts.push(`located in ${country.region}`);
    }

    // Handle languages - could be object or array
    let languagesList = [];
    if (country.languages) {
        if (typeof country.languages === 'object' && !Array.isArray(country.languages)) {
            languagesList = Object.values(country.languages);
        } else if (Array.isArray(country.languages)) {
            languagesList = country.languages;
        }
    }

    if (languagesList.length > 0) {
        const langList = languagesList.slice(0, 3).join(', ');
        facts.push(`where people speak ${langList}${languagesList.length > 3 ? ' and more' : ''}`);
    }

    // Add a random interesting fact
    const randomFact = interestingFacts[Math.floor(Math.random() * interestingFacts.length)];

    return `${countryName} ${facts.join(', ')}, and ${randomFact}`;
}

// Serve the frontend
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🌍 WEALTH RANKER API SERVER                         ║
║                                                        ║
║   Server running on: http://localhost:${PORT}          ║
║   API Health: http://localhost:${PORT}/api/health      ║
║                                                        ║
║   Features:                                            ║
║   ✓ Real-time exchange rates                          ║
║   ✓ All ~195 countries                                ║
║   ✓ Dynamic wealth calculation                        ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
    `);
});
