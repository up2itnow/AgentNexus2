"""Integration test — verifies real price feed works."""
import os
os.environ.setdefault("PRICE_FEED_PROVIDER", "coingecko")

from price_feed import get_price


def test_coingecko_btc():
    price = get_price("BTC")
    assert isinstance(price, float)
    assert price > 1000, f"BTC price suspiciously low: {price}"
    print(f"✅ BTC: ${price:,.2f}")


def test_coingecko_eth():
    price = get_price("ETH")
    assert price > 100
    print(f"✅ ETH: ${price:,.2f}")


def test_binance():
    os.environ["PRICE_FEED_PROVIDER"] = "binance"
    price = get_price("BTC")
    assert price > 1000
    print(f"✅ BTC via Binance: ${price:,.2f}")
    os.environ["PRICE_FEED_PROVIDER"] = "coingecko"


def test_cache():
    p1 = get_price("ETH")
    p2 = get_price("ETH")  # should hit cache
    assert p1 == p2
    print("✅ Cache works")


if __name__ == "__main__":
    test_coingecko_btc()
    test_coingecko_eth()
    test_binance()
    test_cache()
    print("\n✅ All price feed tests passed")
