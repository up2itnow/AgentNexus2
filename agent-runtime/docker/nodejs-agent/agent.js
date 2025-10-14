#!/usr/bin/env node
/**
 * AgentNexus Node.js Agent Template
 * 
 * This is a template for creating Node.js-based agents. Agents receive input
 * via environment variables and write output to stdout as JSON.
 * 
 * AGENT CONTRACT:
 * ===============
 * 1. Read INPUT_DATA environment variable (JSON string)
 * 2. Process the data
 * 3. Write output to stdout as JSON
 * 4. Exit with code 0 for success, non-zero for failure
 * 
 * SECURITY:
 * =========
 * - No network access (container runs with --network=none)
 * - Read-only filesystem (except /tmp)
 * - Limited memory (512MB) and CPU (50%)
 * - Execution timeout (5 minutes)
 * 
 * EXAMPLE USAGE:
 * ==============
 * INPUT_DATA='{"query": "Hello, world!"}' node agent.js
 */

'use strict';

/**
 * Load input data from environment variable
 * @returns {Object} The parsed input data
 * @throws {Error} If INPUT_DATA is missing or invalid JSON
 */
function loadInput() {
  const inputDataStr = process.env.INPUT_DATA;
  
  if (!inputDataStr) {
    throw new Error('INPUT_DATA environment variable is required');
  }
  
  try {
    return JSON.parse(inputDataStr);
  } catch (error) {
    throw new Error(`Invalid JSON in INPUT_DATA: ${error.message}`);
  }
}

/**
 * Write output data to stdout as JSON
 * @param {Object} output - The output object to write
 */
function writeOutput(output) {
  console.log(JSON.stringify(output, null, 2));
}

/**
 * Main agent logic - customize this for your agent's functionality
 */
async function main() {
  try {
    // Load input data
    const inputData = loadInput();
    
    // Log to stderr (won't be captured as output, but visible in logs)
    console.error(`🤖 Agent started with input: ${JSON.stringify(inputData)}`);
    
    // ============================================================
    // YOUR AGENT LOGIC HERE
    // ============================================================
    // Example: Echo agent that returns input with a greeting
    
    const query = inputData.query || 'No query provided';
    
    const output = {
      status: 'success',
      message: `Hello! You said: ${query}`,
      input_received: inputData,
      agent_version: '1.0.0',
      timestamp: new Date().toISOString()
    };
    
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ============================================================
    // END OF AGENT LOGIC
    // ============================================================
    
    // Write output to stdout
    writeOutput(output);
    
    // Log completion
    console.error('✅ Agent completed successfully');
    
    // Exit with success code
    process.exit(0);
    
  } catch (error) {
    // Log error to stderr
    console.error(`❌ Agent failed: ${error.message}`);
    console.error(error.stack);
    
    // Write error output to stdout
    const errorOutput = {
      status: 'error',
      error: error.message,
      error_type: error.constructor.name
    };
    writeOutput(errorOutput);
    
    // Exit with error code
    process.exit(1);
  }
}

// Run the agent
main();

