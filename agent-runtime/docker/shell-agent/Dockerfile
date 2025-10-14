# AgentNexus Shell Script Agent Template
# Minimal container for simple shell-based agents

FROM alpine:3.19

# Install jq for JSON processing
RUN apk add --no-cache jq bash

# Create non-root user for security
RUN addgroup -g 1000 agent && \
    adduser -D -u 1000 -G agent agent

# Set working directory
WORKDIR /app

# Copy agent script
COPY agent.sh .
RUN chmod +x agent.sh

# Create output directory
RUN mkdir -p /tmp/output && chown agent:agent /tmp/output

# Switch to non-root user
USER agent

# Set environment variables
ENV OUTPUT_DIR=/tmp/output

# Run the agent
CMD ["./agent.sh"]

