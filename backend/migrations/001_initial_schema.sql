-- PharbitChain Database Schema
-- Initial migration for pharmaceutical blockchain system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM (
    'manufacturer',
    'distributor', 
    'pharmacy',
    'regulator',
    'auditor',
    'admin'
);

CREATE TYPE batch_status AS ENUM (
    'CREATED',
    'IN_TRANSIT',
    'RECEIVED',
    'IN_STORAGE',
    'DISPENSED',
    'RECALLED'
);

CREATE TYPE compliance_check_type AS ENUM (
    'FDA_APPROVAL',
    'QUALITY_CONTROL',
    'TEMPERATURE_CHECK',
    'PACKAGING_INSPECTION',
    'EXPIRY_VERIFICATION',
    'AUTHENTICITY_CHECK',
    'CUSTOM'
);

CREATE TYPE file_type AS ENUM (
    'CERTIFICATE',
    'INVOICE',
    'MANIFEST',
    'QUALITY_REPORT',
    'COMPLIANCE_DOCUMENT',
    'IMAGE',
    'OTHER'
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'manufacturer',
    wallet_address VARCHAR(42) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company_name VARCHAR(255),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batches table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id VARCHAR(100) UNIQUE NOT NULL,
    drug_name VARCHAR(255) NOT NULL,
    manufacturer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    current_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    remaining_quantity INTEGER NOT NULL CHECK (remaining_quantity >= 0),
    status batch_status NOT NULL DEFAULT 'CREATED',
    batch_number VARCHAR(100),
    description TEXT,
    drug_code VARCHAR(50),
    dosage_form VARCHAR(100),
    strength VARCHAR(100),
    lot_number VARCHAR(100),
    serial_number VARCHAR(100),
    temperature_range JSONB,
    storage_conditions TEXT,
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch ownership history
CREATE TABLE batch_ownership_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    from_owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
    to_owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    transfer_reason TEXT,
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance logs
CREATE TABLE compliance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    check_type compliance_check_type NOT NULL,
    passed BOOLEAN NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    auditor_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    notes TEXT,
    document_hash VARCHAR(66),
    blockchain_tx_hash VARCHAR(66),
    blockchain_block_number BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type file_type NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL CHECK (file_size > 0),
    file_hash VARCHAR(66) NOT NULL,
    s3_bucket VARCHAR(100),
    s3_key VARCHAR(500),
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch files relationship
CREATE TABLE batch_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    file_purpose VARCHAR(100),
    is_required BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(batch_id, file_id)
);

-- Compliance files relationship
CREATE TABLE compliance_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    compliance_log_id UUID NOT NULL REFERENCES compliance_logs(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(compliance_log_id, file_id)
);

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet_address ON users(wallet_address);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_company_name ON users(company_name);

CREATE INDEX idx_batches_batch_id ON batches(batch_id);
CREATE INDEX idx_batches_manufacturer_id ON batches(manufacturer_id);
CREATE INDEX idx_batches_current_owner_id ON batches(current_owner_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_drug_name ON batches(drug_name);
CREATE INDEX idx_batches_manufacture_date ON batches(manufacture_date);
CREATE INDEX idx_batches_expiry_date ON batches(expiry_date);
CREATE INDEX idx_batches_blockchain_tx_hash ON batches(blockchain_tx_hash);

CREATE INDEX idx_batch_ownership_history_batch_id ON batch_ownership_history(batch_id);
CREATE INDEX idx_batch_ownership_history_from_owner_id ON batch_ownership_history(from_owner_id);
CREATE INDEX idx_batch_ownership_history_to_owner_id ON batch_ownership_history(to_owner_id);
CREATE INDEX idx_batch_ownership_history_created_at ON batch_ownership_history(created_at);

CREATE INDEX idx_compliance_logs_batch_id ON compliance_logs(batch_id);
CREATE INDEX idx_compliance_logs_auditor_id ON compliance_logs(auditor_id);
CREATE INDEX idx_compliance_logs_check_type ON compliance_logs(check_type);
CREATE INDEX idx_compliance_logs_passed ON compliance_logs(passed);
CREATE INDEX idx_compliance_logs_timestamp ON compliance_logs(timestamp);

CREATE INDEX idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX idx_files_file_type ON files(file_type);
CREATE INDEX idx_files_file_hash ON files(file_hash);
CREATE INDEX idx_files_created_at ON files(created_at);

CREATE INDEX idx_batch_files_batch_id ON batch_files(batch_id);
CREATE INDEX idx_batch_files_file_id ON batch_files(file_id);

CREATE INDEX idx_compliance_files_compliance_log_id ON compliance_files(compliance_log_id);
CREATE INDEX idx_compliance_files_file_id ON compliance_files(file_id);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_compliance_logs_updated_at BEFORE UPDATE ON compliance_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();