# AgentNexus Node.js Agent Template
# Optimized for security and minimal attack surface

FROM node:20-alpine

# Use existing node user (uid/gid 1000) for security
# Node alpine image comes with node:node user pre-configured

# Set working directory
WORKDIR /app

# Install dependencies as root
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# Copy agent code
COPY agent.js .
COPY utils.js* ./

# Create output directory (use node user since it's uid 1000)
RUN mkdir -p /tmp/output && chown 1000:1000 /tmp/output

# Switch to non-root user (uid 1000 = node user)
USER 1000

# Set environment variables
ENV NODE_ENV=production
ENV OUTPUT_DIR=/tmp/output

# Run the agent
CMD ["node", "agent.js"]

