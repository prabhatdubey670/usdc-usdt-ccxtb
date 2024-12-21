import ccxt from 'ccxt';
import { pro as ccxtpro } from 'ccxt';
import dotenv from 'dotenv';
import debounce from 'lodash';

dotenv.config();

export default class CCXTClientHandler {
  constructor(modelHandler) {
    this.modelHandler = modelHandler;
    if (!modelHandler || typeof modelHandler.setWalletBalances !== 'function') {
      console.error(
        "modelHandler or its method 'setWalletBalances' is not defined."
      );
      return;
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

    // Example usage
    // this.getAccountBalances().then((balances) => {
    //   this.modelHandler.setWalletBalances(
    //     balances.balances,
    //     this.openOrders('USDC/USDT')
    //   );
    // });
  }

  static getInstance(modelHandler) {
    if (!CCXTClientHandler.instance) {
      CCXTClientHandler.instance = new CCXTClientHandler(modelHandler);
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
  async openOrders(symbol) {
    try {
      const openOrders = await this.exchange.fetchOpenOrders(symbol);
      console.log(openOrders);
      return openOrders;
    } catch (error) {
      console.error('Error fetching open orders:', error);
    }
  }
  async publicOrderBook(symbol) {
    while (true) {
      try {
        const data = await this.wsexchange.watchOrderBook(symbol);
        const { bids: buyList, asks: sellList } = data;
        modelHandler.setSpotPairPrice({
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
        const data = await this.wsexchange.watchTrades();
        console.log('Spot private deals event:', data);
      } catch (e) {
        console.log(e);
      }
    }
  }
  async getOrders() {
    while (true) {
      try {
        const data = await this.wsexchange.watchOrders();
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
      return { balances, total };
    } catch (e) {
      console.log(e);
    }
  }

  subscribeSpotPair(symbol) {
    if (!this.subscribeSpotPairList.includes(symbol)) {
      this.subscribeSpotPairList.push(symbol);
    }
  }
  async createOrder(toOrderList) {
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

          const createOrder = await this.exchange.createOrder(
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
    } else {
      console.log(
        `response success client: ${lessOneTotal} - ${new Date().toLocaleString()}`
      );
    }
  }
  async cancelOrder(toCancelOrderList) {
    let toBreak = false;
    let keysList = {};
    try {
      for (let i = 0; i < toCancelOrderList.length; i++) {
        if (toBreak) {
          break;
        }

        const { orderId, symbol, price } = toCancelOrderList[i];

        keysList[price] = keysList[price] ? price + keysList[price] : price;

        const cancelOrder = await this.exchange.cancelOrder(orderId, symbol);
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
  }
}
// const spotPrivateHandler = debounce(async () => {
//   const result = await fetch('/api/getAccount').then((res) => {
//     return res.json();
//   });

//   const orderResult = await fetch(
//     `/api/order?symbol=${modelHandler.activeSpotPair}`
//   ).then((res) => {
//     return res.json();
//   });

//   modelHandler.setWalletBalances(result, orderResult);
// }, 100);
// spotPrivateHandler();
