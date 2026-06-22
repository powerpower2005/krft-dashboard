"""Shared helpers for pykrx / FinanceDataReader scripts."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
OHLCV_DIR = PUBLIC / "ohlcv"


def die(message: str, code: int = 1) -> None:
    print(message, file=sys.stderr)
    sys.exit(code)


def ymd_to_iso(ymd: str) -> str:
    return f"{ymd[:4]}-{ymd[4:6]}-{ymd[6:8]}"


def iso_to_ymd(iso: str) -> str:
    return iso.replace("-", "")


def write_json(path: Path, data: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(data, ensure_ascii=False, separators=(",", ":"), allow_nan=False),
        encoding="utf-8",
    )


def latest_trading_ymd(max_lookback: int = 14) -> str:
    from pykrx import stock

    day = datetime.now()
    for _ in range(max_lookback):
        ymd = day.strftime("%Y%m%d")
        try:
            df = stock.get_market_ohlcv(ymd, market="ALL")
            if df is not None and not df.empty:
                return ymd
        except Exception:
            pass
        day -= timedelta(days=1)
    die("Could not find a recent trading day from KRX/pykrx")


def _normalize_code(raw: str) -> str | None:
    code = str(raw).strip().upper()
    if len(code) == 6 and code.isalnum():
        return code
    if code.isdigit() and len(code) <= 6:
        return code.zfill(6)
    return None


def _load_fdr_stock_rows() -> list[dict[str, str]]:
    import FinanceDataReader as fdr

    df = fdr.StockListing("KRX")
    rows: list[dict[str, str]] = []
    for _, row in df.iterrows():
        code = _normalize_code(row["Code"])
        if not code:
            continue
        rows.append({"name": str(row["Name"]), "code": code, "market": str(row["Market"])})
    return rows


def _load_fdr_etf_rows() -> list[dict[str, str]]:
    import FinanceDataReader as fdr

    df = fdr.StockListing("ETF/KR")
    rows: list[dict[str, str]] = []
    for _, row in df.iterrows():
        code = _normalize_code(row["Symbol"])
        if not code:
            continue
        rows.append({"name": str(row["Name"]), "code": code, "market": "ETF"})
    return rows


def _merge_rows(*groups: list[dict[str, str]]) -> list[dict[str, str]]:
    merged: dict[str, dict[str, str]] = {}
    for group in groups:
        for row in group:
            merged[row["code"]] = row
    return list(merged.values())


def load_listing_rows() -> list[dict[str, str]]:
    """Load KRX stocks + KR ETFs via FinanceDataReader, fallback to pykrx."""
    try:
        rows = _merge_rows(_load_fdr_stock_rows(), _load_fdr_etf_rows())
        if rows:
            return rows
    except Exception as err:
        print(f"FinanceDataReader listing failed: {err}", file=sys.stderr)

    from pykrx import stock

    ymd = latest_trading_ymd()
    rows = []
    for market in ("KOSPI", "KOSDAQ"):
        for code in stock.get_market_ticker_list(ymd, market=market):
            rows.append(
                {
                    "name": stock.get_market_ticker_name(code),
                    "code": code,
                    "market": market,
                }
            )
    return rows


def load_listing_quotes() -> tuple[str, dict[str, dict[str, int | str]]]:
    """Return (trade_date_iso, quotes map) from FinanceDataReader, fallback pykrx."""
    trade_date = datetime.now().strftime("%Y-%m-%d")
    quotes: dict[str, dict[str, int | str]] = {}

    try:
        import FinanceDataReader as fdr

        krx = fdr.StockListing("KRX")
        for _, row in krx.iterrows():
            code = _normalize_code(row["Code"])
            if not code:
                continue
            quotes[code] = {"close": int(row["Close"]), "tradeDate": trade_date}

        etf = fdr.StockListing("ETF/KR")
        for _, row in etf.iterrows():
            code = _normalize_code(row["Symbol"])
            if not code:
                continue
            quotes[code] = {"close": int(row["Price"]), "tradeDate": trade_date}

        if quotes:
            return trade_date, quotes
    except Exception as err:
        print(f"FinanceDataReader quotes failed: {err}", file=sys.stderr)

    from pykrx import stock

    ymd = latest_trading_ymd()
    trade_date = ymd_to_iso(ymd)
    quotes: dict[str, dict[str, int | str]] = {}
    for market in ("KOSPI", "KOSDAQ", "ALL"):
        try:
            df = stock.get_market_ohlcv(ymd, market=market)
        except Exception:
            continue
        if df is None or df.empty:
            continue
        for code in df.index:
            quotes[str(code)] = {
                "close": int(df.loc[code, "종가"]),
                "tradeDate": trade_date,
            }
        if quotes:
            break
    if not quotes:
        die("Could not fetch quotes from pykrx or FinanceDataReader")
    return trade_date, quotes


def fetch_history_closes(code: str, start_ymd: str, end_ymd: str) -> dict[str, int]:
    """Return {YYYY-MM-DD: close} using FinanceDataReader with pykrx fallback."""
    closes: dict[str, int] = {}

    try:
        import FinanceDataReader as fdr

        start = ymd_to_iso(start_ymd)
        end = ymd_to_iso(end_ymd)
        df = fdr.DataReader(code, start, end)
        if df is not None and not df.empty:
            for idx, row in df.iterrows():
                closes[idx.strftime("%Y-%m-%d")] = int(row["Close"])
            return closes
    except Exception as err:
        print(f"FinanceDataReader failed for {code}: {err}", file=sys.stderr)

    from pykrx import stock

    df = stock.get_market_ohlcv(start_ymd, end_ymd, code)
    if df is None or df.empty:
        return closes

    for idx, row in df.iterrows():
        closes[idx.strftime("%Y-%m-%d")] = int(row["종가"])
    return closes
