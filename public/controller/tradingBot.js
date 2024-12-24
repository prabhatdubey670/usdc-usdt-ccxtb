export default class TradingBot {
  constructor() {
    if (TradingBot.instance) {
      return TradingBot.instance;
    }

    this.walletBalances = null;
    this.orderList = null;
    this.spotPairPrice = null;

    this.socket = io('http://localhost:3010'); // Adjust the URL as needed

    TradingBot.instance = this;
  }

  static getInstance() {
    if (!TradingBot.instance) {
      TradingBot.instance = new TradingBot();
    }
    return TradingBot.instance;
  }

  updateWalletOrderList(walletBalances, orderList, spotPairPrice) {
    this.walletBalances = walletBalances;
    this.orderList = orderList;
    this.spotPairPrice = spotPairPrice;

    this.adjustOrders();
  }

  getCurrentSpotPrice() {
    if (!this.spotPairPrice || !this.spotPairPrice.USDC / USDT) {
      throw new Error('Spot pair price is unavailable');
    }

    return {
      sellPrice: parseFloat(
        this.spotPairPrice.USDC /
          USDT.sellList[this.spotPairPrice.USDC / USDT.sellList.length - 1].p
      ),
      buyPrice: parseFloat(this.spotPairPrice.USDC / USDT.buyList[0].p),
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

  calculateExistingOrders() {
    const existingBuyOrders = Object.values(this.orderList.buy)
      .flat()
      .reduce((acc, order) => {
        return acc + parseFloat(order.origQuoteOrderQty);
      }, 0);

    const existingSellOrders = Object.values(this.orderList.sell)
      .flat()
      .reduce((acc, order) => {
        return acc + parseFloat(order.origQuoteOrderQty);
      }, 0);

    return { existingBuyOrders, existingSellOrders };
  }

  adjustOrders() {
    const totalValue = this.walletBalances.usdtBalance.total;

    const priceBuyLevels = [
      1.0005, 1.0004, 1.0003, 1.0002, 1.0001, 1, 0.9999, 0.9998, 0.9997, 0.9996,
      0.9995,
    ];

    const priceSellLevels = [...priceBuyLevels].reverse();

    const { buyPrice, sellPrice } = this.getCurrentSpotPrice();
    let toOrderList = [];
    let toCancelOrderList = [];

    this.prepareBuyOrders(
      priceBuyLevels,
      buyPrice,
      totalValue,
      toOrderList,
      toCancelOrderList
    );
    this.prepareSellOrders(
      priceSellLevels,
      sellPrice,
      totalValue,
      toOrderList,
      toCancelOrderList
    );

    if (toCancelOrderList.length > 0) {
      this.cancelOrder(toCancelOrderList);
    } else {
      this.placeOrder(toOrderList);
    }
  }

  prepareBuyOrders(
    priceBuyLevels,
    buyPrice,
    totalValue,
    toOrderList,
    toCancelOrderList
  ) {
    let priceBuyIndex = 0;
    let buyList = [];

    for (let i = 0; i < priceBuyLevels.length; i++) {
      if (buyPrice >= priceBuyLevels[i]) {
        priceBuyIndex = i;
        break;
      }
    }

    for (let i = priceBuyIndex; i < priceBuyLevels.length; i++) {
      const price = priceBuyLevels[i];
      const targetDistribution = this.calculateTargetDistribution(price);
      const targetUSDC = totalValue * targetDistribution.usdc;
      const currentUSDC = this.walletBalances.pairBalance.pairTotal;
      const needBuyUSDC = targetUSDC - currentUSDC;
      let quantity = 0;

      if (needBuyUSDC > 0) {
        quantity =
          needBuyUSDC - buyList.reduce((acc, order) => acc + order.quantity, 0);
        buyList.push({
          price,
          quantity,
        });

        if (this.orderList.buy[price]) {
          const existingBuyOrders = this.orderList.buy[price].reduce(
            (acc, order) =>
              acc + parseFloat(order.origQty) - parseFloat(order.executedQty),
            0
          );

          if (existingBuyOrders < quantity) {
            toOrderList.push({
              side: 'BUY',
              symbol: 'USDC/USDT',
              quantity: quantity - existingBuyOrders,
              price,
            });
          } else {
            let nowPriceTotal = 0;

            for (let i = 0; i < this.orderList.buy[price].length; i++) {
              nowPriceTotal =
                nowPriceTotal +
                parseFloat(this.orderList.buy[price][i].origQty) -
                parseFloat(this.orderList.buy[price][i].executedQty);
              if (nowPriceTotal >= quantity) {
                toCancelOrderList.push(this.orderList.buy[price][i]);
                nowPriceTotal =
                  nowPriceTotal -
                  parseFloat(this.orderList.buy[price][i].origQty) +
                  parseFloat(this.orderList.buy[price][i].executedQty);
              }
            }
          }
        } else {
          toOrderList.push({
            side: 'BUY',
            symbol: 'USDC/USDT',
            quantity,
            price,
          });
        }
      }
    }
  }

  prepareSellOrders(
    priceSellLevels,
    sellPrice,
    totalValue,
    toOrderList,
    toCancelOrderList
  ) {
    let priceSellIndex = 0;
    let sellList = [];

    for (let i = 0; i < priceSellLevels.length; i++) {
      if (sellPrice >= priceSellLevels[i]) {
        priceSellIndex = i;
        break;
      }
    }

    for (let i = priceSellIndex; i < priceSellLevels.length; i++) {
      const price = priceSellLevels[i];
      const targetDistribution = this.calculateTargetDistribution(price);
      const targetUSDT = totalValue * targetDistribution.usdt;
      const currentUSDT = this.walletBalances.usdtBalance.usdtTotal;
      const needSellUSDT = targetUSDT - currentUSDT;
      let quantity = 0;

      if (needSellUSDT > 0) {
        quantity =
          needSellUSDT -
          sellList.reduce((acc, order) => acc + order.quantity, 0);
        sellList.push({
          price,
          quantity,
        });
        if (this.orderList.sell[price]) {
          const existingSellOrders = this.orderList.sell[price].reduce(
            (acc, order) =>
              acc + parseFloat(order.origQty) - parseFloat(order.executedQty),
            0
          );
          if (existingSellOrders < quantity) {
            toOrderList.push({
              side: 'SELL',
              symbol: 'USDC/USDT',
              quantity: quantity - existingSellOrders,
              price,
            });
          } else {
            let nowPriceTotal = 0;

            for (let i = 0; i < this.orderList.sell[price].length; i++) {
              nowPriceTotal =
                nowPriceTotal +
                parseFloat(this.orderList.sell[price][i].origQty) -
                parseFloat(this.orderList.sell[price][i].executedQty);
              if (nowPriceTotal >= quantity) {
                toCancelOrderList.push(this.orderList.sell[price][i]);
                nowPriceTotal =
                  nowPriceTotal -
                  parseFloat(this.orderList.sell[price][i].origQty) +
                  parseFloat(this.orderList.sell[price][i].executedQty);
              }
            }
          }
        } else {
          toOrderList.push({
            side: 'SELL',
            symbol: 'USDC/USDT',
            quantity,
            price,
          });
        }
      }
    }
  }

  placeOrder(toOrderList) {
    this.socket.emit(
      'createOrders',
      toOrderList.map((order) => ({ ...order, type: 'LIMIT' }))
    );
  }

  cancelOrder(toCancelOrderList) {
    this.socket.emit(
      'cancelOrders',
      toCancelOrderList.map((order) => ({
        orderId: order.orderId,
        symbol: order.symbol,
        price: order.price,
      }))
    );
  }
}
