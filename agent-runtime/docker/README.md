# AgentNexus Agent Docker Templates

This directory contains Docker templates for creating AgentNexus-compatible agents in different programming languages.

## 📋 Agent Contract

All agents must follow this contract to work with AgentNexus:

### Input
- Read `INPUT_DATA` environment variable (JSON string)
- Parse the JSON and extract required fields

### Processing
- Execute agent logic
- Log progress to stderr (visible in execution logs)

### Output
- Write result to stdout as JSON
- Exit with code 0 for success, non-zero for failure

### Security Requirements
- Run as non-root user (UID 1000)
- Support read-only filesystem (write only to /tmp)
- Handle no network access (--network=none)
- Respect resource limits (512MB RAM, 50% CPU)

---

## 🐍 Python Agent

**Location:** `python-agent/`

### Build Image
```bash
cd python-agent
docker build -t agentnexus-python-echo:v1 .
```

### Test Locally
```bash
docker run --rm \
  -e INPUT_DATA='{"query": "Hello from Python!"}' \
  agentnexus-python-echo:v1
```

### Customize
1. Edit `requirements.txt` to add dependencies
2. Modify `agent.py` with your logic
3. Rebuild the image

---

## 🟢 Node.js Agent

**Location:** `nodejs-agent/`

### Build Image
```bash
cd nodejs-agent
docker build -t agentnexus-nodejs-echo:v1 .
```

### Test Locally
```bash
docker run --rm \
  -e INPUT_DATA='{"query": "Hello from Node.js!"}' \
  agentnexus-nodejs-echo:v1
```

### Customize
1. Edit `package.json` to add dependencies
2. Modify `agent.js` with your logic
3. Rebuild the image

---

## 🐚 Shell Script Agent

**Location:** `shell-agent/`

### Build Image
```bash
cd shell-agent
docker build -t agentnexus-shell-echo:v1 .
```

### Test Locally
```bash
docker run --rm \
  -e INPUT_DATA='{"query": "Hello from Shell!"}' \
  agentnexus-shell-echo:v1
```

### Customize
1. Modify `agent.sh` with your logic
2. Keep using `jq` for JSON processing
3. Rebuild the image

---

## 🚀 Publishing to GitHub Container Registry

### 1. Authenticate with GitHub
```bash
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### 2. Tag Your Image
```bash
docker tag agentnexus-python-echo:v1 ghcr.io/USERNAME/agentnexus-python-echo:v1
```

### 3. Push to Registry
```bash
docker push ghcr.io/USERNAME/agentnexus-python-echo:v1
```

### 4. Make Image Public
- Go to https://github.com/USERNAME?tab=packages
- Select your package
- Settings → Change visibility → Public

---

## 🔒 Security Best Practices

### Image Scanning
Always scan your images before publishing:
```bash
# Install Trivy
brew install trivy  # macOS
# or
apt-get install trivy  # Linux

# Scan image
trivy image agentnexus-python-echo:v1
```

### Minimal Base Images
- Python: Use `python:3.11-alpine` (not `python:3.11`)
- Node.js: Use `node:20-alpine` (not `node:20`)
- Shell: Use `alpine:3.19` (not `ubuntu`)

### Security Checklist
- [ ] Run as non-root user
- [ ] Use minimal base image (alpine)
- [ ] No HIGH/CRITICAL vulnerabilities in scan
- [ ] No hardcoded secrets or API keys
- [ ] Dependencies pinned to specific versions
- [ ] Multi-stage build to reduce image size
- [ ] .dockerignore to exclude unnecessary files

---

## 📊 Example: Data Processing Agent

```python
# agent.py
import json
import os

input_data = json.loads(os.environ['INPUT_DATA'])
numbers = input_data['numbers']

result = {
    "sum": sum(numbers),
    "average": sum(numbers) / len(numbers),
    "min": min(numbers),
    "max": max(numbers)
}

print(json.dumps(result))
```

**Input:**
```json
{
  "numbers": [1, 2, 3, 4, 5]
}
```

**Output:**
```json
{
  "sum": 15,
  "average": 3.0,
  "min": 1,
  "max": 5
}
```

---

## 🧪 Testing Your Agent

### Unit Test (Outside Container)
```bash
# Python
INPUT_DATA='{"query": "test"}' python agent.py

# Node.js
INPUT_DATA='{"query": "test"}' node agent.js

# Shell
INPUT_DATA='{"query": "test"}' ./agent.sh
```

### Integration Test (In Container)
```bash
docker run --rm \
  --memory 512m \
  --cpus 0.5 \
  --network none \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --user 1000:1000 \
  -e INPUT_DATA='{"query": "test"}' \
  agentnexus-python-echo:v1
```

### Timeout Test
```bash
# Agent should terminate within 5 minutes
timeout 300 docker run --rm \
  -e INPUT_DATA='{"query": "test"}' \
  agentnexus-python-echo:v1
```

---

## 📦 Image Naming Convention

```
ghcr.io/ORGANIZATION/agentnexus-AGENTNAME:VERSION

Examples:
- ghcr.io/mycompany/agentnexus-sentiment-analyzer:v1.0.0
- ghcr.io/mycompany/agentnexus-price-oracle:v2.1.5
- ghcr.io/mycompany/agentnexus-nft-metadata:latest
```

---

## 🐛 Troubleshooting

### Agent Exits Immediately
- Check if `CMD` in Dockerfile is correct
- Ensure script has execute permissions (`chmod +x`)
- Verify shebang line (`#!/usr/bin/env python3`)

### JSON Parse Error
- Validate INPUT_DATA is proper JSON
- Check for escaped quotes in JSON string
- Use `jq` to validate: `echo $INPUT_DATA | jq .`

### Permission Denied
- Ensure agent runs as non-root user
- Check /tmp permissions: `RUN chown agent:agent /tmp`
- Verify output directory is writable

### Out of Memory
- Reduce memory usage in agent code
- Request higher limit (max 1GB for premium agents)
- Use streaming for large datasets

---

## 📚 Additional Resources

- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Alpine Linux](https://alpinelinux.org/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Trivy Security Scanner](https://github.com/aquasecurity/trivy)

---

*Built with ❤️ by AgentNexus Team*

