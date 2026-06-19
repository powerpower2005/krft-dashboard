"""Generate public/us-ohlcv/{SYMBOL}.json and update us-watchlist.json."""

from __future__ import annotations

import argparse

from us_data import US_OHLCV_DIR, add_to_watchlist, die, fetch_history_closes, normalize_us_symbol, write_json


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--symbol", required=True)
    parser.add_argument("--years", type=int, default=10)
    args = parser.parse_args()

    symbol = normalize_us_symbol(args.symbol)
    if not symbol:
        die(f"Invalid symbol: {args.symbol}")

    closes = fetch_history_closes(symbol, args.years)
    out = US_OHLCV_DIR / f"{symbol}.json"
    write_json(out, {"symbol": symbol, "currency": "USD", "closes": closes})
    add_to_watchlist(symbol)
    print(f"Wrote us-ohlcv/{symbol}.json ({len(closes)} days)")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        die(str(exc))
