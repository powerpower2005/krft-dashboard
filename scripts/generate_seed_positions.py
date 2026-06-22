"""Generate public/seed-positions.json from roster + ohlcv files."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ENTRY_DATE_ETF = "2026-05-07"
ENTRY_DATE_STOCK = "2026-05-21"

US_NAMES: dict[str, str] = {
    "SMH": "VanEck Semiconductor ETF",
    "DTCR": "Global X Data Center & Digital Infrastructure ETF",
    "NLR": "VanEck Uranium and Nuclear ETF",
    "CIBR": "First Trust NASDAQ Cybersecurity ETF",
    "VDE": "Vanguard Energy ETF",
    "IBB": "iShares Biotechnology ETF",
    "FBTC": "Fidelity Wise Origin Bitcoin Fund",
}

# (display name, region, code, entry date)
ROSTER: list[tuple[str, str, str, str]] = [
    # ETF / US batch
    ("차시우", "KR", "456600", ENTRY_DATE_ETF),
    ("최황지", "KR", "0080G0", ENTRY_DATE_ETF),
    ("서범석", "US", "SMH", ENTRY_DATE_ETF),
    ("백은솔", "US", "DTCR", ENTRY_DATE_ETF),
    ("송영진", "US", "NLR", ENTRY_DATE_ETF),
    ("이지은", "US", "CIBR", ENTRY_DATE_ETF),
    ("조대규", "US", "VDE", ENTRY_DATE_ETF),
    ("김진경", "KR", "411060", ENTRY_DATE_ETF),
    ("홍영근", "US", "IBB", ENTRY_DATE_ETF),
    ("박승훈", "US", "CIBR", ENTRY_DATE_ETF),
    ("허채윤", "KR", "0173Y0", ENTRY_DATE_ETF),
    ("심현희", "KR", "438900", ENTRY_DATE_ETF),
    ("임성하", "US", "FBTC", ENTRY_DATE_ETF),
    ("이한가람", "KR", "161510", ENTRY_DATE_ETF),
    ("김부갑", "KR", "0115E0", ENTRY_DATE_ETF),
    ("이새얀", "KR", "0028X0", ENTRY_DATE_ETF),
    ("민지혜", "KR", "104530", ENTRY_DATE_ETF),
    ("유정현", "KR", "0167A0", ENTRY_DATE_ETF),
    # KR large-cap batch
    ("차시우", "KR", "000660", ENTRY_DATE_STOCK),
    ("최황지", "KR", "000660", ENTRY_DATE_STOCK),
    ("이새얀", "KR", "012450", ENTRY_DATE_STOCK),
    ("홍영근", "KR", "267260", ENTRY_DATE_STOCK),
    ("허채윤", "KR", "005930", ENTRY_DATE_STOCK),
    ("민지혜", "KR", "329180", ENTRY_DATE_STOCK),
    ("김상민", "KR", "042700", ENTRY_DATE_STOCK),
    ("서범석", "KR", "000880", ENTRY_DATE_STOCK),
    ("강창모", "KR", "000660", ENTRY_DATE_STOCK),
    ("이상신", "KR", "009150", ENTRY_DATE_STOCK),
    ("임태호", "KR", "015760", ENTRY_DATE_STOCK),
    ("박형근", "KR", "005930", ENTRY_DATE_STOCK),
    ("박승훈", "KR", "259960", ENTRY_DATE_STOCK),
    ("유정현", "KR", "000660", ENTRY_DATE_STOCK),
]


def assign_nicknames(roster: list[tuple[str, str, str, str]]) -> list[str]:
    name_counts: dict[str, int] = {}
    for name, _, _, _ in roster:
        name_counts[name] = name_counts.get(name, 0) + 1

    seen: dict[str, int] = {}
    nicknames: list[str] = []
    for name, _, _, _ in roster:
        if name_counts[name] == 1:
            nicknames.append(name)
            continue
        seen[name] = seen.get(name, 0) + 1
        nicknames.append(f"{name}{seen[name]}")
    return nicknames


def load_kr_names() -> dict[str, str]:
    stocks = json.loads((PUBLIC / "stocks.json").read_text(encoding="utf-8"))
    return {s["code"]: s["name"] for s in stocks}


def close_on_date(region: str, code: str, date: str) -> float:
    sub = "us-ohlcv" if region == "US" else "ohlcv"
    data = json.loads((PUBLIC / sub / f"{code}.json").read_text(encoding="utf-8"))
    price = data["closes"].get(date)
    if price is None:
        raise KeyError(f"{region} {code}: no close on {date}")
    return float(price)


def main() -> None:
    kr_names = load_kr_names()
    nicknames = assign_nicknames(ROSTER)
    positions = []

    for (name, region, code, entry_date), nickname in zip(ROSTER, nicknames, strict=True):
        if region == "KR":
            stock_name = kr_names.get(code)
            if not stock_name:
                raise KeyError(f"KR code not in stocks.json: {code}")
            currency = "KRW"
        else:
            stock_name = US_NAMES.get(code)
            if not stock_name:
                raise KeyError(f"US code not mapped: {code}")
            currency = "USD"

        entry_price = close_on_date(region, code, entry_date)
        positions.append(
            {
                "nickname": nickname,
                "region": region,
                "stockName": stock_name,
                "stockCode": code,
                "entryDate": entry_date,
                "entryPrice": entry_price,
                "currency": currency,
            }
        )

    out = {
        "version": 1,
        "entryDates": {
            "etf": ENTRY_DATE_ETF,
            "stock": ENTRY_DATE_STOCK,
        },
        "positions": positions,
    }
    path = PUBLIC / "seed-positions.json"
    path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {path} ({len(positions)} positions)")


if __name__ == "__main__":
    main()
