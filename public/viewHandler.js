// const webSocketHandler = require('../utils/webSocket.js');

import ModelHandler from '../model/modelHandler.js';
import CCXTClientHandler from '../utils/ccxtClient.js';
const ccxtClientHandler = new CCXTClientHandler();
// import { WebSocketHandler } from '../utils/webSocket.js';
// const webSocketHandler = WebSocketHandler.getInstance();
const modelHandler = new ModelHandler();
// document
//   .getElementById('subscribeButtonId')
//   .addEventListener('click', async (e) => {
//     e.preventDefault();
//     const selectedPair = document.getElementById('tradingPairId').value;
//     webSocketHandler.subscribeSpotPair(selectedPair);
//     modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });

//     const result = await fetch('/api/getAccount').then((res) => {
//       return res.json();
//     });

//     const orderResult = await fetch(
//       `/api/order?symbol=${ModelHandler.activeSpotPair}`
//     ).then((res) => {
//       return res.json();
//     });
//     setTimeout(() => {
//       ModelHandler.setWalletBalances(result, orderResult);
//     }, 1000);
//   });

// document.getElementById('TESTButtonId').addEventListener('click', async (e) => {
//   e.preventDefault();
//   const result = await fetch(`/test`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       test: 'test',
//     }),
//   }).then((res) => {
//     return res.json();
//   });
//   console.log('TESTButtonId', result);
// });
const viewHandler = async () => {
  try {
    console.log('Running viewHandler');
    const selectedPair = 'USDCUSDT';

    ccxtClientHandler.subscribeSpotPair(selectedPair);
    modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });

    const accountResult = await fetch('/api/getAccount').then((res) =>
      res.json()
    );
    const orderResult = await fetch(
      `/api/order?symbol=${modelHandler.activeSpotPair}`
    ).then((res) => res.json());

    modelHandler.setWalletBalances(accountResult, orderResult);
  } catch (error) {
    console.error('Error in viewHandler:', error);
  }
};
viewHandler();
