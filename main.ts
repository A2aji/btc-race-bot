/**
 * BTC swing bot for make.fun btc-race-24h-20261117-0603 (bars-replay/v1).
 *
 * Strategy: selective dip-buying, long only, one position at a time.
 *   - Regime: a 90-bar simple moving average of closes. Only buy when the
 *     average is not falling (it is at or above the close 91 bars ago, within
 *     0.1%).
 *   - Entry: when flat and the close is at least 0.55% below the 90-bar
 *     average, buy with all cash.
 *   - Exit: sell the whole position when it is worth 1.4% over its cost
 *     (take-profit) or 1.0% under it (stop-loss).
 *   - Trades rarely on purpose: a full round trip costs ~26-37 bps in fee,
 *     slippage and price impact, so every trade must catch a move larger than
 *     that. No high-frequency whipsaw.
 *
 * All arithmetic is BigInt (closes, sums and values are integers), so the
 * same bars always give the same orders. No clock, no network, no files, no
 * randomness.
 *
 * Dev-window backtest (frozen 24h, 1,440 bars, verified with the kit's
 * grade-local): net PnL +$25.50, 4 trades, max drawdown 1.32%.
 */

import { runBars } from './vendor/makefun-bars.ts';
import type { BarsState, Batch, OrderInput } from './vendor/makefun-bars.ts';

const SYMBOL = 'CBBTC';

// Strategy parameters (see REPORT.md for how they were chosen).
const SLOW_BARS = 90; // slow average window (bars)
const DIP_BPS = 55n; // buy when close is this many bps below the slow average
const TP_BPS = 140n; // sell when the position is this many bps over its cost
const STOP_BPS = 100n; // sell when the position is this many bps under its cost
const REGIME_BPS = 10n; // slow average must be within this many bps of the close
// 91 bars ago (i.e. not falling)
const MAX_SLIPPAGE_BPS = 100; // 1% past the close the order was decided on
const BPS = 10_000n;

// Close history (bigint, price raw units, price_scale 5).
const closes: bigint[] = [];

function onBatch(state: BarsState, batch: Batch): OrderInput[] {
  // Only the CBBTC bar of this batch matters; a batch without one is a gap.
  const bar = batch.bars.find((b) => b.symbol === SYMBOL);
  if (bar === undefined) return [];
  closes.push(BigInt(bar.c));
  if (state.warmingUp) return [];

  const held = state.positions.get(SYMBOL);
  if (held === undefined) {
    // Flat: look for a dip to buy.
    if (closes.length < SLOW_BARS + 2) return [];
    const w = closes.slice(-SLOW_BARS);
    if (w.length < SLOW_BARS) return [];
    let total = 0n;
    for (const c of w) total += c;
    const close = closes[closes.length - 1];
    // close < average * (1 - DIP_BPS/10000), in integers:
    //   close * SLOW_BARS * 10000 < total * (10000 - DIP_BPS)
    if (close * BigInt(SLOW_BARS) * BPS >= total * (BPS - DIP_BPS)) return [];
    // Regime: average not falling: average >= close 91 bars ago * (1 - 0.1%).
    //   total / SLOW_BARS >= closes[-SLOW_BARS-1] * (10000 - REGIME_BPS) / 10000
    const oldClose = closes[closes.length - SLOW_BARS - 1];
    if (total * BPS < oldClose * (BPS - REGIME_BPS) * BigInt(SLOW_BARS)) return [];
    const cash = state.cash;
    if (cash < BigInt(state.hello.fees.min_notional_quote_units)) return [];
    return [
      {
        side: 'buy',
        symbol: SYMBOL,
        notional_quote_units: cash,
        max_slippage_bps: MAX_SLIPPAGE_BPS,
      },
    ];
  }

  // Holding: take-profit or stop-loss on the position's value vs its cost.
  const value = state.value(SYMBOL, held.qty);
  const cost = held.cost;
  if (cost <= 0n) return [];
  // value >= cost * (1 + TP_BPS/10000)  ->  value * 10000 >= cost * (10000 + TP_BPS)
  if (value * BPS >= cost * (BPS + TP_BPS)) {
    return [
      {
        side: 'sell',
        symbol: SYMBOL,
        qty: held.qty,
        max_slippage_bps: MAX_SLIPPAGE_BPS,
      },
    ];
  }
  // value <= cost * (1 - STOP_BPS/10000)  ->  value * 10000 <= cost * (10000 - STOP_BPS)
  if (value * BPS <= cost * (BPS - STOP_BPS)) {
    return [
      {
        side: 'sell',
        symbol: SYMBOL,
        qty: held.qty,
        max_slippage_bps: MAX_SLIPPAGE_BPS,
      },
    ];
  }
  return [];
}

await runBars({ onBatch });
