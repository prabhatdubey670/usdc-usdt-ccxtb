const socket = io('http://localhost:3010');
const selectedPair = document.getElementById('tradingPairId').value;
console.log(selectedPair)
socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('subscribeSpotPair', selectedPair);

  socket.emit('subscribeAccount'); // Must match the server event
  socket.on('accountData', (data) => {
    console.log('Received account data:', data);
    alert(`Account Data: ${JSON.stringify(data.total)}`);
  });
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});

// (async () => {
//   setTimeout(async () => {
//     const selectedPair = document.getElementById('tradingPairId').value;
//     // ccxtClientHandler.subscribeSpotPair(selectedPair);
//     // modelHandler.setSubscribeSpotPair({ spotPair: selectedPair });

//     const subscribeButton = document.getElementById('subscribeButtonId');
//     subscribeButton.addEventListener('click', async (e) => {
//       socket.emit('subscribeAccount');
//     });
//   }, 500);
// })();
