# 📊 AgentNexus Monitoring & Observability

Complete observability stack for real-time monitoring of agent executions, system health, and business metrics.

---

## 🎯 Overview

The AgentNexus monitoring system provides three layers of observability:

1. **Real-Time Streaming** (WebSocket) - Live log streaming to clients
2. **Metrics Collection** (Prometheus) - Time-series metrics for analysis
3. **Visualization** (Grafana) - Beautiful dashboards for monitoring

---

## 🔌 WebSocket Streaming

### Features

- Real-time log streaming during agent execution
- Execution status updates (PENDING → RUNNING → COMPLETED/FAILED)
- Resource usage metrics (memory, CPU)
- Automatic reconnection support
- Ping/pong heartbeat (30s interval, 60s timeout)

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');

ws.onopen = () => {
  // Subscribe to execution
  ws.send(JSON.stringify({
    type: 'subscribe',
    executionId: 'exec_123'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  switch (message.type) {
    case 'log':
      console.log('[LOG]', message.data.log);
      break;
    case 'status':
      console.log('[STATUS]', message.data.status);
      break;
    case 'metrics':
      console.log('[METRICS]', message.data);
      break;
  }
};
```

### Message Types

#### Subscribe to Execution

```json
{
  "type": "subscribe",
  "executionId": "exec_123"
}
```

#### Unsubscribe from Execution

```json
{
  "type": "unsubscribe",
  "executionId": "exec_123"
}
```

#### Log Message (Server → Client)

```json
{
  "type": "log",
  "executionId": "exec_123",
  "data": {
    "log": "Container started"
  },
  "timestamp": 1696656000000
}
```

#### Status Update (Server → Client)

```json
{
  "type": "status",
  "executionId": "exec_123",
  "data": {
    "status": "COMPLETED",
    "output": { "result": "..." }
  },
  "timestamp": 1696656000000
}
```

#### Metrics Update (Server → Client)

```json
{
  "type": "metrics",
  "executionId": "exec_123",
  "data": {
    "memoryUsage": 134217728,
    "cpuUsage": 45.2,
    "duration": 5230
  },
  "timestamp": 1696656000000
}
```

---

## 📈 Prometheus Metrics

### Available Metrics

#### Execution Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `agentnexus_executions_total` | Counter | Total agent executions | `agent_id`, `agent_name`, `user_id` |
| `agentnexus_execution_duration_seconds` | Histogram | Execution duration distribution | `agent_id`, `agent_name`, `status` |
| `agentnexus_execution_status_total` | Counter | Executions by status | `status`, `agent_id` |
| `agentnexus_agent_running_executions` | Gauge | Currently running executions | `agent_id`, `agent_name` |

#### Business Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `agentnexus_agent_revenue_wei` | Counter | Total revenue per agent | `agent_id`, `agent_name` |

#### System Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `agentnexus_active_websocket_connections` | Gauge | Active WS connections | - |
| `agentnexus_docker_healthy` | Gauge | Docker health (1=healthy) | - |

#### Resource Metrics

| Metric | Type | Description | Labels |
|--------|------|-------------|--------|
| `agentnexus_container_memory_bytes` | Gauge | Container memory usage | `execution_id`, `agent_id` |
| `agentnexus_container_cpu_percent` | Gauge | Container CPU usage | `execution_id`, `agent_id` |

#### Node.js Metrics (Default)

- `nodejs_heap_size_used_bytes` - Heap memory used
- `nodejs_heap_size_total_bytes` - Total heap memory
- `nodejs_eventloop_lag_seconds` - Event loop lag
- `nodejs_active_handles_total` - Active handles
- `nodejs_gc_duration_seconds` - GC duration
- And many more...

### Accessing Metrics

#### Prometheus Format (for scraping)

```bash
curl http://localhost:3001/metrics
```

#### JSON Format (for debugging)

```bash
curl http://localhost:3001/metrics/json
```

### Example Queries

```promql
# Total executions in last 5 minutes
sum(rate(agentnexus_executions_total[5m])) * 300

# Success rate
sum(agentnexus_execution_status_total{status="COMPLETED"}) 
/ sum(agentnexus_execution_status_total) * 100

# 95th percentile execution duration
histogram_quantile(0.95, 
  sum(rate(agentnexus_execution_duration_seconds_bucket[5m])) by (le)
)

# Top 5 agents by execution count
topk(5, sum by (agent_name) (agentnexus_executions_total))

# Total revenue
sum(agentnexus_agent_revenue_wei)
```

---

## 🎨 Grafana Dashboard

### Quick Start

1. **Start monitoring stack:**
   ```bash
   cd agent-runtime/monitoring
   docker-compose up -d
   ```

2. **Access Grafana:**
   - URL: http://localhost:3000
   - Username: `admin`
   - Password: `admin`

3. **View dashboard:**
   - Navigate to Dashboards → AgentNexus - Agent Execution Metrics

### Dashboard Panels

#### Overview

1. **Total Executions** - Lifetime execution count
2. **Success Rate** - Percentage of successful executions
3. **Average Duration** - Median execution time
4. **Active Connections** - Live WebSocket connections

#### Performance

5. **Executions per Minute** - Real-time execution rate
6. **Duration Percentiles** - p50, p95, p99 latencies

#### Analysis

7. **Status Breakdown** - Pie chart of COMPLETED/FAILED/PENDING
8. **Top Agents** - Most popular agents by execution count
9. **Total Revenue** - Cumulative revenue in Wei

#### Resources

10. **Container Memory** - Memory usage per execution
11. **Container CPU** - CPU usage per execution

#### Health

12. **Docker Health** - Docker daemon status
13. **Node.js Memory** - Backend heap usage
14. **Event Loop Lag** - Backend performance

### Customization

Edit `grafana-dashboard.json` to:
- Add new panels
- Modify queries
- Change thresholds
- Adjust layouts

---

## 🏥 Health Checks

### Liveness Probe

**Endpoint:** `GET /health`

Checks if the service is running. Always returns 200 OK.

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "service": {
      "status": "ok",
      "message": "Service is running"
    }
  }
}
```

### Readiness Probe

**Endpoint:** `GET /health/ready`

Checks if the service can handle traffic. Verifies:
- Database connection
- Docker daemon availability
- Memory usage (< 90%)
- WebSocket server operational

```bash
curl http://localhost:3001/health/ready
```

**Response (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-07T12:00:00.000Z",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "ok",
      "message": "Database connection healthy"
    },
    "docker": {
      "status": "ok",
      "message": "Docker daemon available"
    },
    "memory": {
      "status": "ok",
      "message": "Memory usage normal",
      "details": {
        "heapUsedPercent": "45.23",
        "heapUsedMB": "120.50",
        "heapTotalMB": "266.00"
      }
    },
    "websocket": {
      "status": "ok",
      "message": "WebSocket server operational",
      "details": {
        "activeConnections": 5
      }
    }
  }
}
```

**Response (Degraded - 200 OK):**
```json
{
  "status": "degraded",
  "checks": {
    "docker": {
      "status": "error",
      "message": "Docker daemon unavailable"
    }
  }
}
```

**Response (Unhealthy - 503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "error",
      "message": "Database connection failed"
    }
  }
}
```

### Kubernetes-Style Probes

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## 🚀 Deployment

### Docker Compose (Development)

```bash
# Start monitoring stack
cd agent-runtime/monitoring
docker-compose up -d

# View logs
docker-compose logs -f

# Stop stack
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

### Kubernetes (Production)

```yaml
# Example Deployment with health checks
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentnexus-backend
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: backend
        image: agentnexus-backend:latest
        ports:
        - containerPort: 3001
        livenessProbe:
          httpGet:
            path: /health/live
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 3001
          initialDelaySeconds: 10
          periodSeconds: 5
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
```

---

## 📊 Monitoring Best Practices

### Alerting

Set up alerts for:

- **High Error Rate:** > 5% failed executions
- **Slow Executions:** p95 duration > 30s
- **Resource Usage:** Memory > 80%, CPU > 80%
- **Docker Down:** Docker health = 0
- **Database Down:** DB connection fails

### Retention

- **Prometheus:** 15 days of metrics (configurable)
- **Grafana:** Dashboards backed up to Git
- **WebSocket:** Logs not persisted (use execution records)

### Performance

- **Scrape Interval:** 15s default (10s for backend)
- **Evaluation Interval:** 15s
- **Query Timeout:** 60s
- **WebSocket Heartbeat:** 30s (60s timeout)

---

## 🧪 Testing

### WebSocket Connection Test

```javascript
// test-websocket.js
const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', () => {
  console.log('✅ Connected');
  
  ws.send(JSON.stringify({
    type: 'subscribe',
    executionId: 'test_123'
  }));
});

ws.on('message', (data) => {
  console.log('📥', data.toString());
});

ws.on('close', () => {
  console.log('❌ Disconnected');
});
```

```bash
node test-websocket.js
```

### Metrics Test

```bash
# Check metrics endpoint
curl http://localhost:3001/metrics | grep agentnexus

# Check health
curl http://localhost:3001/health/ready | jq

# Load test (optional)
artillery quick --count 10 --num 100 http://localhost:3001/health
```

---

## 📚 References

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [WebSocket API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [Kubernetes Health Checks](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)

---

## 🔧 Troubleshooting

### WebSocket Connection Issues

**Problem:** Cannot connect to WebSocket

**Solution:**
1. Check backend is running: `curl http://localhost:3001/health`
2. Verify WebSocket path: `/ws`
3. Check firewall/proxy settings
4. Ensure CORS is configured

### Prometheus Not Scraping

**Problem:** No metrics in Prometheus

**Solution:**
1. Check target status: http://localhost:9090/targets
2. Verify backend metrics: `curl http://localhost:3001/metrics`
3. Check `prometheus.yml` configuration
4. Ensure `host.docker.internal` resolves

### Grafana Dashboard Empty

**Problem:** Dashboard shows no data

**Solution:**
1. Check Prometheus datasource: Configuration → Data Sources
2. Verify Prometheus is running: http://localhost:9090
3. Test query in Prometheus UI
4. Check dashboard time range

---

*Monitoring system built with  Observability Expert*  
*AgentNexus Team - October 2025*

