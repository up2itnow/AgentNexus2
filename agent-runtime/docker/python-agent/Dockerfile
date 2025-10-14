# AgentNexus Python Agent Template
# Optimized for security and minimal attack surface

FROM python:3.11-alpine

# Create non-root user for security
RUN addgroup -g 1000 agent && \
    adduser -D -u 1000 -G agent agent

# Set working directory
WORKDIR /app

# Install dependencies as root, then switch to non-root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    rm -rf /root/.cache

# Copy agent code
COPY agent.py .
COPY utils.py* ./

# Create output directory
RUN mkdir -p /tmp/output && chown agent:agent /tmp/output

# Switch to non-root user
USER agent

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV OUTPUT_DIR=/tmp/output

# Run the agent
CMD ["python", "agent.py"]

