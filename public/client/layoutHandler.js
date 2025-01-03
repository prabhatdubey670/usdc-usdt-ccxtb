export default class LayoutHandler {
  constructor() {}

  static getInstance() {
    if (!LayoutHandler.instance) {
      LayoutHandler.instance = new LayoutHandler();
    }
    return LayoutHandler.instance;
  }

  updateActiveSpotPair(spotPair) {
    let tabs = document.getElementsByClassName('spot-pair-tab');
    for (let tab of tabs) {
      tab.classList.toggle('active', false);
    }

    document.getElementById(spotPair).classList.toggle('active', true);
  }

  updateSpotPairTab({ spotPairKeyList }) {
    const spotPairTabIdElement = document.getElementById('spotPairTabId');
    spotPairTabIdElement.innerHTML = '';

    spotPairKeyList.forEach((spotPair) => {
      const spotPairTab = document.createElement('div');
      spotPairTab.id = spotPair;
      spotPairTab.classList.add('spot-pair-tab');
      spotPairTab.innerText = spotPair;

      spotPairTabIdElement.appendChild(spotPairTab);
    });
  }

  updateSpotPairPrice({ spotPairPrice }) {
    const { buyList, sellList } = spotPairPrice;
    const spotPairPriceListElement = document.getElementById(
      'spotPairPriceListId'
    );

    spotPairPriceListElement.innerHTML = '';

    const sellListElement = document.createElement('div');
    sellListElement.classList.add('sell');

    const buyListElement = document.createElement('div');
    buyListElement.classList.add('buy');

    // Reverse sell list to show highest price first
    sellList.reverse().forEach((sell) => {
      const sellElement = document.createElement('div');
      sellElement.innerText = `${sell.p} - ${sell.v}`;
      sellListElement.appendChild(sellElement);
    });

    // Display buy list
    buyList.forEach((buy) => {
      const buyElement = document.createElement('div');
      buyElement.innerText = `${buy.p} - ${buy.v}`;
      buyListElement.appendChild(buyElement);
    });

    // Append the elements to the UI
    spotPairPriceListElement.appendChild(sellListElement);
    spotPairPriceListElement.appendChild(buyListElement);
  }

  updateWalletBalances(
    { usdtBalance, pairBalance },
    { sell: sellList, buy: buyList }
  ) {
    // Update balance display
    document.getElementById('totalCoinId').innerText = usdtBalance.total;
    document.getElementById('usdtBalanceSpotId').style.width = `${
      (parseFloat(usdtBalance.usdtTotal) / usdtBalance.total) * 100
    }%`;

    document.getElementById('usdtWalletSpotId').style.width = `${
      (parseFloat(usdtBalance.usdtTotal) / usdtBalance.total) * 100
    }%`;

    document.getElementById('pairBalanceSpotId').style.width = `${
      (parseFloat(pairBalance.pairTotal) / pairBalance.total) * 100
    }%`;
    document.getElementById('pairWalletSpotId').style.width = `${
      (parseFloat(pairBalance.pairTotal) / pairBalance.total) * 100
    }%`;

    // Update Locked balances
    document.getElementById('usdtBalanceLockedId').style.width = `${
      (parseFloat(usdtBalance.locked) / usdtBalance.usdtTotal) * 100
    }%`;
    document.getElementById('usdtWalletLockedId').style.width = `${
      (parseFloat(usdtBalance.locked) / usdtBalance.usdtTotal) * 100
    }%`;

    document.getElementById('pairBalanceLockedId').style.width = `${
      (parseFloat(pairBalance.locked) / pairBalance.pairTotal) * 100
    }%`;
    document.getElementById('pairWalletLockedId').style.width = `${
      (parseFloat(pairBalance.locked) / pairBalance.pairTotal) * 100
    }%`;

    // Display sell and buy orders
    this.updateOrdersList(sellList, buyList, pairBalance, usdtBalance);
  }

  updateOrdersList(sellList, buyList, pairBalance, usdtBalance) {
    const sellListElement = document.getElementById('pairBalanceLockedId');
    const buyListElement = document.getElementById('usdtBalanceLockedId');

    sellListElement.innerHTML = '';
    buyListElement.innerHTML = '';

    Object.keys(sellList)
      .sort()
      .forEach((price, index) => {
        const sellElement = document.createElement('div');
        const percentage =
          (parseFloat(
            sellList[price].reduce(
              (pre, cur) => pre + parseFloat(cur.origQty),
              0
            )
          ) /
            parseFloat(pairBalance.locked)) *
          100;

        sellElement.innerText = `${price} - ${sellList[price].reduce(
          (pre, cur) => pre + parseFloat(cur.origQty),
          0
        )} - ${percentage}% - ${sellList[price].length}`;
        sellElement.style.width = `${percentage}%`;
        sellElement.style.backgroundColor = `rgba(255,0,0, ${
          (index + 1) / Object.keys(sellList).length
        })`;
        sellListElement.appendChild(sellElement);
      });

    Object.keys(buyList)
      .sort()
      .forEach((price, index) => {
        const buyElement = document.createElement('div');
        const percentage =
          (parseFloat(
            buyList[price].reduce(
              (pre, cur) => pre + parseFloat(cur.origQty),
              0
            )
          ) /
            parseFloat(usdtBalance.locked)) *
          100;

        buyElement.innerText = `${price} - ${buyList[price].reduce(
          (pre, cur) => pre + parseFloat(cur.origQty),
          0
        )} - ${percentage}% - ${buyList[price].length}`;
        buyElement.style.width = `${percentage}%`;
        buyElement.style.backgroundColor = `rgba(0,255,0, ${
          (Object.keys(buyList).length - index) / Object.keys(buyList).length
        })`;
        buyListElement.appendChild(buyElement);
      });

    // Code below is used to display the amount on the screen
    this.updateBalanceDisplay(usdtBalance, pairBalance);
  }

  updateBalanceDisplay(usdtBalance, pairBalance) {
    document.getElementById('usdtWalletFreeId').innerText =
      usdtBalance.free <= 0.0001
        ? 'NA'
        : parseFloat(usdtBalance.free).toFixed(4);
    document.getElementById('usdtWalletLockedId').innerText =
      usdtBalance.locked <= 0.0001
        ? 'NA'
        : parseFloat(usdtBalance.locked).toFixed(4);
    document.getElementById('pairWalletFreeId').innerText =
      pairBalance.free <= 0.0001
        ? 'NA'
        : parseFloat(pairBalance.free).toFixed(4);
    document.getElementById('pairWalletLockedId').innerText =
      pairBalance.locked <= 0.0001
        ? 'NA'
        : parseFloat(pairBalance.locked).toFixed(4);
  }
}

