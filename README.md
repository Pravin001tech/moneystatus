# 🌍 Global Wealth Ranker - Real-Time Edition

A powerful full-stack web application that calculates your wealth ranking across all ~195 countries in real-time using live APIs.

## 🚀 Features

### Real-Time Data Integration
- ✅ **Exchange Rate API** - Live currency conversion rates
- ✅ **REST Countries API** - All 195+ countries with complete data
- ✅ **Dynamic Calculations** - Real-time wealth ranking across all countries
- ✅ **Smart Caching** - 1-hour cache for exchange rates, 24-hour for countries data

### What Makes This Different
- **ALL Countries** - Covers all ~195 countries, not just 16
- **Real-Time Exchange Rates** - Live API data, not hardcoded values
- **Proper Backend** - Node.js/Express server with API endpoints
- **Smart Filtering** - Filter by Billionaire/Millionaire status
- **Rich Country Data** - Population, capital, languages, regions, and interesting facts

### Tech Stack

**Backend:**
- Node.js
- Express.js
- Axios (for API calls)
- CORS (for cross-origin requests)
- REST Countries API (https://restcountries.com/)
- Exchange Rate API (https://www.exchangerate-api.com/)

**Frontend:**
- HTML5
- CSS3 (with gradients, animations, responsive design)
- Vanilla JavaScript (async/await, fetch API)

## 📁 Project Structure

```
wealth-ranker-backend/
├── server.js           # Express server with API endpoints
├── package.json        # Dependencies and scripts
├── .env               # Environment variables
├── public/
│   └── index.html     # Frontend application
└── README.md          # This file
```

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or higher) - Download from https://nodejs.org/
- npm (comes with Node.js)

### Setup Steps

1. **Navigate to the project directory:**
   ```bash
   cd wealth-ranker-backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

4. **Open in browser:**
   The app will open at: http://localhost:3000

## 🌐 API Endpoints

### 1. Health Check
```
GET /api/health
```
Returns API status

### 2. Get Exchange Rates
```
GET /api/exchange-rates
```
Returns real-time exchange rates (cached for 1 hour)

### 3. Get All Countries
```
GET /api/countries
```
Returns all ~195 countries with complete data (cached for 24 hours)

### 4. Calculate Wealth Ranking
```
POST /api/calculate-ranking
Content-Type: application/json

{
  "wealth": 1000000000,
  "currency": "INR"
}
```

Returns:
```json
{
  "originalWealth": 1000000000,
  "originalCurrency": "INR",
  "wealthInUSD": 12000000,
  "totalCountries": 145,
  "billionaireCountries": 89,
  "millionaireCountries": 56,
  "countries": [
    {
      "name": "India",
      "flag": "🇮🇳",
      "currency": "INR",
      "status": "billionaire",
      "wealthInLocalCurrency": 1000000000,
      "wealthInBillions": 1.0,
      "interestingFact": "...",
      "capital": "New Delhi",
      "region": "Asia",
      "population": 1380004385
    }
  ]
}
```

## 💡 How It Works

### 1. User Input
- User enters wealth amount and selects currency

### 2. Backend Processing
- Converts wealth to USD (base currency) using live exchange rates
- Fetches all countries data from REST Countries API
- Converts wealth to each country's local currency
- Determines status (Billionaire/Millionaire) based on thresholds

### 3. Status Calculation
- **Billionaire**: Wealth ≥ 1 billion in local currency
- **Millionaire**: Wealth ≥ 1 million in local currency
- Only shows countries where user has at least millionaire status

### 4. Results Display
- Sorted by wealth in local currency (descending)
- Shows country flag, name, region, capital
- Displays wealth in local currency
- Provides interesting facts about each country

## 🎨 Frontend Features

### Visual Design
- Modern gradient backgrounds
- Animated cards with hover effects
- Responsive grid layout
- Real-time API status indicator

### Interactive Elements
- Filter by All/Billionaire/Millionaire
- Enter key support
- Loading animations
- Error handling with user-friendly messages

### Information Displayed per Country
- 🏳️ Country flag
- 📍 Country name and region
- 💰 Wealth in local currency
- 🏆 Status badge (Billionaire/Millionaire)
- 🏛️ Capital city
- 💡 Interesting fact

## 🔄 API Integration Details

### Exchange Rate API
- **Endpoint**: https://api.exchangerate-api.com/v4/latest/USD
- **Update Frequency**: Every 1 hour (cached)
- **Base Currency**: USD
- **Supported Currencies**: 150+ currencies

### REST Countries API
- **Endpoint**: https://restcountries.com/v3.1/all
- **Update Frequency**: Every 24 hours (cached)
- **Data Points**: 195+ countries
- **Information per Country**: Name, flag, currency, capital, population, languages, region, subregion

## 📊 Example Usage

### Example 1: Indian Billionaire
Input:
- Wealth: 1,000,000,000 INR
- Currency: INR

Output:
- Billionaire in: India (₹1 billion)
- Millionaire in: 89 countries
- Total wealth in USD: ~$12 million

### Example 2: US Millionaire
Input:
- Wealth: 5,000,000 USD
- Currency: USD

Output:
- Billionaire in: Countries with very weak currencies
- Millionaire in: 45 countries
- Total wealth in USD: $5 million

## 🔧 Customization

### Change Cache Duration
Edit `server.js`:
```javascript
exchangeRatesCache.ttl = 3600000; // 1 hour in milliseconds
countriesCache.ttl = 86400000; // 24 hours in milliseconds
```

### Add More Currencies
Edit `public/index.html`:
```html
<option value="YOUR_CURRENCY">Flag Currency Name (CODE)</option>
```

### Modify Thresholds
Edit `server.js`:
```javascript
const billionaireThreshold = 1000000000; // 1 billion
const millionaireThreshold = 1000000; // 1 million
```

## 🐛 Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Change PORT in `.env` file

### API errors
- Check internet connection
- Verify API services are online
- Check browser console for errors

### Countries not loading
- Check REST Countries API status
- Verify CORS is enabled
- Check server logs

## 📝 License

This project is open source and available for educational purposes.

## 🙏 Acknowledgments

- **Exchange Rate API** - https://www.exchangerate-api.com/
- **REST Countries API** - https://restcountries.com/
- **Flag emojis** - Provided by REST Countries API

## 📤 GitHub Deployment

### Quick Upload Commands

```bash
# Initialize Git repository (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Wealth Ranker Backend"

# Create repository on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/wealth-ranker-backend.git
git branch -M main
git push -u origin main
```

### After Cloning from GitHub

Anyone cloning your repository will need to:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Create `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Start the server:**
   ```bash
   npm start
   # or double-click start.bat (Windows)
   ```

### Repository Structure

```
wealth-ranker-backend/
├── .gitignore              # Git exclusions (node_modules, .env)
├── .env.example            # Environment variables template
├── package.json            # Dependencies and scripts
├── package-lock.json       # Locked dependency versions
├── server.js               # Express server with API endpoints
├── start.bat               # Quick start script (Windows)
├── README.md               # This file
└── public/
    └── index.html          # Frontend application
```

## 🚀 Future Enhancements

- [ ] Add more currency options
- [ ] Include historical wealth tracking
- [ ] Add charts/visualizations
- [ ] Export results as PDF
- [ ] Add dark mode
- [ ] Mobile app version
- [ ] User accounts and saving results
- [ ] Comparison with famous billionaires

---

**Built with ❤️ using real-time APIs**
