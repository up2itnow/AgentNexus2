#!/bin/bash
# Agent Zero Quick Execution Entrypoint
# Minimal setup for stateless Basic tier execution

set -e

echo "==================================="
echo "Agent Zero Quick Execution Mode"
echo "==================================="

# Configure Agent Zero for API-only mode
export AGENT_ZERO_MODE=quick
export NO_WEBUI=true
export LOG_LEVEL=${LOG_LEVEL:-INFO}

# Create temporary workspace
mkdir -p /tmp/agent-zero/workspace
cd /tmp/agent-zero

# Start simple HTTP server for API endpoint
# This runs Agent Zero in headless mode with just the /api/chat endpoint
python3 -c "
import http.server
import socketserver
import json
import sys
from io import StringIO

# Import Agent Zero core
sys.path.insert(0, '/app')
from python.helpers.agent import Agent

PORT = 80
agent = None

class AgentZeroHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'healthy'}).encode())
        else:
            self.send_error(404)

    def do_POST(self):
        if self.path == '/api/chat':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            # Process with Agent Zero
            global agent
            if not agent:
                agent = Agent()
            
            messages = data.get('messages', [])
            if messages:
                user_message = messages[-1]['content']
                
                # Execute agent
                response = agent.message_loop(user_message)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                result = {
                    'message': response,
                    'status': 'success'
                }
                self.wfile.write(json.dumps(result).encode())
            else:
                self.send_error(400, 'No messages provided')
        else:
            self.send_error(404)

with socketserver.TCPServer(('', PORT), AgentZeroHandler) as httpd:
    print(f'Agent Zero Quick API running on port {PORT}')
    httpd.serve_forever()
"

