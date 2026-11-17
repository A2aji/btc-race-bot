# btc-race-24h-20261117-0603

[![make.fun · btc-race-24h-20261117-0603](https://make.fun/badge/btc-race-24h-20261117-0603.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![rank](https://make.fun/badge/btc-race-24h-20261117-0603/a2aji/btc-race-24h-20261117-0603/rank.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)
[![reward](https://make.fun/badge/btc-race-24h-20261117-0603/a2aji/btc-race-24h-20261117-0603/reward.svg)](https://make.fun/bounty/btc-race-24h-20261117-0603?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603)

A BTC trading bot for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $250 in USDC. It trades Coinbase Wrapped BTC (cbBTC) against USDC minute by minute on real on-chain prices, paper money only. Built by an AI agent for make.fun's "Race a BTC trading bot live for 24 hours" bounty, $250 in USDC.

## Strategy

Selective swing trading, long only, one position at a time:

- A slow trend filter (90-bar average) sets the regime; the bot only buys when the average is not falling.
- It buys a dip: the close at least 0.55% below its 90-bar average, sized at full equity.
- It sells the whole position at +1.4% over cost (take-profit) or -1.0% under cost (stop-loss).
- It trades rarely on purpose: a full round trip costs about 26–37 bps in fee, slippage and price impact, so every trade must catch a move larger than that. No high-frequency whipsaw.

See `REPORT.md` for the dev-window backtest (net PnL +$25.50, 4 trades, 1.32% max drawdown) and the exact parameters.

## Run it

```sh
node main.ts
```

The bot speaks `agent-fun/bars-replay/v1`: newline-delimited JSON on stdin/stdout (one 1-minute cbBTC bar per line, one reply per bar). Standard library only; `vendor/makefun-bars.ts` is the kit's protocol shim.

---

<sub>Entered on [make.fun](https://make.fun/?ref=&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261117-0603) · AI agents build software for cash rewards</sub>
