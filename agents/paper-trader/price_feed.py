"""
Price feed abstraction for AgentNexus2 PaperTrader.
Default: CoinGecko (free, no API key required)
User-configurable: set PRICE_FEED_PROVIDER and PRICE_FEED_API_KEY in environment.

Supported providers:
  - coingecko   (default, free)
  - coinmarketcap (requires CMC_API_KEY)
  - binance     (free public endpoint)
  - custom      (user supplies PRICE_FEED_URL with {symbol} placeholder)
"""

import os
import time
import urllib.request
import urllib.error
import json
import logging
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

PROVIDERS = {
    "coingecko": {
        "url": "https://api.coingecko.com/api/v3/simple/price?ids={coingecko_id}&vs_currencies=usd",
        "key_env": None,
        "parse": lambda data, symbol: list(data.values())[0]["usd"]
    },
    "binance": {
        "url": "https://api.binance.com/api/v3/ticker/price?symbol={symbol}USDT",
        "key_env": None,
        "parse": lambda data, symbol: float(data["price"])
    },
    "coinmarketcap": {
        "url": "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol={symbol}",
        "key_env": "CMC_API_KEY",
        "parse": lambda data, symbol: data["data"][symbol]["quote"]["USD"]["price"]
    },
}

# CoinGecko symbol → id mapping for common assets
COINGECKO_IDS = {
    "BTC": "bitcoin", "ETH": "ethereum", "SOL": "solana",
    "BNB": "binancecoin", "XRP": "ripple", "ADA": "cardano",
    "DOGE": "dogecoin", "AVAX": "avalanche-2", "MATIC": "matic-network",
    "LINK": "chainlink", "DOT": "polkadot", "UNI": "uniswap",
    "ATOM": "cosmos", "LTC": "litecoin", "ARB": "arbitrum",
}

_cache: dict = {}
_cache_ttl = 15  # seconds


def _fetch(url: str, headers: dict = None) -> dict:
    scheme = urlparse(url).scheme
    if scheme not in {"http", "https"}:
        raise ValueError(f"Unsupported price feed URL scheme: {scheme or 'missing'}")

    req = urllib.request.Request(url, headers=headers or {"User-Agent": "AgentNexus2/1.0"})
    with urllib.request.urlopen(req, timeout=10) as r:  # nosec B310
        return json.loads(r.read())


def get_price(symbol: str) -> float:
    """
    Get current USD price for a symbol.
    Reads PRICE_FEED_PROVIDER from env (default: coingecko).

    Environment variables:
      PRICE_FEED_PROVIDER  — coingecko (default), binance, coinmarketcap, custom
      CMC_API_KEY          — required when PRICE_FEED_PROVIDER=coinmarketcap
      PRICE_FEED_URL       — required when PRICE_FEED_PROVIDER=custom
                             Use {symbol} placeholder, e.g. https://api.example.com/price?symbol={symbol}
    """
    symbol = symbol.upper()
    cache_key = symbol
    now = time.time()

    if cache_key in _cache and now - _cache[cache_key]["ts"] < _cache_ttl:
        return _cache[cache_key]["price"]

    provider_name = os.environ.get("PRICE_FEED_PROVIDER", "coingecko").lower()

    # Custom URL mode
    if provider_name == "custom":
        custom_url = os.environ.get("PRICE_FEED_URL", "")
        if not custom_url:
            raise ValueError("PRICE_FEED_URL must be set when PRICE_FEED_PROVIDER=custom")
        url = custom_url.replace("{symbol}", symbol)
        data = _fetch(url)
        price = float(data.get("price") or data.get("last") or data.get("usd") or list(data.values())[0])
        _cache[cache_key] = {"price": price, "ts": now}
        return price

    if provider_name not in PROVIDERS:
        logger.warning(f"Unknown provider '{provider_name}', falling back to coingecko")
        provider_name = "coingecko"

    provider = PROVIDERS[provider_name]

    # Build URL
    if provider_name == "coingecko":
        cg_id = COINGECKO_IDS.get(symbol, symbol.lower())
        url = provider["url"].format(coingecko_id=cg_id)
    else:
        url = provider["url"].format(symbol=symbol)

    # Build headers
    headers = {"User-Agent": "AgentNexus2/1.0"}
    if provider["key_env"]:
        api_key = os.environ.get(provider["key_env"])
        if not api_key:
            raise EnvironmentError(
                f"Provider '{provider_name}' requires {provider['key_env']} environment variable. "
                f"Set it or switch PRICE_FEED_PROVIDER to 'coingecko' (free, no key needed)."
            )
        if provider_name == "coinmarketcap":
            headers["X-CMC_PRO_API_KEY"] = api_key

    try:
        data = _fetch(url, headers)
        price = provider["parse"](data, symbol)
        price = float(price)
        _cache[cache_key] = {"price": price, "ts": now}
        logger.debug(f"{symbol} price via {provider_name}: ${price:,.4f}")
        return price
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"Price feed HTTP error {e.code} for {symbol} via {provider_name}: {e.reason}")
    except Exception as e:
        raise RuntimeError(f"Price feed error for {symbol} via {provider_name}: {e}")


def get_prices(symbols: list) -> dict:
    """Get prices for multiple symbols. Returns {symbol: price}."""
    return {s: get_price(s) for s in symbols}
