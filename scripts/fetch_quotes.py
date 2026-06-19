"""Generate public/quotes.json via FinanceDataReader / pykrx."""

from __future__ import annotations

from datetime import datetime

from kr_data import PUBLIC, die, load_listing_quotes, write_json


def main() -> None:
    trade_date, quotes = load_listing_quotes()
    payload = {
        "updatedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "tradeDate": trade_date,
        "source": "finance-datareader,pykrx",
        "quotes": quotes,
    }
    out = PUBLIC / "quotes.json"
    write_json(out, payload)
    print(f"Wrote {len(quotes)} quotes to {out} (trade date {trade_date})")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        die(str(exc))
