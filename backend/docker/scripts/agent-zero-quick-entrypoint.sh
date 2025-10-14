#!/bin/bash
# Agent Zero Quick Execution Entrypoint
# Minimal setup for stateless Basic tier execution with proper signal handling

set -e

# Function to handle graceful shutdown
cleanup() {
    echo "Received shutdown signal, stopping Agent Zero API server..."
    kill -TERM $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
    echo "Agent Zero API server stopped gracefully"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

echo "==================================="
echo "Agent Zero Quick Execution Mode"
echo "==================================="
echo "Started at: $(date)"

# Configure Agent Zero for API-only mode
export AGENT_ZERO_MODE=quick
export NO_WEBUI=true
export LOG_LEVEL=${LOG_LEVEL:-INFO}

# Create temporary workspace
mkdir -p /tmp/agent-zero/workspace
cd /tmp/agent-zero

echo "Working directory: $(pwd)"
echo "Agent Zero mode: $AGENT_ZERO_MODE"
echo "Log level: $LOG_LEVEL"

# Function to check if Agent Zero module is available
check_agent_zero() {
    python3 -c "import sys; sys.path.insert(0, '/app'); from python.helpers.agent import Agent; print('Agent Zero module loaded successfully')" 2>/dev/null
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to load Agent Zero module"
        echo "Python path: $PYTHONPATH"
        echo "Available modules in /app:"
        find /app -name "*.py" | head -10
        return 1
    fi
    echo "Agent Zero module check: PASSED"
    return 0
}

# Validate Agent Zero before starting
if ! check_agent_zero; then
    echo "CRITICAL: Agent Zero validation failed, exiting"
    exit 1
fi

# Start HTTP server for API endpoint in background
# This runs Agent Zero in headless mode with just the /api/chat endpoint
python3 -c "
import http.server
import socketserver
import json
import sys
import logging
import signal
import os
from threading import Event

# Import Agent Zero core
sys.path.insert(0, '/app')
from python.helpers.agent import Agent

PORT = 80
agent = None
shutdown_event = Event()

# Set up logging
logging.basicConfig(
    level=getattr(logging, os.environ.get('LOG_LEVEL', 'INFO').upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('agent-zero-api')

class AgentZeroHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Override to use our logger instead of stderr
        logger.info(format % args)

    def do_GET(self):
        if self.path == '/health':
            try:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                response = {'status': 'healthy', 'timestamp': str(os.times())}
                self.wfile.write(json.dumps(response).encode())
                logger.debug('Health check served')
            except Exception as e:
                logger.error(f'Health check failed: {e}')
                self.send_error(500, str(e))
        else:
            self.send_error(404, 'Not Found')

    def do_POST(self):
        if self.path == '/api/chat':
            try:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length == 0:
                    self.send_error(400, 'No content provided')
                    return

                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))

                # Process with Agent Zero
                global agent
                if not agent:
                    logger.info('Initializing Agent Zero instance')
                    agent = Agent()

                messages = data.get('messages', [])
                if not messages:
                    self.send_error(400, 'No messages provided')
                    return

                user_message = messages[-1]['content']

                logger.info(f'Processing message: {user_message[:50]}...')

                # Execute agent
                response = agent.message_loop(user_message)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                result = {
                    'message': response,
                    'status': 'success',
                    'timestamp': str(os.times())
                }
                self.wfile.write(json.dumps(result).encode())
                logger.info('Agent execution completed successfully')

            except json.JSONDecodeError as e:
                logger.error(f'Invalid JSON: {e}')
                self.send_error(400, 'Invalid JSON')
            except Exception as e:
                logger.error(f'Agent execution failed: {e}')
                self.send_error(500, f'Internal server error: {str(e)}')
        else:
            self.send_error(404, 'Not Found')

# Create and start server
try:
    httpd = socketserver.TCPServer(('', PORT), AgentZeroHandler)
    logger.info(f'Agent Zero Quick API running on port {PORT}')

    # Serve until shutdown signal
    while not shutdown_event.is_set():
        httpd.handle_request()

except KeyboardInterrupt:
    logger.info('Received keyboard interrupt')
except Exception as e:
    logger.error(f'Server startup failed: {e}')
    exit(1)
"

