"""Generate or update public/ohlcv/{code}.json using FinanceDataReader / pykrx."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path

from kr_data import OHLCV_DIR, PUBLIC, die, fetch_history_closes, write_json, ymd_to_iso


def load_stock_codes() -> list[str]:
    stocks_path = PUBLIC / "stocks.json"
    if not stocks_path.exists():
        die("public/stocks.json not found. Run generate_stocks.py first.")
    stocks = json.loads(stocks_path.read_text(encoding="utf-8"))
    return [item["code"] for item in stocks]


def write_ohlcv(code: str, closes: dict[str, int]) -> None:
    payload = {"code": code, "closes": closes}
    write_json(OHLCV_DIR / f"{code}.json", payload)


def generate_one(code: str, years: int) -> None:
    end = datetime.now()
    start = end - timedelta(days=365 * years)
    closes = fetch_history_closes(code, start.strftime("%Y%m%d"), end.strftime("%Y%m%d"))
    if not closes:
        print(f"Skip {code}: no OHLCV data")
        return
    write_ohlcv(code, closes)
    print(f"Wrote ohlcv/{code}.json ({len(closes)} days)")


def append_latest_day(ymd: str | None = None) -> None:
    from pykrx import stock

    from kr_data import latest_trading_ymd

    trade_ymd = ymd or latest_trading_ymd()
    iso = ymd_to_iso(trade_ymd)
    df = stock.get_market_ohlcv(trade_ymd, market="ALL")
    if df is None or df.empty:
        die(f"No OHLCV for {trade_ymd}")

    updated = 0
    for code in df.index:
        path = OHLCV_DIR / f"{code}.json"
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
        else:
            data = {"code": str(code), "closes": {}}
        data["closes"][iso] = int(df.loc[code, "종가"])
        write_json(path, data)
        updated += 1

    print(f"Updated {updated} ohlcv files for {iso}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--code", help="Single stock code")
    parser.add_argument("--years", type=int, default=10, help="History length for backfill")
    parser.add_argument("--batch", type=int, default=0)
    parser.add_argument("--batches", type=int, default=1)
    parser.add_argument("--append-latest", action="store_true")
    args = parser.parse_args()

    OHLCV_DIR.mkdir(parents=True, exist_ok=True)

    if args.append_latest:
        append_latest_day()
        return

    if args.code:
        generate_one(args.code, args.years)
        return

    codes = load_stock_codes()
    if args.batches > 1:
        chunk_size = (len(codes) + args.batches - 1) // args.batches
        start = args.batch * chunk_size
        codes = codes[start : start + chunk_size]

    print(f"Backfilling {len(codes)} codes (batch {args.batch}/{args.batches})")
    for code in codes:
        generate_one(code, args.years)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        die(str(exc))
