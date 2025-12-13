"""
AgentNexus Summarizer Agent
Sprint 1 Reference Agent - Deterministic Utility

This is the simplest possible agent for Sprint 1 demo:
- Receives text input
- Returns a summary (first 200 chars)
- No external dependencies
- No network access
- Deterministic output

GRANT LANGUAGE:
"Agents execute in constrained, sandboxed runtimes."
"""

import json
import sys
from typing import Any


def run(input_text: str) -> dict[str, Any]:
    """
    Summarize input text.
    
    Args:
        input_text: Text to summarize
        
    Returns:
        dict with summary and confidence score
    """
    if not input_text or not isinstance(input_text, str):
        return {
            "error": "Invalid input: expected non-empty string",
            "confidence": 0.0
        }
    
    # Simple summarization: first 200 characters with ellipsis
    summary = input_text[:200].strip()
    if len(input_text) > 200:
        summary = summary.rsplit(' ', 1)[0] + '...'
    
    # Word count for basic stats
    word_count = len(input_text.split())
    char_count = len(input_text)
    
    return {
        "summary": summary,
        "word_count": word_count,
        "char_count": char_count,
        "compression_ratio": round(len(summary) / max(char_count, 1), 2),
        "confidence": 0.99  # High confidence for deterministic output
    }


def main():
    """
    Main entry point for container execution.
    Reads JSON input from stdin, writes JSON output to stdout.
    """
    # Demo input for when running without stdin
    demo_input = {
        "text": "AgentNexus is a revolutionary platform that enables secure, "
                "trustless execution of AI agents on blockchain. Users can "
                "purchase agent access through smart contract escrow, ensuring "
                "safe payment settlement. This demo shows the complete flow "
                "from wallet creation to agent execution."
    }
    
    try:
        # Read input from stdin or use demo
        if sys.stdin.isatty():
            # Interactive mode - use demo input
            print("[Demo mode - TTY detected, using sample input]", file=sys.stderr)
            input_data = demo_input
        else:
            # Try to read from stdin pipe
            raw_input = sys.stdin.read().strip()
            if raw_input:
                try:
                    input_data = json.loads(raw_input)
                except json.JSONDecodeError:
                    print("[Demo mode - invalid JSON, using sample input]", file=sys.stderr)
                    input_data = demo_input
            else:
                print("[Demo mode - empty stdin, using sample input]", file=sys.stderr)
                input_data = demo_input
        
        # Extract text from input
        text = input_data.get("text", str(input_data))
        
        # Run agent
        result = run(text)
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        print(json.dumps({
            "error": f"Execution failed: {str(e)}",
            "confidence": 0.0
        }))
        sys.exit(1)


if __name__ == "__main__":
    main()
