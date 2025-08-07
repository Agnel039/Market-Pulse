// src/index.js

/*
 * =================================================================
 * MARKET-PULSE MICROSERVICE (FMP & GEMINI EDITION) - V3
 * =================================================================
 * This version adds a news fetching capability and returns recent
 * historical data to the frontend for momentum calculation and charting.
 * =================================================================
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const FMP_API_KEY = process.env.FMP_API_KEY;

app.use(cors());
app.use(express.json());

const cache = new Map();

/**
 * Fetches historical stock data from Financial Modeling Prep (FMP).
 * @param {string} ticker - The stock ticker symbol.
 * @returns {Promise<Array<object>>} A promise resolving with historical data.
 */
const getHistoricalData = async (ticker) => {
    if (!FMP_API_KEY) throw new Error('FMP API key not configured.');
    const url = `https://financialmodelingprep.com/api/v3/historical-price-full/${ticker}?apikey=${FMP_API_KEY}`;
    try {
        const response = await axios.get(url);
        if (!response.data || !response.data.historical) {
            throw new Error(`No time series data found for "${ticker}".`);
        }
        return response.data.historical;
    } catch (error) {
        console.error(`[FMP Data Fetch Error] for ${ticker}:`, error.message);
        throw error;
    }
};

/**
 * Fetches the 5 latest news headlines for a ticker from FMP.
 * @param {string} ticker - The stock ticker symbol.
 * @returns {Promise<Array<object>>} A promise resolving with news articles.
 */
const getNewsData = async (ticker) => {
    if (!FMP_API_KEY) throw new Error('FMP API key not configured.');
    const url = `https://financialmodelingprep.com/api/v3/stock_news?tickers=${ticker}&limit=5&apikey=${FMP_API_KEY}`;
    try {
        const response = await axios.get(url);
        return response.data || [];
    } catch (error) {
        console.error(`[FMP News Fetch Error] for ${ticker}:`, error.message);
        // Return empty array on failure so it doesn't break the main flow
        return [];
    }
};


/**
 * Analyzes stock data using the Google Gemini API.
 * @param {string} ticker - The stock ticker symbol.
 * @param {Array<object>} historicalData - Historical price and volume data.
 * @returns {Promise<object>} The AI analysis.
 */
const getGeminiAnalysis = async (ticker, historicalData) => {
    if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured.');
    const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

    const recentData = historicalData.slice(0, 20).map(day => ({
        date: day.date,
        close: day.close,
        volume: day.volume
    }));

    const prompt = `
        You are a concise financial analyst. Analyze the recent daily stock data for "${ticker}".
        1.  **Sentiment**: What is the market sentiment for tomorrow? Answer in one word: "Bullish", "Bearish", or "Neutral".
        2.  **Reasoning**: Provide a concise, one-sentence explanation for your reasoning.
        3.  **Confidence**: How confident are you in this analysis? Answer: "Low", "Medium", or "High".

        Data: ${JSON.stringify(recentData, null, 2)}

        Format your response as a single, valid JSON object with keys: "pulse", "reason", and "confidence".
        Example: {"pulse": "Bullish", "reason": "The stock shows consistent upward momentum on high volume.", "confidence": "High"}
    `;

    try {
        const response = await axios.post(GEMINI_API_URL, {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        if (response.data.candidates && response.data.candidates.length > 0) {
            return JSON.parse(response.data.candidates[0].content.parts[0].text);
        } else {
            throw new Error('Invalid response structure from Gemini API.');
        }
    } catch (error) {
        const errorMessage = error.response ? JSON.stringify(error.response.data.error) : error.message;
        console.error('[Gemini API Error]', errorMessage);
        throw new Error(`Failed to get analysis from Gemini API.`);
    }
};

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'UP', timestamp: new Date().toISOString() });
});

app.get('/market-pulse/:ticker', async (req, res) => {
    const ticker = req.params.ticker.toUpperCase();
    const now = Date.now();

    if (!/^[A-Z0-9.-]{1,10}$/.test(ticker)) {
        return res.status(400).json({ error: 'Invalid ticker format.' });
    }

    if (cache.has(ticker) && (now - cache.get(ticker).timestamp < 600000)) {
        console.log(`[Cache Hit] For ticker: ${ticker}`);
        return res.json(cache.get(ticker).data);
    }
    console.log(`[Cache Miss] For ticker: ${ticker}. Fetching new data.`);

    try {
        // Fetch all data in parallel
        const [historicalData, newsData] = await Promise.all([
            getHistoricalData(ticker),
            getNewsData(ticker)
        ]);

        const analysis = await getGeminiAnalysis(ticker, historicalData);

        const result = {
            ticker,
            pulse: analysis.pulse,
            reason: analysis.reason,
            confidence: analysis.confidence,
            analysis: {
                lastPrice: parseFloat(historicalData[0].close).toFixed(2)
            },
            // Include the last 20 days for the chart and momentum calculation
            history: historicalData.slice(0, 20), 
            news: newsData,
            timestamp: new Date().toISOString()
        };

        cache.set(ticker, { timestamp: now, data: result });
        res.json(result);

    } catch (error) {
        console.error(`[Request Failed] For ticker ${ticker}: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`================================================`);
    console.log(`  Market-Pulse Server (FMP V2) is running`);
    console.log(`  Listening on: http://localhost:${port}`);
    console.log('================================================');
});