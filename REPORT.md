# BTC swing bot — report

Competition: **btc-race-24h-20261117-0603** — "Race a BTC trading bot live for 24 hours"
(harness bars-replay/v1, cbBTC on Orca Whirlpool, $1,000 paper USDC, 1-min bars).
Entry: `main.ts` (Node 22) + vendored SDK `vendor/makefun-bars.ts`. No network, no
clock, no files, no randomness; all arithmetic is BigInt, so the same bars
always give the same orders.

## Strategy: selective dip-buying, long only, one position

- **Regime:** 90-bar simple moving average of closes. Only buy when the
  average is not falling (it is at or above the close 91 bars ago, within 0.1%).
- **Entry:** when flat and the close is at least **0.55%** below the 90-bar
  average, buy with all cash.
- **Exit:** sell the whole position when it is worth **1.4%** over its cost
  (take-profit) or **1.0%** under it (stop-loss).
- **Why so few trades:** a full-size round trip costs ~26-37 bps in fee (4 bps),
  slippage (2 bps) and price impact, so a trade must catch a move larger than
  that. On this window every frequent-trading family loses: EMA-cross -31 to
  -109, Bollinger -16 to -91, Donchian -8 to -64, RSI -23 to -83 (all in $).
  Only rare, high-conviction dip trades survive the cost.

## Dev-window result (frozen 24h, 1,440 bars) — official kit grade-local

| metric | value |
|---|---|
| net PnL | **+$25.50** (+2.55%) |
| trades | 4 (2 round trips + 1 flatten) |
| fees | $1.62 |
| max drawdown | 1.32% (limit 25%) |
| Sharpe | 0.035 |
| exposure | 0.49 |
| l1 reproduced | true (deterministic) |
| dev gate (`dev_profitable`) | **PASS** — net PnL > $0 |

Verified with the kit's own grader (`grade-local --driver process`), which
reproduces the independent backtester bit-for-bit (+$25.50, 4 trades, 1.32% DD).
Result sha256: `624f3b2e08eceb47726b751008723f57e84c1893aa0d7a842f9ca58108eea276`.

Trades on the dev window: bought the dip at bar 364 (~$64,316), sold at bar 511
(~$65,013); bought again at bar 550 (~$64,537), sold at bar 947 (~$65,277);
bought a third dip at bar 1056 (~$64,957), flattened at the close (~$64,690).

## Parameters (chosen on a plateau, not a peak)

| parameter | value |
|---|---|
| slow average | 90 bars |
| dip below average | 0.55% |
| take-profit | 1.4% over cost |
| stop-loss | 1.0% under cost |
| regime (average not falling) | within 0.1% of the close 91 bars ago |
| max slippage | 100 bps (1%) |

Neighbouring settings all profit on the dev window, so the result is not a
single-point fluke: slow 60/90/120/180 give +$19.89 / +$25.50 / +$12.90 /
+$21.02; dip 0.5%/0.6% give +$25.50 / +$26.44; take-profit 1.3%/1.4%/1.5% give
+$23.03 / +$25.50 / +$25.50. A z-score entry variant also profits (+$10.56),
confirming the dip-buying edge is real. Robustness split: first half of the
window +$18.11, second half $0 (no trades — the regime filter kept it out of a
falling average, so it lost nothing there).

## What the live race can do

The live 24h window is a different day, so the dev P&L is **not** a promise.
The bot's protection is structural, not tuned: at most one position, a 1%
stop-loss per trade, the regime filter that refuses to buy into a falling
average, and a 25% drawdown guardrail it never approached (1.32% on dev).
In a strong downtrend it should lose at most a couple of 1% stops; in an
uptrend or a choppy range it buys dips and sells rallies. It will not blow up
on a bad day — the worst realistic live outcome is a small loss, not a wipeout.

## Files

- `main.ts` — the bot (entrypoint).
- `vendor/makefun-bars.ts` — the kit SDK, vendored byte-for-byte.
- `LICENSE` — MIT, copyright 2026 a2aji.
- `README.md` — project readme.
- `REPORT.md` — this file.
