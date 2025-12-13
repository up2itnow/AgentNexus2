# AgentNexus Paper Trader Agent
# Sprint 3 Reference Agent - Trading with A2A
#
# Modes:
# - PAPER: No network, deterministic prices
# - LIVE: Network enabled (not implemented in demo)

FROM python:3.12-slim

# Create non-root user
RUN useradd --create-home --shell /bin/bash agent

WORKDIR /app

# Copy application
COPY --chown=agent:agent main.py .

# Switch to non-root user
USER agent

# Default to paper trading mode
ENV TRADING_MODE=paper

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import main; print('OK')" || exit 1

CMD ["python", "main.py"]

# Labels
LABEL org.opencontainers.image.title="AgentNexus Paper Trader"
LABEL org.opencontainers.image.description="Sprint 3 trading agent with A2A capability"
LABEL org.opencontainers.image.vendor="AgentNexus"
LABEL org.opencontainers.image.version="1.0.0"
LABEL agentnexus.agent.id="2"
LABEL agentnexus.agent.type="trading"
LABEL agentnexus.runtime.network="false"
LABEL agentnexus.runtime.cpu="0.5"
LABEL agentnexus.runtime.memory="256m"
LABEL agentnexus.a2a.enabled="true"
