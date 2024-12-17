import express from 'express';
import path from 'path';
import puppeteer from 'puppeteer';
import fs from 'fs';
import cron from 'node-cron';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import TradingBot from './controller/tradingBot.js';
import CCXTClientHandler from './utils/ccxtClient.js';
const ccxtClientHandler = new CCXTClientHandler();
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

// Setting up websocket
const io = new Server(server);
const tradingBot = new TradingBot(io);

io.on('connection', (socket) => {
  console.log('A user connected');

  // Listen for messages from the client
  socket.on('clientMessage', (data) => {
    console.log('Message from client:', data);
    // You can send a response back to the client
    socket.emit('serverMessage', { message: 'Hello from server!' });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User  disconnected');
  });
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
    const openOrders = await binance.fetchOpenOrders();
    res.send(openOrders);
  } catch (error) {
    console.error('Error fetching open orders:', error);
  }
});

app.post('/api/v3/cancel', async (req, res) => {
  const toCancelOrderList = req.body;
  let toBreak = false;
  let keysList = {};
  try {
    for (let i = 0; i < toCancelOrderList.length; i++) {
      if (toBreak) {
        break;
      }

      const { orderId, symbol, price } = toCancelOrderList[i];

      keysList[price] = keysList[price] ? price + keysList[price] : price;

      const cancelOrder = await binance.cancelOrder(orderId, symbol);
      if (cancelOrder) {
        console.log(`Cancel Order Done: ${price} - ${orderId}`);
      } else {
        console.error(`Cancel Order Error: ${orderId}`);
        toBreak = true;
      }
    }
  } catch (error) {
    console.error(`Error 1:`, error);
  }

  if (toBreak) {
    console.error(
      `Cancel Order error client: ${Object.entries(keysList)
        .map((value) => `${value[0]} - ${value[1]}`)
        .join(', ')} - ${new Date().toLocaleString()}`
    );
    res.send('error');
  } else {
    console.warn(
      `Cancel Order success client: ${Object.keys(keysList).join(
        ', '
      )} - ${new Date().toLocaleString()}`
    );
    res.send('success');
  }
});

app.post('/api/v3/order', async (req, res) => {
  const toOrderList = req.body;
  let toBreak = false;
  let lessOneTotal = 0;

  try {
    for (let i = 0; i < toOrderList.length; i++) {
      if (toBreak) {
        break;
      }
      const { symbol, side, type, quantity, price } = toOrderList[i];
      if (quantity * price >= 1) {
        console.log(
          `Place order: ${toOrderList[i].side} - ${toOrderList[i].price} - ${toOrderList[i].quantity}`
        );

        const createOrder = await binance.createOrder(
          symbol,
          type,
          side,
          quantity,
          price
        );
        if (createOrder) {
          console.log(
            `Place Order Done: ${toOrderList[i].side} - ${toOrderList[i].price} - ${toOrderList[i].quantity}`
          );
        } else {
          console.error(
            `Place Order Error: ${toOrderList[i].side} - ${toOrderList[i].price} - ${toOrderList[i].quantity}:`,
            error
          );
          if (
            error?.response?.data?.code === 30005 ||
            error?.response?.data?.code === 30004
          ) {
            toBreak = true;
          }
        }
      } else {
        lessOneTotal += quantity * price;
      }
    }
  } catch (error) {
    console.error(`Error 2:`, error);
  }

  if (toBreak) {
    console.error(`response error client: ${new Date().toLocaleString()}`);

    res.send('error');
  } else {
    console.log(
      `response success client: ${lessOneTotal} - ${new Date().toLocaleString()}`
    );

    res.send('success');
  }
});

// app.post("/test", (req, res) => {
//   console.log(req.body);
//   res.send("POST request to the homepage");
// });

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
