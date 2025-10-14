# Agent Zero Quick Execution Dockerfile
# Stripped-down version for Basic tier stateless execution
# Based on official agent0ai/agent-zero image

FROM agent0ai/agent-zero:latest

# Set working directory
WORKDIR /app

# Environment variables
ENV AGENT_ZERO_MODE=quick \
    PYTHONUNBUFFERED=1 \
    NO_WEBUI=true

# Create non-root user
RUN addgroup --gid 1000 agentzero && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos "" agentzero

# Create minimal required directories
RUN mkdir -p /tmp/agent-zero && \
    chown -R agentzero:agentzero /tmp/agent-zero /app

# Copy custom entrypoint for quick execution mode
COPY scripts/agent-zero-quick-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && \
    chown agentzero:agentzero /entrypoint.sh

# Remove WebUI files to reduce image size
RUN rm -rf /app/webui 2>/dev/null || true

# Expose HTTP API port
EXPOSE 80

# Switch to non-root user
USER agentzero

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Start Agent Zero in quick execution mode
ENTRYPOINT ["/entrypoint.sh"]

