// const webSocketHandler = require('../utils/webSocket.js');
// const modelHandler = require('../model/modelHandler.js');
const socket = io();

import { ModelHandler } from '../model/modelHandler.js';
import { WebSocketHandler } from '../utils/webSocket.js';
const webSocketHandler = WebSocketHandler.getInstance();
const modelHandler = ModelHandler.getInstance();
document
  .getElementById('subscribeButtonId')
  .addEventListener('click', async (e) => {
    e.preventDefault();
    const selectedPair = document.getElementById('tradingPairId').value;
    webSocketHandler.subscribeSpotPair(selectedPair);
    modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });

    const result = await fetch('/api/getAccount').then((res) => {
      return res.json();
    });

    const orderResult = await fetch(
      `/api/order?symbol=${ModelHandler.activeSpotPair}`
    ).then((res) => {
      return res.json();
    });
    setTimeout(() => {
      ModelHandler.setWalletBalances(result, orderResult);
    }, 1000);
  });

document.getElementById('TESTButtonId').addEventListener('click', async (e) => {
  e.preventDefault();
  const result = await fetch(`/test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      test: 'test',
    }),
  }).then((res) => {
    return res.json();
  });
  console.log('TESTButtonId', result);
});

(async () => {
  setTimeout(async () => {
    console.log('Running');
    const selectedPair = document.getElementById('tradingPairId').value;
    webSocketHandler.subscribeSpotPair(selectedPair);
    modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });

    const result = await fetch('/api/getAccount').then((res) => {
      return res.json();
    });

    const orderResult = await fetch(
      `/api/order?symbol=${ModelHandler.activeSpotPair}`
    ).then((res) => {
      return res.json();
    });
    setTimeout(() => {
      modelHandler.setWalletBalances(result, orderResult);
    }, 1000);
  }, 500);
})();
