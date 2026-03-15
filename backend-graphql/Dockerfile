FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssh-client curl && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY src/ .

# HTB: oracleuser for lateral movement
RUN useradd -m -s /bin/bash oracleuser && \
    echo "oracleuser:0r4cl3Us3r!" | chpasswd

# HTB: user flag
RUN mkdir -p /home/oracleuser && \
    echo "7a3f9d2c1b8e4f0a6d5c9b2e1d3f4a7b" > /home/oracleuser/user.txt && \
    chown oracleuser:oracleuser /home/oracleuser/user.txt

# HTB VULN: config file with hardcoded creds (discoverable post-RCE)
RUN mkdir -p /opt/oracle && cat > /opt/oracle/config.py << 'EOF'
# OracleAI Internal Configuration
# DO NOT COMMIT TO VERSION CONTROL

DATABASE_URL = "postgresql://oracle:0r4cl3P4ss2026@postgres:5432/oracledb"
AI_ENGINE_SECRET = "OracleInternal@2026!"
ADMIN_API_KEY = "oracle-admin-internal-9f3a"
SSH_KEY_PATH = "/home/oracleuser/.ssh/id_rsa"

# Internal service map
SERVICES = {
    "graphql":   "http://localhost:4000",
    "ai_engine": "http://ai-engine:8000",
    "postgres":  "postgres:5432",
}
EOF

# HTB: sudo node NOPASSWD privesc vector
RUN echo "oracleuser ALL=(root) NOPASSWD: /usr/bin/node" >> /etc/sudoers

# HTB: root flag
RUN echo "f2a9c4e7b1d3f8a0c5e2b4d7f1a3c6e9" > /root/root.txt

EXPOSE 4000
CMD ["python", "main.py"]
