import CCXTClientHandler from '../utils/ccxtClient.js';
import ModelHandler from '../model/modelHandler.js';

const ccxtClientHandler = CCXTClientHandler.getInstance();
const modelHandler = ModelHandler.getInstance();
alert(location);
console.log(location);
const socket = io();
socket.on('connection', (data) => {
  console.log(data);
});

document
  .getElementById('subscribeButtonId')
  .addEventListener('click', async (e) => {
    e.preventDefault();

    const selectedPair = document.getElementById('tradingPairId').value;
    ccxtClientHandler.subscribeSpotPair(selectedPair);
    modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });
  });

document.getElementById('TESTButtonId').addEventListener('click', async (e) => {
  // e.preventDefault();
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
  // console.log("TESTButtonId", result);
});

(async () => {
  setTimeout(async () => {
    const selectedPair = document.getElementById('tradingPairId').value;
    ccxtClientHandler.subscribeSpotPair(selectedPair);
    modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });

    const subscribeButton = document.getElementById('subscribeButtonId');
    subscribeButton.addEventListener('click', async (e) => {
      socket.emit('subscribeAccount');
    });
  }, 500);
})();
