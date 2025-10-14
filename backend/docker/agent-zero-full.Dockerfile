# Agent Zero Full Dockerfile
# Complete version with WebUI for Pro tier persistent instances
# Based on official agent0ai/agent-zero image

FROM agent0ai/agent-zero:latest

# Set working directory
WORKDIR /app

# Environment variables
ENV AGENT_ZERO_MODE=persistent \
    PYTHONUNBUFFERED=1 \
    ENABLE_WEBUI=true

# Create non-root user
RUN addgroup --gid 1000 agentzero && \
    adduser --uid 1000 --gid 1000 --disabled-password --gecos "" agentzero

# Create directories for persistent data
RUN mkdir -p /app/memory /app/logs /app/knowledge /app/tmp && \
    chown -R agentzero:agentzero /app

# Note: Additional Pro tier dependencies (redis, celery, flower) can be
# installed later if needed. The base image has all core Agent Zero functionality.

# Copy custom configuration for persistent mode
COPY config/agent-zero-pro-config.yaml /app/config/config.yaml
RUN chown agentzero:agentzero /app/config/config.yaml

# Expose WebUI port
EXPOSE 50001

# Switch to non-root user
USER agentzero

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:50001/health || exit 1

# Volume mounts for persistent data (defined in docker run command)
# - /app/memory: Agent memory and sessions
# - /app/logs: Execution logs
# - /app/knowledge: Knowledge base

# Start Agent Zero with full features
CMD ["python", "-m", "python.run_ui"]

