## How It Works

The bot's core logic is simple yet effective: it buys USDT when the price reaches **0.9999** and sells when it hits **1**. It operates within a spread of **0.9995 - 1.0005**, continuously making small trades and distributing your funds within this range. Each successful trade generates a small profit, and since the funds remain in MEXC, they also benefit from the exchange's flexible interest rates.

## How to Start Arbitrage Trading

1. Download the project and unzip it.
2. Download and install Node.js: [https://nodejs.org/](https://nodejs.org/)
3. Open the command prompt and navigate to the project folder.
4. Run the following commands:
   ```bash
   npm install
   npm start
   ```
5. Create an account on MEXC Exchange
6. Generate an API key and secret in your MEXC account.
7. Create a `.env` file in the project folder and add your API and Secret Keys like this:
   ```plaintext
   API_KEY=XXX
   SECRET_KEY=XXX
   ```
8. Run the following command to install dependencies:
   ```bash
   npm install
   ```
9. After installation, start the bot by running:
   ```bash
   npm start
   ```
   The bot will now start automating your USDT/USDC arbitrage trades.
