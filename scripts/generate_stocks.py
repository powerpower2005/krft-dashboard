"""Generate public/stocks.json from FinanceDataReader / pykrx."""

from __future__ import annotations

from kr_data import PUBLIC, die, load_listing_rows, write_json


def main() -> None:
    rows = load_listing_rows()
    if not rows:
        die("No stocks returned from FinanceDataReader or pykrx")
    rows.sort(key=lambda item: item["name"])
    out = PUBLIC / "stocks.json"
    write_json(out, rows)
    print(f"Wrote {len(rows)} stocks to {out}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        die(str(exc))
