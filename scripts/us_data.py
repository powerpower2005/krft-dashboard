"""US market data helpers (FinanceDataReader)."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
US_OHLCV_DIR = PUBLIC / "us-ohlcv"
US_WATCHLIST_PATH = PUBLIC / "us-watchlist.json"


def die(message: str, code: int = 1) -> None:
    print(message, file=sys.stderr)
    sys.exit(code)


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def normalize_us_symbol(raw: str) -> str | None:
    symbol = raw.strip().upper()
    if re.fullmatch(r"[A-Z][A-Z0-9.\-]{0,9}", symbol):
        return symbol
    return None


def load_watchlist() -> list[str]:
    if not US_WATCHLIST_PATH.exists():
        return []
    data = json.loads(US_WATCHLIST_PATH.read_text(encoding="utf-8"))
    if not isinstance(data, list):
        return []
    return sorted({s for s in (normalize_us_symbol(x) for x in data) if s})


def save_watchlist(symbols: list[str]) -> None:
    normalized = sorted({s for s in (normalize_us_symbol(x) for x in symbols) if s})
    write_json(US_WATCHLIST_PATH, normalized)


def add_to_watchlist(symbol: str) -> None:
    symbols = load_watchlist()
    normalized = normalize_us_symbol(symbol)
    if not normalized:
        die(f"Invalid US symbol: {symbol}")
    if normalized not in symbols:
        symbols.append(normalized)
    save_watchlist(symbols)


def fetch_history_closes(symbol: str, years: int = 10) -> dict[str, float]:
    import FinanceDataReader as fdr

    end = datetime.now()
    start = end - timedelta(days=365 * years)
    df = fdr.DataReader(symbol, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    if df is None or df.empty:
        die(f"No US OHLCV data for {symbol}")

    closes: dict[str, float] = {}
    for idx, row in df.iterrows():
        closes[idx.strftime("%Y-%m-%d")] = round(float(row["Close"]), 4)
    return closes


def fetch_latest_quote(symbol: str) -> tuple[str, float]:
    import FinanceDataReader as fdr

    end = datetime.now()
    start = end - timedelta(days=14)
    df = fdr.DataReader(symbol, start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d"))
    if df is None or df.empty:
        die(f"No US quote data for {symbol}")
    last = df.iloc[-1]
    trade_date = df.index[-1].strftime("%Y-%m-%d")
    return trade_date, round(float(last["Close"]), 4)
