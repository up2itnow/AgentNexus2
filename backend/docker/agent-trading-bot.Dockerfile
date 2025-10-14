# Trading Bot Agent Dockerfile
# Optimized for Hyperliquid integration and real-time trading

FROM python:3.12-slim-bullseye

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1
ENV LOG_LEVEL=INFO
ENV MAX_POSITION_SIZE=1000
ENV MAX_DAILY_LOSS=100

# Create non-root user for security
RUN groupadd -r agentuser && useradd -r -g agentuser agentuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Create app directory and set ownership
RUN mkdir -p /app && chown -R agentuser:agentuser /app

# Copy requirements first for better Docker layer caching
COPY --chown=agentuser:agentuser backend/requirements.txt /app/requirements.txt

# Switch to non-root user
USER agentuser

# Set working directory
WORKDIR /app

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy agent source code
COPY --chown=agentuser:agentuser backend/src/ /app/src/

# Create logs directory
RUN mkdir -p /app/logs && chown -R agentuser:agentuser /app/logs

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80/health || exit 1

# Resource limits (configurable via environment)
ENV CPU_LIMIT=1.0
ENV MEMORY_LIMIT=2GB
ENV TIMEOUT=300

# Expose port for API
EXPOSE 80

# Start the trading bot server
CMD ["python", "-m", "src.agents.trading_bot.server"]
