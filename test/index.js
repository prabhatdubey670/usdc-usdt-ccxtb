import ccxt from 'ccxt';
import { pro as ccxtpro } from 'ccxt';

const apiKey =
  'pbNQVytQtV3UPRRNUGiUXqBL5lwGTQ0XEAq8tqviauX1zmK0jtIEVUzro9mvUeeq';
const secret =
  'IrvOAwLXEw9AznaYYTGne9Pf1scisFtjjS59wAUJG46FgVXIGLatjYPq0NXPPTbk';

export default class TradingBot {
  constructor(apiKey, secret) {
    if (TradingBot.instance) {
      return TradingBot.instance;
    }

    this.walletBalances = null;
    this.orderList = { buy: {}, sell: {} };
    this.spotPairPrice = null;

    this.exchange = new ccxt.binance({
      apiKey: apiKey,
      secret: secret,
      enableRateLimit: true,
      options: { defaultType: 'spot' },
    });

    // Set the sandbox mode
    this.exchange.setSandboxMode(true);

    TradingBot.instance = this;
  }

  static getInstance(apiKey, secret) {
    if (!TradingBot.instance) {
      TradingBot.instance = new TradingBot(apiKey, secret);
    }
    return TradingBot.instance;
  }

  async updateWalletOrderList() {
    try {
      this.walletBalances = await this.fetchBalances();
      console.log('Wallet Balances:', this.walletBalances);

      this.orderList = await this.fetchOpenOrders();
      console.log('Open Orders:', this.orderList);

      this.spotPairPrice = await this.fetchCurrentSpotPrice();
      console.log('Spot Pair Price:', this.spotPairPrice);

      await this.adjustOrders();
    } catch (error) {
      console.error('Error updating wallet and order list:', error.message);
    }
  }

  async fetchBalances() {
    const balances = await this.exchange.fetchBalance();
    return {
      usdtBalance: {
        total: balances.total.USDT || 0,
      },
      pairBalance: {
        pairTotal: balances.total.USDC || 0,
      },
    };
  }

  async fetchOpenOrders() {
    const orders = await this.exchange.fetchOpenOrders('USDC/USDT');
    const orderList = { buy: {}, sell: {} };

    orders.forEach((order) => {
      const side = order.side.toLowerCase();
      if (!orderList[side][order.price]) {
        orderList[side][order.price] = [];
      }
      orderList[side][order.price].push(order);
    });

    return orderList;
  }

  async fetchCurrentSpotPrice() {
    const ticker = await this.exchange.fetchTicker('USDC/USDT');
    return {
      sellPrice: ticker.bid || 0,
      buyPrice: ticker.ask || 0,
    };
  }

  calculateTargetDistribution(price) {
    if (price >= 1.0005) return { usdt: 1, usdc: 0 };
    if (price >= 1.0004) return { usdt: 0.9, usdc: 0.1 };
    if (price >= 1.0003) return { usdt: 0.8, usdc: 0.2 };
    if (price >= 1.0002) return { usdt: 0.7, usdc: 0.3 };
    if (price >= 1.0001) return { usdt: 0.6, usdc: 0.4 };
    if (price >= 1) return { usdt: 0.5, usdc: 0.5 };
    if (price >= 0.9999) return { usdt: 0.4, usdc: 0.6 };
    if (price >= 0.9998) return { usdt: 0.3, usdc: 0.7 };
    if (price >= 0.9997) return { usdt: 0.2, usdc: 0.8 };
    if (price >= 0.9996) return { usdt: 0.1, usdc: 0.9 };
    return { usdt: 0, usdc: 1 };
  }

  async adjustOrders() {
    try {
      const totalValue = this.walletBalances.usdtBalance.total;
      const { buyPrice, sellPrice } = this.spotPairPrice;

      const priceBuyLevels = [
        1.0005, 1.0004, 1.0003, 1.0002, 1.0001, 1, 0.9999, 0.9998, 0.9997,
        0.9996,
      ];

      const priceSellLevels = [...priceBuyLevels].reverse();

      await this.prepareOrders(priceBuyLevels, 'BUY', buyPrice, totalValue);
      await this.prepareOrders(priceSellLevels, 'SELL', sellPrice, totalValue);
    } catch (error) {
      console.error('Error adjusting orders:', error.message);
    }
  }

  async prepareOrders(priceLevels, side, currentPrice, totalValue) {
    for (const price of priceLevels) {
      try {
        const targetDistribution = this.calculateTargetDistribution(price);
        const targetAmount =
          totalValue *
          (side === 'BUY' ? targetDistribution.usdc : targetDistribution.usdt);
        const currentBalance =
          side === 'BUY'
            ? this.walletBalances.pairBalance.pairTotal
            : this.walletBalances.usdtBalance.total;

        const needAmount = targetAmount - currentBalance;

        console.log(`Price Level: ${price}`);
        console.log(`Target Amount: ${targetAmount}`);
        console.log(`Current Balance: ${currentBalance}`);
        console.log(`Need Amount: ${needAmount}`);

        const existingOrders =
          this.orderList[side.toLowerCase()][price]?.reduce(
            (acc, order) =>
              acc + parseFloat(order.amount) - parseFloat(order.filled),
            0
          ) || 0;

        console.log(`Existing Orders at ${price}: ${existingOrders}`);

        if (needAmount > 0 && needAmount > existingOrders) {
          await this.placeOrder({
            side,
            symbol: 'USDC/USDT',
            amount: needAmount - existingOrders,
            price,
          });
        } else {
          console.log(
            `Skipping order at ${price} due to insufficient funds or no need.`
          );
        }
      } catch (error) {
        console.error(`Error preparing order at ${price}:`, error.message);
      }
    }
  }

  async placeOrder(order) {
    try {
      await this.exchange.createOrder(
        order.symbol,
        'limit',
        order.side.toLowerCase(),
        order.amount,
        order.price
      );
      console.log(`Order placed: ${JSON.stringify(order)}`);
    } catch (error) {
      console.error('Failed to place order:', error.message);
    }
  }

  async cancelOrder(order) {
    try {
      await this.exchange.cancelOrder(order.id, order.symbol);
      console.log(`Order cancelled: ${order.id}`);
    } catch (error) {
      console.error('Failed to cancel order:', error.message);
    }
  }
}

const bot = TradingBot.getInstance(apiKey, secret);

// Function to run the bot and log the outputs
async function runBot() {
  try {
    console.log('Updating wallet and order list...');
    await bot.updateWalletOrderList();
    console.log('Wallet and order list updated successfully.');
  } catch (error) {
    console.error('Error running bot:', error.message);
  }
}

// Run the bot
runBot();
