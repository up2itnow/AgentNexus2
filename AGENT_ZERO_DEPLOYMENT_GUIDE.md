# Agent Zero Deployment Guide

**Target Environment:** Production  
**Last Updated:** October 10, 2025

---

## Pre-Deployment Checklist

### 1. Prerequisites

- [ ] Docker registry access (Docker Hub or private registry)
- [ ] Production database (PostgreSQL)
- [ ] Base mainnet deployment (or testnet for staging)
- [ ] Domain for tunnel service
- [ ] Monitoring infrastructure
- [ ] Backup solution

### 2. Environment Setup

- [ ] Production .env files configured
- [ ] API keys secured (Alchemy, OpenAI, Anthropic)
- [ ] Smart contract addresses verified
- [ ] Database migrations applied
- [ ] SSL certificates installed

### 3. Testing Complete

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] User acceptance testing done

---

## Step 1: Build Docker Images

### Build Agent Zero Quick Image

```bash
cd /Users/billwilson_home/Desktop/AgentNexus-V1/backend/docker

docker build -f agent-zero-quick.Dockerfile \
  -t agentnexus/agent-zero-quick:v1.0.0 \
  -t agentnexus/agent-zero-quick:latest \
  .

# Test locally
docker run -p 8080:80 agentnexus/agent-zero-quick:latest

# Verify health
curl http://localhost:8080/health
```

### Build Agent Zero Full Image

```bash
docker build -f agent-zero-full.Dockerfile \
  -t agentnexus/agent-zero-full:v1.0.0 \
  -t agentnexus/agent-zero-full:latest \
  .

# Test locally
docker run -p 50001:50001 agentnexus/agent-zero-full:latest

# Verify WebUI
open http://localhost:50001
```

### Push to Registry

```bash
# Login to Docker Hub
docker login

# Push images
docker push agentnexus/agent-zero-quick:v1.0.0
docker push agentnexus/agent-zero-quick:latest

docker push agentnexus/agent-zero-full:v1.0.0
docker push agentnexus/agent-zero-full:latest
```

---

## Step 2: Configure Production Environment

### Backend Production .env

```env
# Database
DATABASE_URL=postgresql://user:password@production-db:5432/agentnexus

# Network
CHAIN_ID=8453  # Base mainnet
BASE_RPC=https://mainnet.base.org

# Smart Contracts (Mainnet)
ESCROW_CONTRACT_ADDRESS=0x...
ENTITLEMENTS_CONTRACT_ADDRESS=0x...

# Agent Zero
AGENT_ZERO_BASIC_TOKEN_ID=0x...
AGENT_ZERO_PRO_TOKEN_ID=0x...
AGENT_ZERO_PRO_PRICE=50000000
AGENT_ZERO_QUICK_IMAGE=agentnexus/agent-zero-quick:v1.0.0
AGENT_ZERO_FULL_IMAGE=agentnexus/agent-zero-full:v1.0.0
AGENT_ZERO_BASIC_RATE_LIMIT=10
AGENT_ZERO_BASIC_TIMEOUT=300000
AGENT_ZERO_PRO_TIMEOUT=1800000
AGENT_ZERO_PRO_MAX_MEMORY=4GB

# API Keys (Use secrets management!)
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
ALCHEMY_API_KEY=${ALCHEMY_API_KEY}
```

### Frontend Production .env

```env
NEXT_PUBLIC_API_URL=https://api.agentnexus.io
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_BASE_RPC=https://mainnet.base.org
NEXT_PUBLIC_ESCROW_ADDRESS=0x...
NEXT_PUBLIC_ENTITLEMENTS_ADDRESS=0x...

# Agent Zero
NEXT_PUBLIC_AGENT_ZERO_BASIC_ID=0x...
NEXT_PUBLIC_AGENT_ZERO_PRO_ID=0x...
NEXT_PUBLIC_AGENT_ZERO_PRO_PRICE=50
NEXT_PUBLIC_AGENT_ZERO_ENABLED=true
```

---

## Step 3: Deploy Backend

### Option A: Traditional Server

```bash
# 1. Install Node.js and dependencies
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# 2. Clone and setup
cd /opt/agentnexus
git clone <your-repo> .
cd backend
pnpm install --production
pnpm prisma generate
pnpm prisma migrate deploy

# 3. Build
pnpm build

# 4. Setup PM2
npm install -g pm2
pm2 start dist/index.js --name agentnexus-backend
pm2 save
pm2 startup
```

### Option B: Docker Compose

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: agentnexus
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  backend:
    image: agentnexus/backend:latest
    ports:
      - "8200:8200"
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/agentnexus
      # ... other env vars
    depends_on:
      - postgres
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy:

```bash
docker-compose -f docker-compose.production.yml up -d
```

---

## Step 4: Deploy Frontend

### Vercel Deployment (Recommended)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
cd frontend
vercel --prod

# 3. Configure environment variables in Vercel dashboard
# Add all NEXT_PUBLIC_* variables
```

### Traditional Server

```bash
# 1. Build
cd frontend
pnpm build

# 2. Setup PM2
pm2 start npm --name agentnexus-frontend -- start
pm2 save
```

---

## Step 5: Configure Tunnel Service

For Pro tier instances to be accessible externally, set up a tunnel service.

### Option A: Cloudflare Tunnel

```bash
# 1. Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared
sudo chmod +x /usr/local/bin/cloudflared

# 2. Authenticate
cloudflared tunnel login

# 3. Create tunnel
cloudflared tunnel create agentnexus-agent-zero

# 4. Configure
cat > ~/.cloudflared/config.yml <<EOF
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: "*.agent-zero.agentnexus.io"
    service: http://localhost:50001
  - service: http_status:404
EOF

# 5. Run as service
cloudflared service install
systemctl start cloudflared
```

### Option B: ngrok (Development/Testing)

```bash
# 1. Install ngrok
npm install -g ngrok

# 2. Start tunnel
ngrok http 50001

# 3. Update TUNNEL_URL in instance manager
```

---

## Step 6: Set Up Monitoring

### Prometheus + Grafana

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'agentnexus'
    static_configs:
      - targets: ['localhost:8200']
```

### Metrics to Monitor

- Container count (active instances)
- Execution duration
- Rate limit hits
- Error rates
- Resource usage (CPU, memory, storage)
- API latency

### Alerts

```yaml
# Alert rules
groups:
  - name: agent_zero
    rules:
      - alert: HighContainerCount
        expr: agent_zero_containers > 100
        for: 5m
        annotations:
          summary: "Too many Agent Zero containers"

      - alert: RateLimitExhausted
        expr: rate(agent_zero_rate_limit_hits[5m]) > 100
        annotations:
          summary: "High rate limit exhaustion"
```

---

## Step 7: Backup Strategy

### Database Backups

```bash
# Daily backup script
#!/bin/bash
pg_dump $DATABASE_URL | gzip > /backups/agentnexus-$(date +%Y%m%d).sql.gz

# Keep last 30 days
find /backups -name "agentnexus-*.sql.gz" -mtime +30 -delete
```

### Container Volumes

```bash
# Backup persistent volumes
docker run --rm \
  -v agent-zero-memory-<instance-id>:/data \
  -v /backups:/backup \
  alpine tar czf /backup/instance-<id>-$(date +%Y%m%d).tar.gz /data
```

### Automated Backups

Set up cron jobs:

```cron
# Daily database backup at 2 AM
0 2 * * * /opt/agentnexus/scripts/backup-db.sh

# Weekly volume backup on Sunday at 3 AM
0 3 * * 0 /opt/agentnexus/scripts/backup-volumes.sh
```

---

## Step 8: Security Hardening

### Firewall Rules

```bash
# UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8200/tcp  # Backend API
sudo ufw enable
```

### Docker Security

```bash
# Run containers as non-root
# Already configured in Dockerfiles

# Limit container resources
docker run --memory="4g" --cpus="2.0" ...

# Use read-only filesystem where possible
# Already configured in Dockerfiles
```

### API Rate Limiting

Already implemented in `AgentZeroTierService`, but add IP-based rate limiting:

```typescript
// In Express middleware
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/agent-zero', limiter);
```

---

## Step 9: Post-Deployment Verification

### Smoke Tests

```bash
# 1. Health check
curl https://api.agentnexus.io/health

# 2. Agent Zero quick execution
curl -X POST https://api.agentnexus.io/api/agent-zero/execute \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","prompt":"Hello"}'

# 3. Rate limit check
curl https://api.agentnexus.io/api/agent-zero/rate-limit?userId=test

# 4. Frontend accessible
curl https://agentnexus.io/marketplace/agent-zero
```

### Performance Tests

```bash
# Load test with k6
k6 run load-test.js

# Monitor response times
ab -n 1000 -c 10 https://api.agentnexus.io/api/agent-zero/tier?userId=test
```

---

## Step 10: Go Live

### Pre-Launch

- [ ] All tests passing
- [ ] Monitoring active
- [ ] Backups configured
- [ ] Documentation updated
- [ ] Team trained
- [ ] Support channels ready

### Launch

1. Deploy to production
2. Monitor for 24 hours
3. Address any issues
4. Announce to users
5. Collect feedback

### Post-Launch

- Monitor metrics daily
- Review logs for errors
- Optimize based on usage
- Plan next iteration

---

## Rollback Procedure

If issues arise:

```bash
# 1. Rollback Docker images
docker pull agentnexus/agent-zero-quick:v0.9.0
docker pull agentnexus/agent-zero-full:v0.9.0

# 2. Update backend to previous version
cd /opt/agentnexus/backend
git checkout v0.9.0
pnpm install
pnpm build
pm2 restart agentnexus-backend

# 3. Rollback database migration (if needed)
pnpm prisma migrate resolve --rolled-back <migration-name>

# 4. Verify
curl https://api.agentnexus.io/health
```

---

## Maintenance

### Weekly Tasks

- Review error logs
- Check resource usage
- Verify backup integrity
- Update dependencies

### Monthly Tasks

- Security updates
- Performance optimization
- Cost analysis
- User feedback review

### Quarterly Tasks

- Major version upgrades
- Architecture review
- Capacity planning
- Disaster recovery drill

---

## Support Contacts

- **Infrastructure:** devops@agentnexus.io
- **Backend:** backend@agentnexus.io
- **Frontend:** frontend@agentnexus.io
- **Emergency:** oncall@agentnexus.io

---

## Appendix: Troubleshooting

### Issue: Containers not starting

**Check:**
```bash
docker ps -a
docker logs <container-id>
```

**Common causes:**
- Image not found
- Port already in use
- Resource limits exceeded
- Volume mount issues

### Issue: High memory usage

**Solution:**
- Implement auto-pause for idle instances
- Set memory limits on containers
- Clean up old containers

### Issue: Slow execution

**Solution:**
- Scale Docker host
- Optimize Agent Zero configuration
- Use faster storage for volumes

---

**Deployment Status:** Ready for Production  
**Last Verified:** October 10, 2025  
**Next Review:** After first production deployment

