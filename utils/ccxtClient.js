import ccxt from 'ccxt';
import { pro as ccxtpro } from 'ccxt';
import dotenv from 'dotenv';
// import debounce from 'lodash';
import ModelHandler from '../model/modelHandler.js';
dotenv.config();

export default class CCXTClientHandler {
  constructor() {
    console.log('Running ur codebase');
    if (CCXTClientHandler.instance) {
      return CCXTClientHandler.instance;
    }
    this.exchange = new ccxt.binance({
      apiKey: process.env.TEST_API_KEY,
      secret: process.env.TEST_SECRET_KEY,
    });
    this.wsexchange = new ccxtpro.binance({
      apiKey: process.env.TEST_API_KEY,
      secret: process.env.TEST_SECRET_KEY,
    });
    this.exchange.setSandboxMode(true);
    this.wsexchange.setSandboxMode(true);
    this.subscribeSpotPairList = [];
    this.getAccountBalances = this.getAccountBalances;
    this.openOrders = this.openOrders;
    this.cancelOrder = this.cancelOrder;
    this.createOrder = this.createOrder;
    this.publicOrderBook = this.publicOrderBook;
    this.getMyTrades = this.getMyTrades;

    CCXTClientHandler.instance = this;
    this.modelHandler = new ModelHandler.getInstance();
    this.modelHandler.setWalletBalances(this.getAccountBalances);
  }

  static getInstance() {
    if (!CCXTClientHandler.instance) {
      CCXTClientHandler.instance = new CCXTClientHandler();
    }
    return CCXTClientHandler.instance;
  }

  onOpen() {
    console.log('WebSocket connection established.');
    if (this.subscribeSpotPairList.length != 0) {
      this.subscribeSpotPairList.forEach((symbol) => {
        this.subscribeSpotPair(symbol);
      });
    }
  }

  async publicOrderBook(symbol) {
    while (true) {
      try {
        const data = await this.wsbinance.watchOrderBook(symbol);
        const { bids: buyList, asks: sellList } = data;
        await ModelHandler.setSpotPairPrice({
          key: pair,
          spotPairPrice: { buyList, sellList },
        });
      } catch (e) {
        console.log(e);
      }
    }
  }
  async getMyTrades() {
    while (true) {
      try {
        const data = await this.wsbinance.watchTrades();
        console.log('Spot private deals event:', data);
      } catch (e) {
        console.log(e);
      }
    }
  }
  async getOrders() {
    while (true) {
      try {
        const data = await this.wsbinance.watchOrders();
        console.log('Spot private orders event:', data);
        return data;
      } catch (e) {
        console.log(e);
      }
    }
  }
  async getAccountBalances() {
    try {
      const balances = await this.exchange.fetchBalance();
      const usdtBalance = balances ? balances.USDT : 0;
      const pairBalance = balances ? balances.USDC : 0;
      const usdtTotal =
        parseFloat(usdtBalance?.free || 0) + parseFloat(usdtBalance?.used || 0);
      const pairTotal =
        parseFloat(pairBalance?.free || 0) + parseFloat(pairBalance?.used || 0);

      let total = usdtTotal + pairTotal;
      console.log(`Account Total : ${total} - ${new Date().toLocaleString()}`);
      // modelHandler.setWalletBalances(result, orderResult);
      return total;
    } catch (e) {
      console.log(e);
    }
  }

  subscribeSpotPair(symbol) {
    if (!this.subscribeSpotPairList.includes(symbol)) {
      this.subscribeSpotPairList.push(symbol);
    }
  }
}
const spotPrivateHandler = debounce(async () => {
  const result = await fetch('/api/getAccount').then((res) => {
    return res.json();
  });

  const orderResult = await fetch(
    `/api/order?symbol=${ModelHandler.activeSpotPair}`
  ).then((res) => {
    return res.json();
  });

  modelHandler.setWalletBalances(result, orderResult);
}, 100);
