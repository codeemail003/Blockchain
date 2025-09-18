-- Additional indexes for performance optimization
-- This migration adds composite indexes and specialized indexes

-- Composite indexes for common query patterns
CREATE INDEX idx_batches_manufacturer_status ON batches(manufacturer_id, status);
CREATE INDEX idx_batches_owner_status ON batches(current_owner_id, status);
CREATE INDEX idx_batches_drug_status ON batches(drug_name, status);
CREATE INDEX idx_batches_date_range ON batches(manufacture_date, expiry_date);

-- Partial indexes for active records
CREATE INDEX idx_batches_active ON batches(id) WHERE status != 'DISPENSED';
CREATE INDEX idx_users_active ON users(id) WHERE is_active = true;

-- Indexes for compliance queries
CREATE INDEX idx_compliance_logs_batch_type ON compliance_logs(batch_id, check_type);
CREATE INDEX idx_compliance_logs_auditor_timestamp ON compliance_logs(auditor_id, timestamp);
CREATE INDEX idx_compliance_logs_passed_timestamp ON compliance_logs(passed, timestamp);

-- Indexes for file queries
CREATE INDEX idx_files_type_uploaded_by ON files(file_type, uploaded_by);
CREATE INDEX idx_files_hash_type ON files(file_hash, file_type);

-- Indexes for audit queries
CREATE INDEX idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX idx_audit_logs_resource_action ON audit_logs(resource_type, action);
CREATE INDEX idx_audit_logs_timestamp_action ON audit_logs(created_at, action);

-- Full-text search indexes
CREATE INDEX idx_batches_drug_name_fts ON batches USING gin(to_tsvector('english', drug_name));
CREATE INDEX idx_batches_description_fts ON batches USING gin(to_tsvector('english', description));
CREATE INDEX idx_compliance_logs_notes_fts ON compliance_logs USING gin(to_tsvector('english', notes));

-- Indexes for blockchain queries
CREATE INDEX idx_batches_tx_hash_block ON batches(blockchain_tx_hash, blockchain_block_number);
CREATE INDEX idx_compliance_logs_tx_hash_block ON compliance_logs(blockchain_tx_hash, blockchain_block_number);
CREATE INDEX idx_batch_ownership_tx_hash_block ON batch_ownership_history(blockchain_tx_hash, blockchain_block_number);

-- Indexes for time-based queries
CREATE INDEX idx_batches_created_at_status ON batches(created_at, status);
CREATE INDEX idx_compliance_logs_timestamp_batch ON compliance_logs(timestamp, batch_id);
CREATE INDEX idx_audit_logs_created_at_user ON audit_logs(created_at, user_id);

-- Indexes for foreign key lookups
CREATE INDEX idx_batch_files_batch_file ON batch_files(batch_id, file_id);
CREATE INDEX idx_compliance_files_compliance_file ON compliance_files(compliance_log_id, file_id);

-- Indexes for system settings
CREATE INDEX idx_system_settings_key_public ON system_settings(key, is_public);

-- Create function for batch statistics
CREATE OR REPLACE FUNCTION get_batch_statistics(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_batches BIGINT,
    active_batches BIGINT,
    expired_batches BIGINT,
    recalled_batches BIGINT,
    total_quantity BIGINT,
    remaining_quantity BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_batches,
        COUNT(*) FILTER (WHERE status NOT IN ('DISPENSED', 'RECALLED')) as active_batches,
        COUNT(*) FILTER (WHERE expiry_date < CURRENT_DATE) as expired_batches,
        COUNT(*) FILTER (WHERE status = 'RECALLED') as recalled_batches,
        COALESCE(SUM(quantity), 0) as total_quantity,
        COALESCE(SUM(remaining_quantity), 0) as remaining_quantity
    FROM batches
    WHERE (p_user_id IS NULL OR manufacturer_id = p_user_id OR current_owner_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for compliance statistics
CREATE OR REPLACE FUNCTION get_compliance_statistics(p_batch_id UUID DEFAULT NULL)
RETURNS TABLE (
    total_checks BIGINT,
    passed_checks BIGINT,
    failed_checks BIGINT,
    compliance_rate NUMERIC,
    last_check_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_checks,
        COUNT(*) FILTER (WHERE passed = true) as passed_checks,
        COUNT(*) FILTER (WHERE passed = false) as failed_checks,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE passed = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
            ELSE 0
        END as compliance_rate,
        MAX(timestamp) as last_check_date
    FROM compliance_logs
    WHERE (p_batch_id IS NULL OR batch_id = p_batch_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for batch search
CREATE OR REPLACE FUNCTION search_batches(
    p_search_term TEXT DEFAULT '',
    p_status batch_status DEFAULT NULL,
    p_manufacturer_id UUID DEFAULT NULL,
    p_owner_id UUID DEFAULT NULL,
    p_drug_name TEXT DEFAULT '',
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    batch_id VARCHAR(100),
    drug_name VARCHAR(255),
    manufacturer_id UUID,
    current_owner_id UUID,
    status batch_status,
    quantity INTEGER,
    remaining_quantity INTEGER,
    manufacture_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.batch_id,
        b.drug_name,
        b.manufacturer_id,
        b.current_owner_id,
        b.status,
        b.quantity,
        b.remaining_quantity,
        b.manufacture_date,
        b.expiry_date,
        b.created_at,
        CASE 
            WHEN p_search_term = '' THEN 1.0
            ELSE ts_rank(
                to_tsvector('english', COALESCE(b.drug_name, '') || ' ' || COALESCE(b.description, '')),
                plainto_tsquery('english', p_search_term)
            )
        END as rank
    FROM batches b
    WHERE 
        (p_search_term = '' OR to_tsvector('english', COALESCE(b.drug_name, '') || ' ' || COALESCE(b.description, '')) @@ plainto_tsquery('english', p_search_term))
        AND (p_status IS NULL OR b.status = p_status)
        AND (p_manufacturer_id IS NULL OR b.manufacturer_id = p_manufacturer_id)
        AND (p_owner_id IS NULL OR b.current_owner_id = p_owner_id)
        AND (p_drug_name = '' OR b.drug_name ILIKE '%' || p_drug_name || '%')
    ORDER BY rank DESC, b.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for batch ownership chain
CREATE OR REPLACE FUNCTION get_batch_ownership_chain(p_batch_id UUID)
RETURNS TABLE (
    from_owner_id UUID,
    to_owner_id UUID,
    quantity INTEGER,
    transfer_reason TEXT,
    blockchain_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        boh.from_owner_id,
        boh.to_owner_id,
        boh.quantity,
        boh.transfer_reason,
        boh.blockchain_tx_hash,
        boh.created_at
    FROM batch_ownership_history boh
    WHERE boh.batch_id = p_batch_id
    ORDER BY boh.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for batch compliance history
CREATE OR REPLACE FUNCTION get_batch_compliance_history(p_batch_id UUID)
RETURNS TABLE (
    check_type compliance_check_type,
    passed BOOLEAN,
    timestamp TIMESTAMP WITH TIME ZONE,
    auditor_id UUID,
    notes TEXT,
    document_hash VARCHAR(66)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cl.check_type,
        cl.passed,
        cl.timestamp,
        cl.auditor_id,
        cl.notes,
        cl.document_hash
    FROM compliance_logs cl
    WHERE cl.batch_id = p_batch_id
    ORDER BY cl.timestamp DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;