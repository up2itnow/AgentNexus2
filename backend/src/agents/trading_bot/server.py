#!/usr/bin/env python3
"""
Trading Bot Agent Server
Provides HTTP API for trading operations using Hyperliquid integration
"""

import asyncio
import json
import logging
import os
import signal
import sys
from typing import Dict, Any, Optional

# Add the parent directory to the path for imports
sys.path.insert(0, '/app')

from src.services.HyperliquidService import HyperliquidService

class TradingBotServer:
    def __init__(self):
        self.hyperliquid_service = HyperliquidService()
        self.is_running = False
        self.logger = self._setup_logging()

    def _setup_logging(self) -> logging.Logger:
        """Set up structured logging for the trading bot"""
        logger = logging.getLogger('trading-bot')

        # Configure logging level from environment
        log_level = getattr(logging, os.getenv('LOG_LEVEL', 'INFO').upper())
        logger.setLevel(log_level)

        # Create console handler if not exists
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

        return logger

    async def health_check(self) -> Dict[str, Any]:
        """Health check endpoint"""
        try:
            # Test Hyperliquid connectivity
            symbols = await self.hyperliquid_service.getAvailableSymbols()
            connectivity_ok = len(symbols) > 0

            return {
                'status': 'healthy' if connectivity_ok else 'degraded',
                'timestamp': asyncio.get_event_loop().time(),
                'services': {
                    'hyperliquid': 'connected' if connectivity_ok else 'disconnected'
                },
                'config': {
                    'max_position_size': os.getenv('MAX_POSITION_SIZE'),
                    'max_daily_loss': os.getenv('MAX_DAILY_LOSS'),
                    'log_level': os.getenv('LOG_LEVEL')
                }
            }
        except Exception as e:
            self.logger.error(f'Health check failed: {e}')
            return {
                'status': 'unhealthy',
                'timestamp': asyncio.get_event_loop().time(),
                'error': str(e)
            }

    async def analyze_market(self, symbol: str) -> Dict[str, Any]:
        """Analyze market conditions for a symbol"""
        try:
            self.logger.info(f'Analyzing market for {symbol}')

            # Get market data
            market_data = await self.hyperliquid_service.getMarketData(symbol)

            # Get order book
            order_book = await self.hyperliquid_service.getOrderBook(symbol, 10)

            # Calculate basic indicators
            mark_price = float(market_data.markPrice)
            bid_price = float(order_book.bids[0][0]) if order_book.bids else mark_price
            ask_price = float(order_book.asks[0][0]) if order_book.asks else mark_price
            spread = ask_price - bid_price

            # Simple momentum calculation (24h change)
            high_24h = float(market_data.high24h)
            low_24h = float(market_data.low24h)
            momentum = (mark_price - low_24h) / (high_24h - low_24h) if high_24h > low_24h else 0.5

            analysis = {
                'symbol': symbol,
                'mark_price': mark_price,
                'bid_ask_spread': spread,
                'momentum_score': momentum,  # 0-1 scale
                'volume_24h': float(market_data.volume24h),
                'open_interest': float(market_data.openInterest),
                'funding_rate': float(market_data.fundingRate),
                'recommendation': self._generate_trading_signal(momentum, spread, mark_price),
                'timestamp': market_data.timestamp
            }

            self.logger.info(f'Market analysis complete for {symbol}: {analysis["recommendation"]}')
            return analysis

        except Exception as e:
            self.logger.error(f'Market analysis failed for {symbol}: {e}')
            raise

    def _generate_trading_signal(self, momentum: float, spread: float, price: float) -> str:
        """Generate basic trading signal based on market conditions"""
        if momentum > 0.7 and spread < price * 0.001:  # Strong upward momentum, tight spread
            return 'BUY'
        elif momentum < 0.3 and spread < price * 0.001:  # Strong downward momentum, tight spread
            return 'SELL'
        else:
            return 'HOLD'

    async def execute_trade(self, trade_request: Dict[str, Any]) -> Dict[str, Any]:
        """Execute a trading operation"""
        try:
            symbol = trade_request['symbol']
            side = trade_request['side']
            order_type = trade_request['order_type']
            quantity = trade_request['quantity']
            price = trade_request.get('price')

            self.logger.info(f'Executing {side} {order_type} for {quantity} {symbol}')

            # Create order object
            order = {
                'symbol': symbol,
                'side': side,
                'orderType': order_type,
                'quantity': str(quantity)
            }

            if price:
                order['price'] = str(price)

            # In a real implementation, this would use authenticated API calls
            # For now, simulate order placement
            order_id = await self.hyperliquid_service.placeOrder(order, 'demo-user-address')

            result = {
                'order_id': order_id,
                'symbol': symbol,
                'side': side,
                'order_type': order_type,
                'quantity': quantity,
                'price': price,
                'status': 'pending',
                'timestamp': asyncio.get_event_loop().time()
            }

            self.logger.info(f'Trade executed: {order_id}')
            return result

        except Exception as e:
            self.logger.error(f'Trade execution failed: {e}')
            raise

    async def get_portfolio_summary(self, user_address: str) -> Dict[str, Any]:
        """Get portfolio summary for a user"""
        try:
            account_info = await self.hyperliquid_service.getAccountInfo(user_address)

            # Calculate portfolio metrics
            total_value = float(account_info.accountValue)
            unrealized_pnl = float(account_info.totalUnrealizedPnl)
            available_balance = float(account_info.availableBalance)

            positions_count = len(account_info.positions)

            # Calculate risk metrics
            risk_percentage = 0.0
            if total_value > 0:
                risk_percentage = abs(unrealized_pnl) / total_value * 100

            return {
                'user_address': user_address,
                'total_value': total_value,
                'unrealized_pnl': unrealized_pnl,
                'available_balance': available_balance,
                'positions_count': positions_count,
                'risk_percentage': risk_percentage,
                'positions': account_info.positions,
                'timestamp': asyncio.get_event_loop().time()
            }

        except Exception as e:
            self.logger.error(f'Portfolio summary failed for {user_address}: {e}')
            raise

    async def start(self, port: int = 80):
        """Start the trading bot server"""
        self.is_running = True
        self.logger.info(f'Starting Trading Bot server on port {port}')

        try:
            # In a real implementation, this would use a proper web framework like FastAPI
            # For now, we'll use a simple HTTP server approach similar to Agent Zero

            import http.server
            import socketserver

            class TradingBotHandler(http.server.BaseHTTPRequestHandler):
                def log_message(self, format, *args):
                    self.server.logger.info(format % args)

                def do_GET(self):
                    if self.path == '/health':
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()

                        # Get health from parent server instance
                        import asyncio
                        health = asyncio.run(self.server.parent_server.health_check())
                        self.wfile.write(json.dumps(health).encode())

                    elif self.path.startswith('/market/'):
                        symbol = self.path.split('/')[-1]
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()

                        # Get market analysis
                        import asyncio
                        analysis = asyncio.run(self.server.parent_server.analyze_market(symbol))
                        self.wfile.write(json.dumps(analysis).encode())

                    elif self.path == '/symbols':
                        self.send_response(200)
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()

                        # Get available symbols
                        import asyncio
                        symbols = asyncio.run(self.server.parent_server.hyperliquid_service.getAvailableSymbols())
                        self.wfile.write(json.dumps({'symbols': symbols}).encode())

                    else:
                        self.send_error(404, 'Not Found')

                def do_POST(self):
                    if self.path == '/trade':
                        try:
                            content_length = int(self.headers.get('Content-Length', 0))
                            post_data = self.rfile.read(content_length)
                            trade_request = json.loads(post_data.decode())

                            import asyncio
                            result = asyncio.run(self.server.parent_server.execute_trade(trade_request))

                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            self.end_headers()
                            self.wfile.write(json.dumps(result).encode())

                        except Exception as e:
                            self.send_error(500, f'Internal server error: {str(e)}')

                    elif self.path == '/portfolio':
                        try:
                            content_length = int(self.headers.get('Content-Length', 0))
                            post_data = self.rfile.read(content_length)
                            request_data = json.loads(post_data.decode())

                            user_address = request_data.get('user_address')
                            if not user_address:
                                self.send_error(400, 'user_address required')
                                return

                            import asyncio
                            portfolio = asyncio.run(self.server.parent_server.get_portfolio_summary(user_address))

                            self.send_response(200)
                            self.send_header('Content-type', 'application/json')
                            self.end_headers()
                            self.wfile.write(json.dumps(portfolio).encode())

                        except Exception as e:
                            self.send_error(500, f'Internal server error: {str(e)}')

                    else:
                        self.send_error(404, 'Not Found')

            # Create custom handler class that can access the parent server
            class CustomHandler(TradingBotHandler):
                def __init__(self, *args, **kwargs):
                    self.server.parent_server = self
                    super().__init__(*args, **kwargs)

            # Start server
            with socketserver.TCPServer(('', port), CustomHandler) as httpd:
                self.logger.info(f'Trading Bot server listening on port {port}')
                httpd.serve_forever()

        except Exception as e:
            self.logger.error(f'Server startup failed: {e}')
            raise

    def stop(self):
        """Stop the trading bot server"""
        self.is_running = False
        self.logger.info('Trading Bot server stopped')

async def main():
    """Main entry point"""
    server = TradingBotServer()

    def signal_handler(signum, frame):
        print(f'Received signal {signum}, shutting down...')
        server.stop()
        sys.exit(0)

    # Set up signal handlers
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)

    try:
        await server.start()
    except KeyboardInterrupt:
        print('Received keyboard interrupt')
    finally:
        server.stop()

if __name__ == '__main__':
    asyncio.run(main())
