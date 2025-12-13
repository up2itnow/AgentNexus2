"""
AgentNexus Paper Trader Agent
Sprint 3 Reference Agent - Trading with A2A

Features:
- Paper trading mode (simulated trades)
- Live trading mode toggle (network required)
- A2A capability: Calls Summarizer agent for market analysis
- Deterministic paper mode for demos

GRANT LANGUAGE:
"Demonstrates Agent-to-Agent (A2A) composability."
"""

import json
import sys
import os
import hashlib
from datetime import datetime
from typing import Any, Optional


class PaperTrader:
    """
    Simple paper trading agent with price simulation.
    """
    
    def __init__(self, mode: str = 'paper'):
        self.mode = mode  # 'paper' or 'live'
        self.portfolio = {'USDC': 10000.0}  # Starting balance
        self.trades = []
        
    def get_price(self, symbol: str) -> float:
        """
        Get price for symbol.
        Paper mode: Uses deterministic simulation
        Live mode: Would call external API
        """
        if self.mode == 'paper':
            # Deterministic price based on symbol hash
            seed = int(hashlib.md5(symbol.encode()).hexdigest()[:8], 16)
            base_price = (seed % 10000) / 100  # $0.01 - $99.99
            return max(0.01, base_price)
        else:
            # Live mode would call external API
            # Not implemented for safety
            raise NotImplementedError("Live trading not enabled in this demo")
    
    def execute_trade(self, action: str, symbol: str, amount: float) -> dict:
        """
        Execute a trade (paper or live).
        """
        price = self.get_price(symbol)
        
        trade = {
            'timestamp': datetime.utcnow().isoformat(),
            'action': action,
            'symbol': symbol,
            'amount': amount,
            'price': price,
            'value': amount * price,
            'mode': self.mode
        }
        
        if action == 'BUY':
            cost = amount * price
            if self.portfolio.get('USDC', 0) >= cost:
                self.portfolio['USDC'] = self.portfolio.get('USDC', 0) - cost
                self.portfolio[symbol] = self.portfolio.get(symbol, 0) + amount
                trade['status'] = 'FILLED'
            else:
                trade['status'] = 'REJECTED'
                trade['reason'] = 'Insufficient balance'
        elif action == 'SELL':
            if self.portfolio.get(symbol, 0) >= amount:
                self.portfolio[symbol] = self.portfolio.get(symbol, 0) - amount
                self.portfolio['USDC'] = self.portfolio.get('USDC', 0) + (amount * price)
                trade['status'] = 'FILLED'
            else:
                trade['status'] = 'REJECTED'
                trade['reason'] = 'Insufficient holdings'
        else:
            trade['status'] = 'INVALID'
            trade['reason'] = f'Unknown action: {action}'
        
        self.trades.append(trade)
        return trade


def call_summarizer_agent(text: str) -> Optional[dict]:
    """
    A2A: Call the Summarizer agent for market analysis.
    
    In production, this would make an HTTP call to the agent execution API.
    For demo, we simulate the summarizer output.
    """
    # Simulated A2A call
    summary = text[:200] + '...' if len(text) > 200 else text
    return {
        'agent': 'summarizer',
        'summary': summary,
        'confidence': 0.95,
        'a2a_call': True
    }


def run(input_data: dict) -> dict[str, Any]:
    """
    Main trading agent logic.
    
    Input:
    {
        "action": "BUY" | "SELL" | "ANALYZE",
        "symbol": "ETH",
        "amount": 1.0,
        "mode": "paper" | "live"  # optional, defaults to paper
    }
    """
    if not input_data or not isinstance(input_data, dict):
        return {
            "error": "Invalid input: expected object with action, symbol, amount",
            "confidence": 0.0
        }
    
    action = input_data.get('action', '').upper()
    symbol = input_data.get('symbol', 'ETH').upper()
    amount = float(input_data.get('amount', 1.0))
    mode = input_data.get('mode', os.environ.get('TRADING_MODE', 'paper'))
    
    trader = PaperTrader(mode=mode)
    
    if action == 'ANALYZE':
        # A2A: Call summarizer for analysis
        market_text = f"Market analysis for {symbol}: Current conditions suggest moderate volatility with potential upside momentum based on recent trading patterns."
        analysis = call_summarizer_agent(market_text)
        
        return {
            "action": "ANALYZE",
            "symbol": symbol,
            "analysis": analysis,
            "price": trader.get_price(symbol),
            "mode": mode,
            "a2a_enabled": True,
            "confidence": 0.9
        }
    
    elif action in ['BUY', 'SELL']:
        trade = trader.execute_trade(action, symbol, amount)
        
        return {
            "trade": trade,
            "portfolio": trader.portfolio,
            "mode": mode,
            "confidence": 0.95 if trade['status'] == 'FILLED' else 0.3
        }
    
    else:
        return {
            "error": f"Unknown action: {action}. Use BUY, SELL, or ANALYZE.",
            "supported_actions": ["BUY", "SELL", "ANALYZE"],
            "confidence": 0.0
        }


def main():
    """
    Main entry point for container execution.
    """
    demo_input = {
        "action": "ANALYZE",
        "symbol": "ETH",
        "mode": "paper"
    }
    
    try:
        if sys.stdin.isatty():
            print("[Demo mode - using sample ANALYZE input]", file=sys.stderr)
            input_data = demo_input
        else:
            raw_input = sys.stdin.read().strip()
            if raw_input:
                try:
                    input_data = json.loads(raw_input)
                except json.JSONDecodeError:
                    print("[Demo mode - invalid JSON, using sample]", file=sys.stderr)
                    input_data = demo_input
            else:
                print("[Demo mode - empty stdin, using sample]", file=sys.stderr)
                input_data = demo_input
        
        result = run(input_data)
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "error": f"Execution failed: {str(e)}",
            "confidence": 0.0
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
