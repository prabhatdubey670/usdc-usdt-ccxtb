const ccxt = require('ccxt');

// MODEL: Handles data and trading logic
class ArbitrageModel {
    constructor(apiKey, secret) {
        this.exchange = new ccxt.binance({
            apiKey: apiKey,
            secret: secret,
        });
        this.pair = 'USDC/USDT';
        this.minTradeAmount = 0.9; // Minimum trade amount
    }

    async fetchPrice() {
        try {
            const ticker = await this.exchange.fetchTicker(this.pair);
            return ticker.last; // Current price of the pair
        } catch (err) {
            throw new Error(Failed to fetch price: ${err.message});
        }
    }

    async executeTrade(type, amount) {
        try {
            if (type === 'buy') {
                return await this.exchange.createMarketBuyOrder(this.pair, amount);
            } else if (type === 'sell') {
                return await this.exchange.createMarketSellOrder(this.pair, amount);
            }
        } catch (err) {
            throw new Error(Failed to execute ${type} order: ${err.message});
        }
    }
}

// VIEW: Handles user interaction/output
class ArbitrageView {
    static logMessage(message) {
        console.log([${new Date().toISOString()}] ${message});
    }

    static displayError(error) {
        console.error([${new Date().toISOString()}] ERROR: ${error});
    }
}

// CONTROLLER: Coordinates between Model and View
class ArbitrageController {
    constructor(apiKey, secret) {
        this.model = new ArbitrageModel(apiKey, secret);
        this.interval = null;
    }

    async monitorMarket() {
        try {
            const price = await this.model.fetchPrice();
            ArbitrageView.logMessage(Current price of ${this.model.pair}: ${price});

            if (price < 0.995) {
                ArbitrageView.logMessage('Price below 0.995, attempting to buy...');
                const result = await this.model.executeTrade('buy', this.model.minTradeAmount);
                ArbitrageView.logMessage(Buy order executed: ${JSON.stringify(result)});
            } else if (price > 1.0) {
                ArbitrageView.logMessage('Price above 1.000, attempting to sell...');
                const result = await this.model.executeTrade('sell', this.model.minTradeAmount);
                ArbitrageView.logMessage(Sell order executed: ${JSON.stringify(result)});
            } else {
                ArbitrageView.logMessage('Price within neutral range, no action taken.');
            }
        } catch (error) {
            ArbitrageView.displayError(error.message);
        }
    }

    startMonitoring(intervalMs) {
        ArbitrageView.logMessage('Starting market monitoring...');
        this.interval = setInterval(() => this.monitorMarket(), intervalMs);
    }

    stopMonitoring() {
        ArbitrageView.logMessage('Stopping market monitoring...');
        clearInterval(this.interval);
    }
}

// MAIN PROGRAM: Instantiate and start the bot
const apiKey = 'YOUR_BINANCE_API_KEY';
const secret = 'YOUR_BINANCE_API_SECRET';
const arbitrageBot = new ArbitrageController(apiKey, secret);

// Start monitoring every 5 seconds
arbitrageBot.startMonitoring(5000);

// Stop the bot after 1 hour (optional)
setTimeout(() => arbitrageBot.stopMonitoring(), 60 * 60 * 1000);