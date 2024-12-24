import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import CCXTClientHandler from './utils/ccxtClient.js';
import LayoutHandler from './public/js/layoutHandler.js';
import TradingBot from './controller/tradingBot.js';
const layoutHandler = new LayoutHandler();
const tradingBot = new TradingBot();
import ModelHandler from './model/modelHandler.js';
const modelHandler = new ModelHandler(tradingBot, layoutHandler);
const ccxtClientHandler = new CCXTClientHandler(modelHandler);
// File and environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const logFilePath = path.join(__dirname, 'account_total_log.txt');
dotenv.config();

const app = express();
const port = 3010;
app.use(express.json());
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'controller')));
app.use(express.static(path.join(__dirname, 'model')));
app.use(express.static(path.join(__dirname, 'views')));
app.use(express.static(path.join(__dirname, 'utils')));

// Define routes
app.get('/', (req, res) => {
  res.render('index');
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Attach Socket.IO to the server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Set up WebSocket handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  socket.on('subscribeSpotPair', (selectedPair) => {
    try {
      modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });
      ccxtClientHandler.subscribeSpotPair(selectedPair);
    } catch (error) {
      console.error('Error subscribing to spot pair:', error);
    }
  });
  // Example event: Subscribe to account updates
  socket.on('subscribeAccount', async () => {
    try {
      const accountBalances = await ccxtClientHandler.getAccountBalances();
      socket.emit('accountData', accountBalances);
    } catch (error) {
      console.error('Error fetching account balances:', error);
    }
  });

  // Example event: Fetch open orders
  socket.on('fetchOrders', async () => {
    try {
      const openOrders = await ccxtClientHandler.openOrders();
      socket.emit('orderData', openOrders);
    } catch (error) {
      console.error('Error fetching open orders:', error);
    }
  });

  // Example event: Cancel orders
  socket.on('cancelOrders', async (toCancelOrderList) => {
    try {
      const cancelOrder = await ccxtClientHandler.cancelOrder(
        toCancelOrderList
      );
      socket.emit('cancelOrderResponse', cancelOrder);
      
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  });

  // Example event: Create orders
  socket.on('createOrders', async (toOrderList) => {
    try {
      const order = await ccxtClientHandler.createOrder(toOrderList);
      socket.emit('createOrderResponse', order);
    } catch (error) {
      console.error('Error creating order:', error);
    }
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Utility Functions
function appendToFile(data) {
  const logEntry = `${data.accountBalances} - ${data.timestamp}\n`;
  fs.appendFileSync(logFilePath, logEntry, 'utf8');
  console.log(`Successfully saved to log file: ${logEntry}`);
}

// Schedule daily task to fetch account balances
cron.schedule('0 11 * * *', async () => {
  try {
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

// (async () => {
//   const browser = await puppeteer.launch({ headless: false });
//   const page = await browser.newPage();
//   await page.goto('http://localhost:3010');
//   setTimeout(async () => {
//     await browser.close();

//     startBrowser();
//   }, 1000 * 60 * 5);
// })();

// Get the account balances and save to log file
(async () => {
  const accountBalances = await ccxtClientHandler.getAccountBalances();
  const data = {
    accountBalances,
    timestamp: new Date().toLocaleString(),
  };
  appendToFile(data);
})();
