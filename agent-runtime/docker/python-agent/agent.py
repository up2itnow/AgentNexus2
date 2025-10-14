#!/usr/bin/env python3
"""
AgentNexus Python Agent Template

This is a template for creating Python-based agents. Agents receive input
via environment variables and write output to stdout as JSON.

AGENT CONTRACT:
===============
1. Read INPUT_DATA environment variable (JSON string)
2. Process the data
3. Write output to stdout as JSON
4. Exit with code 0 for success, non-zero for failure

SECURITY:
=========
- No network access (container runs with --network=none)
- Read-only filesystem (except /tmp)
- Limited memory (512MB) and CPU (50%)
- Execution timeout (5 minutes)

EXAMPLE USAGE:
==============
INPUT_DATA='{"query": "Hello, world!"}' python agent.py
"""

import json
import os
import sys
from typing import Any, Dict


def load_input() -> Dict[str, Any]:
    """
    Load input data from environment variable.
    
    Returns:
        Dict containing the input parameters
    
    Raises:
        ValueError: If INPUT_DATA is missing or invalid JSON
    """
    input_data_str = os.environ.get('INPUT_DATA')
    
    if not input_data_str:
        raise ValueError("INPUT_DATA environment variable is required")
    
    try:
        input_data = json.loads(input_data_str)
        return input_data
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON in INPUT_DATA: {e}")


def write_output(output: Dict[str, Any]) -> None:
    """
    Write output data to stdout as JSON.
    
    The AgentNexus backend will capture this and store it as the execution result.
    
    Args:
        output: Dictionary containing the agent's output
    """
    print(json.dumps(output, indent=2))


def main() -> None:
    """
    Main agent logic - customize this for your agent's functionality.
    
    This example agent echoes the input and adds a greeting.
    Replace this with your actual agent logic.
    """
    try:
        # Load input data
        input_data = load_input()
        
        # Log to stderr (won't be captured as output, but visible in logs)
        print(f"🤖 Agent started with input: {input_data}", file=sys.stderr)
        
        # ============================================================
        # YOUR AGENT LOGIC HERE
        # ============================================================
        # Example: Echo agent that returns input with a greeting
        
        query = input_data.get('query', 'No query provided')
        
        output = {
            "status": "success",
            "message": f"Hello! You said: {query}",
            "input_received": input_data,
            "agent_version": "1.0.0"
        }
        
        # ============================================================
        # END OF AGENT LOGIC
        # ============================================================
        
        # Write output to stdout
        write_output(output)
        
        # Log completion
        print("✅ Agent completed successfully", file=sys.stderr)
        
        # Exit with success code
        sys.exit(0)
        
    except Exception as e:
        # Log error to stderr
        print(f"❌ Agent failed: {str(e)}", file=sys.stderr)
        
        # Write error output to stdout
        error_output = {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }
        write_output(error_output)
        
        # Exit with error code
        sys.exit(1)


if __name__ == "__main__":
    main()

