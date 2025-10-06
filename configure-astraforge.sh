#!/bin/bash

# Configuration script for AstraForge + AgentNexus development

echo "🚀 AgentNexus + AstraForge Configuration"
echo "========================================="
echo ""

# Check if API key is configured
ASTRAFORGE_DIR="/Users/billwilson_home/Desktop/AstraForge-3.0.0"
ENV_FILE="$ASTRAFORGE_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: .env file not found at $ENV_FILE"
    exit 1
fi

# Check API key
API_KEY=$(grep "^OPENROUTER_API_KEY=" "$ENV_FILE" | cut -d'=' -f2)

if [[ "$API_KEY" == "REPLACE_ME_WITH_YOUR_ACTUAL"* ]]; then
    echo "⚠️  Warning: OpenRouter API key appears to be a placeholder"
    echo ""
    echo "Please update your API key in:"
    echo "  $ENV_FILE"
    echo ""
    echo "Replace the OPENROUTER_API_KEY value with your actual key from:"
    echo "  https://openrouter.ai/keys"
    echo ""
    read -p "Have you updated the API key? (y/n): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Please update the API key and run this script again."
        exit 1
    fi
fi

echo "✅ API key configuration looks good!"
echo ""

# Verify models are configured
MODELS=$(grep "^OPENROUTER_MODELS_TO_USE=" "$ENV_FILE" | cut -d'=' -f2)
echo "📋 Configured models:"
echo "  $MODELS"
echo ""

# Check if AstraForge is built
if [ ! -d "$ASTRAFORGE_DIR/out" ]; then
    echo "🔨 Building AstraForge extension..."
    cd "$ASTRAFORGE_DIR"
    npm run compile
    if [ $? -ne 0 ]; then
        echo "❌ Failed to build AstraForge"
        exit 1
    fi
    echo "✅ AstraForge built successfully"
fi

echo ""
echo "========================================="
echo "✨ Configuration Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Open VS Code: code /Users/billwilson_home/Desktop/AgentNexus-V1"
echo "2. Ensure AstraForge extension is activated"
echo "3. Open Project Ignition panel in sidebar"
echo "4. Copy content from ASTRAFORGE_PROMPT.md"
echo "5. Paste into Project Ignition and click Submit"
echo ""
echo "Or run the automated start script:"
echo "  cd /Users/billwilson_home/Desktop/AgentNexus-V1"
echo "  ./start-development.sh"
echo ""

