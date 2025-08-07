Market-Pulse Microservice
Market-Pulse is a full-stack web application that provides AI-driven market sentiment analysis for stock tickers. It fetches the latest financial data and news, which is then analyzed by the Google Gemini API to provide a "Bullish," "Bearish," or "Neutral" outlook for the next trading day.

Features
AI-Powered Sentiment Analysis: Uses Google's Gemini API for a nuanced market outlook.

Interactive UI: A modern, attractive interface with dynamic animations and data visualizations.

Price Momentum Score: Calculates and displays a simple 5-day price momentum score.

Recent Price Chart: Visualizes the last 20 trading days of price action.

Latest News Feed: Shows the 5 most recent headlines for the selected ticker.

Search History: Remembers your last 5 searches for quick access.

Tech Stack
Backend: Node.js, Express.js

Frontend: React.js, Tailwind CSS

APIs:

Financial Data: Financial Modeling Prep (FMP)

AI Analysis: Google Gemini API

Prerequisites
Before you begin, ensure you have the following installed on your computer:

Node.js and npm: You can download them from nodejs.org.

Setup Instructions
The project is divided into two main parts: the backend server and the frontend application. You will need to run them in two separate terminal windows.

Part 1: Backend Setup (market-pulse-backend)
This is the server that fetches data and communicates with the AI.

Navigate to the Backend Directory:
Open your terminal and navigate to the backend folder.

cd path/to/market-pulse-backend

Create the Environment File:
Create a new file named .env in the market-pulse-backend directory. This file will store your secret API keys.

Add Your API Keys:
Open the .env file and paste in your API keys like this:

GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
FMP_API_KEY=YOUR_FMP_API_KEY_HERE

(Remember to replace the placeholder text with your actual keys.)

Install Dependencies:
Run the following command to install the necessary packages:

npm install

Start the Server:
Run the start command.

npm start

If successful, you will see a message in the terminal: Market-Pulse Server (FMP V2) is running. Keep this terminal window open.

Part 2: Frontend Setup (frontend)
This is the React application that you will see and interact with in your browser.

Navigate to the Frontend Directory:
Open a new terminal window and navigate to the frontend folder.

cd path/to/frontend

Install Dependencies:
First, install the main project packages:

npm install

Install Charting Library:
Next, install the recharts library for the price chart:

npm install recharts

Start the Application:
Run the start command.

npm start

This will automatically open a new tab in your web browser at http://localhost:3000. The application is now ready to use!
