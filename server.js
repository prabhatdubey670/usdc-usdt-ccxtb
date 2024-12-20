import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// import TradingBot from './controller/tradingBot.js';
import ModelHandler from './model/modelHandler.js';
import CCXTClientHandler from './utils/ccxtClient.js';
import LayoutHandler from './view/layoutHandler.js';
import TradingBot from './controller/tradingBot.js';

const tradingBot = new TradingBot();
const layoutHandler = new LayoutHandler();
const modelHandler = ModelHandler.getInstance(tradingBot, layoutHandler);
const ccxtClientHandler = new CCXTClientHandler(modelHandler);

console.log('CCXTClientHandler initialized with modelHandler:', {
  modelHandler: ccxtClientHandler.modelHandler,
  exchange: {
    id: ccxtClientHandler.exchange.id,
    features: ccxtClientHandler.exchange.features,
  },
});

/**
 * Server comprises of websocket connection and api routes
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the log file path
const logFilePath = path.join(__dirname, 'account_total_log.txt');
dotenv.config();
// Define API keys from environment variables
const apikey = process.env.TEST_API_KEY;
const secretkey = process.env.TEST_SECRET_KEY;

const app = express();
const port = 3010;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/controller', express.static(path.join(__dirname, 'controller')));
app.use('/view', express.static(path.join(__dirname, 'view')));
app.use('/utils', express.static(path.join(__dirname, 'utils')));
app.use('/model', express.static(path.join(__dirname, 'model')));

app.get('/', () => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

app.get('/api/getAccount', async (req, res) => {
  while (true) {
    try {
      const accountBalances = await ccxtClientHandler.getAccountBalances();
      res.send(accountBalances);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
      console.error('Error fetching account total:', error);
    }
  }
});

app.get('/api/order', async (req, res) => {
  try {
    const openOrders = await ccxtClientHandler.openOrders();
    res.send(openOrders);
  } catch (error) {
    console.error('Error fetching open orders:', error);
  }
});

app.post('/api/v3/cancel', async (req, res) => {
  const toCancelOrderList = req.body;
  const cancelOrder = await ccxtClientHandler.cancelOrder(toCancelOrderList);
  res.send(cancelOrder);
  console.log('camcelhogya');
});

app.post('/api/v3/order', async (req, res) => {
  const toOrderList = req.body;
  const order = await ccxtClientHandler.createOrder(toOrderList);
  res.send(order);
  console.log('OrderHogay');
});

async function startBrowser() {
  // launches a browser instance
  const browser = await puppeteer.launch();
  // creates a new page in the default browser context
  const page = await browser.newPage();
  // navigates to the page to be scraped
  await page.goto('http://localhost:3010/');

  setTimeout(async () => {
    await browser.close();

    startBrowser();
  }, 1000 * 60 * 5);
}

// startBrowser();

// Function to append data to a local file
function appendToFile(data) {
  const logEntry = `${data.accountBalances} - ${data.timestamp}\n`;
  fs.appendFileSync(logFilePath, logEntry, 'utf8');
  console.log(`Successfully saved to log file: ${logEntry}`);
}

// Schedule the task to run every day at 11:00 AM
cron.schedule('0 11 * * *', async () => {
  try {
    // Assuming the total is obtained from your existing /api/getAccount endpoint
    const accountBalances = await ccxtClientHandler.getAccountBalances();

    const data = {
      accountBalances,
      timestamp: new Date().toLocaleString(),
    };

    appendToFile(data);
  } catch (error) {
    console.error('Error fetching account total:', error);
  }
});

(async () => {
  try {
    // Assuming the total is obtained from your existing /api/getAccount endpoint
    const accountBalances = await ccxtClientHandler.getAccountBalances();
    const data = {
      accountBalances,
      timestamp: new Date().toLocaleString(),
    };

    appendToFile(data);
  } catch (error) {
    console.error('Error fetching account total:', error);
  }
})();
