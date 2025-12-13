# AgentNexus Summarizer Agent
# Sprint 1 Reference Agent - Hardened Container
#
# Security features:
# - Non-root user
# - Minimal base image
# - No network access (enforced via runtime profile)
# - Read-only filesystem compatible

FROM python:3.12-slim

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash agent

# Set working directory
WORKDIR /app

# Copy application files
COPY --chown=agent:agent main.py .

# Switch to non-root user
USER agent

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import main; print('OK')" || exit 1

# Default command
CMD ["python", "main.py"]

# Labels for container metadata
LABEL org.opencontainers.image.title="AgentNexus Summarizer"
LABEL org.opencontainers.image.description="Sprint 1 reference agent for text summarization"
LABEL org.opencontainers.image.vendor="AgentNexus"
LABEL org.opencontainers.image.version="1.0.0"
LABEL agentnexus.agent.id="1"
LABEL agentnexus.agent.type="utility"
LABEL agentnexus.runtime.network="false"
LABEL agentnexus.runtime.cpu="0.25"
LABEL agentnexus.runtime.memory="256m"
