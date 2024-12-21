//

export default class LayoutHandler {
  constructor() {
    console.log('Initializing LayoutHandler');

    // Initialize Socket.IO client
    this.socket = io('http://localhost:3010');

    // Listen for server updates
    this.initializeSocketListeners();
  }

  static getInstance() {
    if (!LayoutHandler.instance) {
      LayoutHandler.instance = new LayoutHandler();
    }
    return LayoutHandler.instance;
  }

  /**
   * Initialize Socket.IO event listeners
   */
  initializeSocketListeners() {
    // Listen for wallet balance updates
    this.socket.on('updateData', ({ walletBalances, orderList }) => {
      console.log('Received updateData:', { walletBalances, orderList });
      this.updateWalletBalances(walletBalances, orderList);
    });

    // Listen for subscription confirmation from the server
    this.socket.on('subscribedPair', (data) => {
      console.log('Subscribed to pair:', data);
      // Optional: Update the UI with success or provide user feedback
      alert(`Successfully subscribed to pair: ${data.tradingPair}`);
    });

    // Handle connection errors
    this.socket.on('connect_error', (err) => {
      console.error('Socket.IO connection error:', err);
      alert('Connection Error');
    });

    // Handle disconnection events
    this.socket.on('disconnect', () => {
      console.log('Disconnected from the server');
    });
  }

  /**
   * Send subscription request to the server
   * @param {string} tradingPair - The trading pair to subscribe to
   */
  subscribeToPair(tradingPair) {
    console.log('Subscribing to trading pair:', tradingPair);
    this.socket.emit('subscribePair', { tradingPair });

    // Listen for any acknowledgment from the server
    this.socket.once('subscribedPair', (data) => {
      console.log('Subscription confirmed:', data);
      // Optionally update UI or notify user on successful subscription
      alert(`Successfully subscribed to ${tradingPair}`);
    });
  }

  /**
   * Update active spot pair in the UI
   * @param {string} spotPair - The active spot pair
   */
  updateActiveSpotPair(spotPair) {
    const tabs = document.getElementsByClassName('spot-pair-tab');
    for (const tab of tabs) {
      tab.classList.remove('active'); // Remove active class from all tabs
    }

    const activeTab = document.getElementById(spotPair);
    if (activeTab) {
      activeTab.classList.add('active'); // Add active class to the clicked tab
    }
  }

  /**
   * Update spot pair tabs
   * @param {Object} param - Parameters containing spot pair keys
   * @param {Array<string>} param.spotPairKeyList - List of spot pair keys
   */
  updateSpotPairTab({ spotPairKeyList }) {
    const spotPairTabElement = document.getElementById('spotPairTabId');
    spotPairTabElement.innerHTML = ''; // Clear existing tabs

    spotPairKeyList.forEach((spotPair) => {
      const spotPairTab = document.createElement('div');
      spotPairTab.id = spotPair;
      spotPairTab.classList.add('spot-pair-tab');
      spotPairTab.innerText = spotPair;

      spotPairTabElement.appendChild(spotPairTab);

      // Add click listener for each tab
      spotPairTab.addEventListener('click', () => {
        this.updateActiveSpotPair(spotPair);
      });
    });
  }

  /**
   * Update wallet balances and orders in the UI
   * @param {Object} walletBalances - Wallet balances data
   * @param {Object} orderList - Order list data
   */
  updateWalletBalances(walletBalances, orderList) {
    const { usdtBalance, pairBalance } = walletBalances;

    // Update wallet balance display
    document.getElementById('totalCoinId').innerText =
      usdtBalance.total || 'NA';
    document.getElementById('usdtWalletFreeId').innerText =
      usdtBalance.free?.toFixed(4) || 'NA';
    document.getElementById('usdtWalletLockedId').innerText =
      usdtBalance.locked?.toFixed(4) || 'NA';
    document.getElementById('pairWalletFreeId').innerText =
      pairBalance.free?.toFixed(4) || 'NA';
    document.getElementById('pairWalletLockedId').innerText =
      pairBalance.locked?.toFixed(4) || 'NA';

    // Update sell and buy order lists
    this.updateOrdersList(
      orderList.sell,
      orderList.buy,
      pairBalance,
      usdtBalance
    );
  }

  /**
   * Update orders list in the UI
   * @param {Object} sellList - Sell orders
   * @param {Object} buyList - Buy orders
   * @param {Object} pairBalance - Pair balance data
   * @param {Object} usdtBalance - USDT balance data
   */
  updateOrdersList(sellList, buyList, pairBalance, usdtBalance) {
    const sellListElement = document.getElementById('pairBalanceLockedId');
    const buyListElement = document.getElementById('usdtBalanceLockedId');

    sellListElement.innerHTML = '';
    buyListElement.innerHTML = '';

    // Render sell orders
    Object.keys(sellList)
      .sort()
      .forEach((price, index) => {
        const sellElement = document.createElement('div');
        sellElement.innerText = `${price} - ${sellList[price][0].origQty}`;
        sellElement.style.backgroundColor = `rgba(255,0,0,${
          (index + 1) / Object.keys(sellList).length
        })`;
        sellListElement.appendChild(sellElement);
      });

    // Render buy orders
    Object.keys(buyList)
      .sort()
      .forEach((price, index) => {
        const buyElement = document.createElement('div');
        buyElement.innerText = `${price} - ${buyList[price][0].origQty}`;
        buyElement.style.backgroundColor = `rgba(0,255,0,${
          (Object.keys(buyList).length - index) / Object.keys(buyList).length
        })`;
        buyListElement.appendChild(buyElement);
      });
  }
}
