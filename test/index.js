import ccxt from 'ccxt';
import { pro as ccxtpro } from 'ccxt';
const apikey =
  'pbNQVytQtV3UPRRNUGiUXqBL5lwGTQ0XEAq8tqviauX1zmK0jtIEVUzro9mvUeeq';
const secret =
  'IrvOAwLXEw9AznaYYTGne9Pf1scisFtjjS59wAUJG46FgVXIGLatjYPq0NXPPTbk';
let binance = new ccxt.binance({
  apiKey: apikey,
  secret: secret,
});
let binancepro = new ccxtpro.binance({
  apiKey: apikey,
  secret: secret,
  verbose: true,
});

binance.setSandboxMode(true);
binancepro.setSandboxMode(true);
// (async () => {
//   try {
//     while (true) {
//       // const priceUsdCUsdT = await binancepro.fetchTicker('USDC/USDT');
//       // const price = priceUsdCUsdT.last;

//       let order = await binancepro.createOrderWs(
//         'USDC/USDT',
//         'market',
//         'buy',
//         8
//       );
//       console.log(order.status, order.datetime, 'Order Hogya', order.price);

//       if ((order.status = 'close')) {
//         const balance = await binance.fetchBalance();
//         console.log('Buy hogya');
//         console.log(balance.USDT.free, balance.USDC.free);
//       } else {
//         console.log('Order not filled');
//       }

//       await new Promise((resolve) => setTimeout(resolve, 5000));
//       //     console.log(order);
//       //   } else {
//       //     console.log('Insufficient balance to meet the minimum notional value.');
//       //   }
//     }
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// })();

// (async () => {
//   try {
//     while (true) {
//       // const watchbalance = await binance.fetchBalance();
//       // console.log(watchbalance.USDT, watchbalance.USDC);
//       const data = await binancepro.watchOrderBook('USDC/USDT');
//       const { bids: buyList, asks: sellList } = data;

//       console.log(`Bids & Asks:  ${new Date().toLocaleString()}`);
//       console.log(buyList, sellList);
//       // Optional delay for demonstration purposes
//       // await new Promise((resolve) => setTimeout(resolve, 1000));
//     }

//     // const orderBook = await binancepro.fetchOrderBook('USDC/USDT');
//     // console.log(orderBook, 'at', new Date().toLocaleTimeString());
//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// })();
(async () => {
  try {
    // const watchbalance = await binance.fetchBalance();
    // console.log(watchbalance.USDT, watchbalance.USDC);
    const data = await binancepro.watchOrderBook('USDC/USDT');
    const { bids: buyList, asks: sellList } = data;
    console.log(`Bids & Asks:  ${new Date().toLocaleString()}`);
    console.log(buyList, sellList);

    // Optional delay for demonstration purposes
    // await new Promise((resolve) => setTimeout(resolve, 1000));console.log('Selected code is empty, adding logs to

    // const orderBook = await binancepro.fetchOrderBook('USDC/USDT');
    // console.log(orderBook, 'at', new Date().toLocaleTimeString());
  } catch (error) {
    console.error('Error:', error.message);
  }
})();
