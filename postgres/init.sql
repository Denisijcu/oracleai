-- OracleAI Database Schema
-- HTB Machine: OracleAI (Hard Linux)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'analyst',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Decisions table
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    input_data TEXT NOT NULL,
    ai_response TEXT,
    confidence FLOAT,
    status VARCHAR(20) DEFAULT 'pending',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Internal config (HTB VULN: accessible post-auth)
CREATE TABLE system_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    is_sensitive BOOLEAN DEFAULT false
);

-- Seed users
-- HTB: admin creds discoverable via GraphQL introspection + batching
INSERT INTO users (username, email, password_hash, role) VALUES
('admin',    'admin@oracleai.htb',   '$2b$12$oracle.admin.hash.2026',    'admin'),
('analyst1', 'analyst1@oracleai.htb','$2b$12$oracle.analyst1.hash.2026', 'analyst'),
('oracleuser','oracle@oracleai.htb', '$2b$12$oracle.user.hash.2026',     'user');

-- Seed config (HTB: internal API keys exposed)
INSERT INTO system_config VALUES
('ai_engine_url',      'http://ai-engine:8000',            false),
('admin_api_key',      'oracle-admin-internal-9f3a',       true),
('db_backup_path',     '/opt/oracle/backups',              false),
('ssh_key_path',       '/home/oracleuser/.ssh/id_rsa',     true),
('internal_api_secret','OracleInternal@2026!',             true);

-- Seed decisions
INSERT INTO decisions (title, input_data, ai_response, confidence, status) VALUES
('Q3 Budget Approval', 'Analyze Q3 budget of $2.4M for AI infrastructure', 'APPROVED — High ROI projected', 0.94, 'completed'),
('Vendor Selection',   'Evaluate 3 AI vendors for enterprise deployment',   'RECOMMEND Vendor A',            0.87, 'completed'),
('Risk Assessment',    'Assess cybersecurity risk for new deployment',       'MEDIUM RISK — mitigations needed',0.72,'pending');

-- HTB: flag table (only accessible as root/admin)
CREATE TABLE flags (
    name VARCHAR(50) PRIMARY KEY,
    value VARCHAR(100) NOT NULL
);

INSERT INTO flags VALUES
('user_flag', '7a3f9d2c1b8e4f0a6d5c9b2e1d3f4a7b'),
('root_flag', 'PLACEHOLDER_ROOT_FLAG');
