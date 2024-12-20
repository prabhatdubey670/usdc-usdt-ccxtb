// Import ccxtpro for WebSocket interactions with Binance
import { pro as ccxtpro } from 'ccxt';

class BinanceTradingBot {
  constructor(apiKey, secret, targetDistribution) {
    this.exchange = new ccxtpro.binance({
      apiKey,
      secret,
    });
    this.exchange.setSandboxMode(true);
    this.targetDistribution = targetDistribution; // Target asset allocation { usdt: x, usdc: y }
    this.orderLevels = [
      1.0005, 1.0004, 1.0003, 1.0002, 1.0001, 1, 0.9999, 0.9998, 0.9997,
    ]; // Price levels for orders
    this.active = true;
  }

  async fetchBalances() {
    const balance = await this.exchange.fetchBalance();
    console.log(
      'Fetched balances: USDT:',
      balance.total.USDT,
      'USDC:',
      balance.total.USDC
    );
    return {
      usdt: balance.total.USDT || 0,
      usdc: balance.total.USDC || 0,
    };
  }

  calculateOrderDistribution(price) {
    const idx = this.orderLevels.findIndex((level) => price >= level);
    return idx >= 0 ? this.targetDistribution[idx] : { usdt: 0.5, usdc: 0.5 };
  }

  async placeOrders(balance, spotPrice) {
    const { buyPrice, sellPrice } = spotPrice;
    const totalValue = balance.usdt + balance.usdc;
    const buyOrders = [];
    const sellOrders = [];

    for (const price of this.orderLevels) {
      const target = this.calculateOrderDistribution(price);
      const targetUSDC = totalValue * target.usdc;
      const targetUSDT = totalValue * target.usdt;

      if (price > buyPrice && balance.usdt > targetUSDC) {
        const amount = (targetUSDC - balance.usdt) / price;
        buyOrders.push({
          symbol: 'USDC/USDT',
          side: 'BUY',
          price,
          amount,
        });
        console.log(`Prepared BUY order: Price: ${price}, Amount: ${amount}`);
      } else if (price < sellPrice && balance.usdc > targetUSDT) {
        const amount = targetUSDT / price;
        sellOrders.push({
          symbol: 'USDC/USDT',
          side: 'SELL',
          price,
          amount,
        });
        console.log(`Prepared SELL order: Price: ${price}, Amount: ${amount}`);
      }
    }

    console.log('Placing BUY orders:', buyOrders);
    console.log('Placing SELL orders:', sellOrders);

    await Promise.all([
      ...buyOrders.map((order) =>
        this.exchange.createLimitBuyOrder(
          order.symbol,
          order.amount,
          order.price
        )
      ),
      ...sellOrders.map((order) =>
        this.exchange.createLimitSellOrder(
          order.symbol,
          order.amount,
          order.price
        )
      ),
    ]);

    console.log('Orders placed successfully.');
  }

  async cancelOpenOrders() {
    const openOrders = await this.exchange.fetchOpenOrders('USDC/USDT');
    console.log('Open orders:', openOrders);
    await Promise.all(
      openOrders.map((order) =>
        this.exchange.cancelOrder(order.id, 'USDC/USDT')
      )
    );
    console.log('Cancelled all open orders.');
  }

  async handleTickerUpdate(ticker) {
    try {
      //   console.log('Received ticker update:', ticker);
      const balances = await this.fetchBalances();
      const spotPrice = {
        buyPrice: ticker.ask, // Best buy price
        sellPrice: ticker.bid, // Best sell price
      };

      console.log('Current spot price:', spotPrice);
      await this.cancelOpenOrders();
      await this.placeOrders(balances, spotPrice);

      console.log('Processed ticker update successfully.');
    } catch (error) {
      console.error('Error during ticker update handling:', error);
    }
  }

  async start() {
    while (this.active) {
      try {
        const market = 'USDC/USDT';
        const ticker = await this.exchange.watchTicker(market);
        await this.handleTickerUpdate(ticker);
      } catch (error) {
        console.error('Error in WebSocket connection:', error);
      }
    }
  }

  stop() {
    this.active = false;
    this.exchange.close();
    console.log('Trading bot stopped.');
  }
}

// Configuration
const apiKey =
  'pbNQVytQtV3UPRRNUGiUXqBL5lwGTQ0XEAq8tqviauX1zmK0jtIEVUzro9mvUeeq';
const secret =
  'IrvOAwLXEw9AznaYYTGne9Pf1scisFtjjS59wAUJG46FgVXIGLatjYPq0NXPPTbk';
const targetDistribution = [
  { usdt: 1, usdc: 0 },
  { usdt: 0.9, usdc: 0.1 },
  { usdt: 0.8, usdc: 0.2 },
  { usdt: 0.7, usdc: 0.3 },
  { usdt: 0.6, usdc: 0.4 },
  { usdt: 0.5, usdc: 0.5 },
  { usdt: 0.4, usdc: 0.6 },
  { usdt: 0.3, usdc: 0.7 },
  { usdt: 0.2, usdc: 0.8 },
];

const bot = new BinanceTradingBot(apiKey, secret, targetDistribution);

// Start the bot
bot.start();
