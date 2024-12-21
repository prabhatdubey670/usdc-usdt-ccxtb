export default class ModelHandler {
  constructor(tradingBot, layoutHandler) {
    this.activeSpotPair = 'USDC/USDT';
    this.spotPairPrice = {};
    this.orderList = { sell: {}, buy: {} };
    this.walletBalances = {};
  }

  static getInstance(tradingBot, layoutHandler) {
    if (!ModelHandler.instance) {
      ModelHandler.instance = new ModelHandler(tradingBot, layoutHandler);
    }
    return ModelHandler.instance;
  }

  setActiveSpotPair(spotPair) {
    this.activeSpotPair = spotPair;
    this.layoutHandler.updateActiveSpotPair(spotPair); // Fixed reference
  }

  setSubscribeSpotPair({ spotPair }) {
    this.spotPairPrice[spotPair] = {};
    this.layoutHandler.updateSpotPairTab({
      spotPairKeyList: Object.keys(this.spotPairPrice),
    });
    this.setActiveSpotPair(spotPair);
  }

  setSpotPairPrice({ key, spotPairPrice }) {
    if (this.spotPairPrice[key]) {
      this.spotPairPrice[key] = spotPairPrice;
    } else {
      console.log('Spot pair not found');
    }
  }

  setWalletBalances(walletBalances, orderResult) {
    if (!walletBalances || !walletBalances.total) {
      console.error('Invalid wallet balance data received:', walletBalances);
      console.log(walletBalances.total);
      return;
    }

    const { total: balances } = walletBalances;
    // console.log('Balances:', balances); // Log the 'total' section of balances

    const activePair = 'USDC';

    const usdtBalance = balances.USDT || { free: 0, locked: 0 };
    const pairBalance = balances[activePair] || { free: 0, locked: 0 };

    const usdtTotal =
      parseFloat(usdtBalance?.free || 0) + parseFloat(usdtBalance?.locked || 0);
    const pairTotal =
      parseFloat(pairBalance?.free || 0) + parseFloat(pairBalance?.locked || 0);

    const total = usdtTotal + pairTotal;

    this.walletBalances = {
      usdtBalance: {
        ...usdtBalance,
        usdtTotal,
        pairTotal,
        total,
      },
      pairBalance: {
        ...pairBalance,
        usdtTotal,
        pairTotal,
        total,
      },
    };

    const buyOrderList = {};
    const sellOrderList = {};
    if (!Array.isArray(orderResult)) {
      console.warn(
        'Invalid orderResult received. Defaulting to an empty array.'
      );
      orderResult = [];
    }
    orderResult.forEach((orderList) => {
      if (orderList.side === 'BUY') {
        if (!buyOrderList[orderList.price]) {
          buyOrderList[orderList.price] = [];
        }
        buyOrderList[orderList.price].push(orderList);
      } else if (orderList.side === 'SELL') {
        if (!sellOrderList[orderList.price]) {
          sellOrderList[orderList.price] = [];
        }
        sellOrderList[orderList.price].push(orderList);
      }
    });

    this.orderList = { buy: buyOrderList, sell: sellOrderList };

    this.layoutHandler.updateWalletBalances(
      this.walletBalances,
      this.orderList
    );
    this.tradingBot.updateWalletOrderList(
      this.walletBalances,
      this.orderList,
      this.spotPairPrice
    );
  }
}
