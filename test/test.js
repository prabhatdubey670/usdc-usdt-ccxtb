import ccxt from 'ccxt';
const apiKey =
  'pbNQVytQtV3UPRRNUGiUXqBL5lwGTQ0XEAq8tqviauX1zmK0jtIEVUzro9mvUeeq';
const secret =
  'IrvOAwLXEw9AznaYYTGne9Pf1scisFtjjS59wAUJG46FgVXIGLatjYPq0NXPPTbk';

const exchange = new ccxt.binance({
  apiKey: apiKey,
  secret: secret,
  enableRateLimit: true,
});

// Set the sandbox mode
exchange.setSandboxMode(true);

const placeOrder = async () => {
  try {
    // Fetch account balances to check available USDT balance
    const balance = await exchange.fetchBalance();
    const usdtBalance = balance.total.USDT || 0; // Get the total USDT balance

    console.log(`Available USDT balance: ${usdtBalance}`);

    // Get the current market price of USDT/USDC (or any other pair you want to sell USDT for)
    const ticker = await exchange.fetchTicker('USDT/USDC');
    const marketPrice = ticker.last; // Last trade price (current market price)
    console.log(`Current market price for USDT/USDC: ${marketPrice}`);

    // Calculate the amount of USDT to sell for $7,597
    const usdValue = 7597;
    const amountToSell = usdValue / marketPrice; // Amount of USDT to sell
    console.log(`Amount of USDT to sell: ${amountToSell}`);

    // Check if we have enough USDT balance to sell
    if (usdtBalance >= amountToSell) {
      // Create a market sell order
      const order = await exchange.createMarketSellOrder(
        'USDT/USDC',
        amountToSell
      );
      console.log('Order placed:', order);
    } else {
      console.log('Insufficient USDT balance to place the order');
    }
  } catch (error) {
    console.error('Error placing order:', error);
  }
};

// placeOrder();
const getAccount = async () => {
  const balance = await exchange.fetchBalance();
  const usdt = balance.total.USDT || 0;
  const usdc = balance.total.USDC || 0;
  console.log(usdt, 'USDT');
  console.log(usdc, 'USDC');
  console.log('total', usdc + usdt);
};
getAccount();
