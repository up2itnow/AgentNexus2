#!/bin/bash
###############################################################################
# AgentNexus Shell Script Agent Template
#
# This is a template for creating shell-based agents. Agents receive input
# via environment variables and write output to stdout as JSON.
#
# AGENT CONTRACT:
# ===============
# 1. Read INPUT_DATA environment variable (JSON string)
# 2. Process the data using jq and shell commands
# 3. Write output to stdout as JSON
# 4. Exit with code 0 for success, non-zero for failure
#
# SECURITY:
# =========
# - No network access (container runs with --network=none)
# - Read-only filesystem (except /tmp)
# - Limited memory (512MB) and CPU (50%)
# - Execution timeout (5 minutes)
#
# EXAMPLE USAGE:
# ==============
# INPUT_DATA='{"query": "Hello, world!"}' ./agent.sh
###############################################################################

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Function to log to stderr (visible in logs, not captured as output)
log() {
    echo "$@" >&2
}

# Function to write output to stdout as JSON
write_output() {
    echo "$1"
}

# Main agent logic
main() {
    # Check if INPUT_DATA is set
    if [ -z "${INPUT_DATA:-}" ]; then
        log "❌ INPUT_DATA environment variable is required"
        write_output '{"status": "error", "error": "INPUT_DATA environment variable is required"}'
        exit 1
    fi
    
    log "🤖 Agent started"
    
    # Parse input JSON
    if ! echo "$INPUT_DATA" | jq empty 2>/dev/null; then
        log "❌ Invalid JSON in INPUT_DATA"
        write_output '{"status": "error", "error": "Invalid JSON in INPUT_DATA"}'
        exit 1
    fi
    
    # Extract query from input
    QUERY=$(echo "$INPUT_DATA" | jq -r '.query // "No query provided"')
    log "📝 Query: $QUERY"
    
    # ============================================================
    # YOUR AGENT LOGIC HERE
    # ============================================================
    # Example: Echo agent that returns input with a greeting
    
    # Simulate processing
    sleep 1
    
    # Build output JSON
    OUTPUT=$(jq -n \
        --arg status "success" \
        --arg message "Hello! You said: $QUERY" \
        --argjson input "$INPUT_DATA" \
        --arg version "1.0.0" \
        --arg timestamp "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        '{
            status: $status,
            message: $message,
            input_received: $input,
            agent_version: $version,
            timestamp: $timestamp
        }')
    
    # ============================================================
    # END OF AGENT LOGIC
    # ============================================================
    
    # Write output to stdout
    write_output "$OUTPUT"
    
    log "✅ Agent completed successfully"
    exit 0
}

# Trap errors and exit gracefully
trap 'log "❌ Agent failed with error"; write_output "{\"status\": \"error\", \"error\": \"Agent execution failed\"}"; exit 1' ERR

# Run main function
main

