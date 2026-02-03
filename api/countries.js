const axios = require('axios');

// Cache for countries data
let countriesCache = {
    data: null,
    timestamp: null,
    ttl: 86400000 // 24 hours
};

// Interesting facts database
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

// Helper function to generate flag emoji from country code
function getFlagEmoji(countryCode) {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    const codePoints = countryCode
        .toUpperCase()
        .split('')
        .map(char => 127397 + char.charCodeAt());
    return String.fromCodePoint(...codePoints);
}

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

module.exports = async (req, res) => {
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
            .filter(country => country.name && country.name.common)
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
};
