"""Generate public/us-quotes.json for symbols in us-watchlist.json."""

from __future__ import annotations

import sys
from datetime import datetime

from us_data import PUBLIC, die, fetch_latest_quote, is_valid_close, load_watchlist, write_json


def main() -> None:
    symbols = load_watchlist()
    if not symbols:
        die("us-watchlist.json is empty")

    quotes: dict[str, dict[str, str | float]] = {}
    trade_date = datetime.now().strftime("%Y-%m-%d")
    for symbol in symbols:
        try:
            quote_date, close = fetch_latest_quote(symbol)
            if not is_valid_close(close):
                print(f"Skip {symbol}: invalid close {close}", file=sys.stderr)
                continue
            trade_date = quote_date
            quotes[symbol] = {"close": close, "tradeDate": quote_date}
        except Exception as err:
            print(f"Skip {symbol}: {err}", file=sys.stderr)

    if not quotes:
        die("No US quotes generated")

    payload = {
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "tradeDate": trade_date,
        "source": "finance-datareader",
        "currency": "USD",
        "quotes": quotes,
    }
    write_json(PUBLIC / "us-quotes.json", payload)
    print(f"Wrote {len(quotes)} US quotes")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        die(str(exc))
