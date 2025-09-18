-- Row Level Security (RLS) Policies for PharbitChain
-- This migration sets up RLS policies for data protection

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_ownership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.user_id()
RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.jwt.claims', true)::json->>'user_id'
    )::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create helper function to get current user role
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'role',
        'anonymous'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (id = auth.user_id());

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (id = auth.user_id());

CREATE POLICY "Admins can view all users" ON users
    FOR SELECT USING (auth.user_role() = 'admin');

CREATE POLICY "Admins can manage all users" ON users
    FOR ALL USING (auth.user_role() = 'admin');

-- Batches table policies
CREATE POLICY "Users can view batches they own or are involved with" ON batches
    FOR SELECT USING (
        manufacturer_id = auth.user_id() OR 
        current_owner_id = auth.user_id() OR
        auth.user_role() IN ('admin', 'regulator', 'auditor')
    );

CREATE POLICY "Manufacturers can create batches" ON batches
    FOR INSERT WITH CHECK (
        manufacturer_id = auth.user_id() AND 
        auth.user_role() = 'manufacturer'
    );

CREATE POLICY "Batch owners can update their batches" ON batches
    FOR UPDATE USING (
        current_owner_id = auth.user_id() OR
        auth.user_role() = 'admin'
    );

CREATE POLICY "Regulators and admins can update any batch" ON batches
    FOR UPDATE USING (
        auth.user_role() IN ('admin', 'regulator')
    );

-- Batch ownership history policies
CREATE POLICY "Users can view ownership history for their batches" ON batch_ownership_history
    FOR SELECT USING (
        batch_id IN (
            SELECT id FROM batches 
            WHERE manufacturer_id = auth.user_id() OR 
                  current_owner_id = auth.user_id()
        ) OR
        auth.user_role() IN ('admin', 'regulator', 'auditor')
    );

CREATE POLICY "Batch owners can create ownership records" ON batch_ownership_history
    FOR INSERT WITH CHECK (
        batch_id IN (
            SELECT id FROM batches 
            WHERE current_owner_id = auth.user_id()
        ) OR
        auth.user_role() = 'admin'
    );

-- Compliance logs policies
CREATE POLICY "Users can view compliance logs for their batches" ON compliance_logs
    FOR SELECT USING (
        batch_id IN (
            SELECT id FROM batches 
            WHERE manufacturer_id = auth.user_id() OR 
                  current_owner_id = auth.user_id()
        ) OR
        auth.user_role() IN ('admin', 'regulator', 'auditor')
    );

CREATE POLICY "Auditors can create compliance logs" ON compliance_logs
    FOR INSERT WITH CHECK (
        auditor_id = auth.user_id() AND
        auth.user_role() IN ('auditor', 'admin')
    );

CREATE POLICY "Auditors can update their own compliance logs" ON compliance_logs
    FOR UPDATE USING (
        auditor_id = auth.user_id() OR
        auth.user_role() = 'admin'
    );

-- Files table policies
CREATE POLICY "Users can view files they uploaded" ON files
    FOR SELECT USING (
        uploaded_by = auth.user_id() OR
        auth.user_role() = 'admin'
    );

CREATE POLICY "Users can upload files" ON files
    FOR INSERT WITH CHECK (
        uploaded_by = auth.user_id()
    );

CREATE POLICY "File uploaders can update their files" ON files
    FOR UPDATE USING (
        uploaded_by = auth.user_id() OR
        auth.user_role() = 'admin'
    );

-- Batch files policies
CREATE POLICY "Users can view batch files for their batches" ON batch_files
    FOR SELECT USING (
        batch_id IN (
            SELECT id FROM batches 
            WHERE manufacturer_id = auth.user_id() OR 
                  current_owner_id = auth.user_id()
        ) OR
        auth.user_role() = 'admin'
    );

CREATE POLICY "Batch owners can manage batch files" ON batch_files
    FOR ALL USING (
        batch_id IN (
            SELECT id FROM batches 
            WHERE current_owner_id = auth.user_id()
        ) OR
        auth.user_role() = 'admin'
    );

-- Compliance files policies
CREATE POLICY "Users can view compliance files for their batches" ON compliance_files
    FOR SELECT USING (
        compliance_log_id IN (
            SELECT cl.id FROM compliance_logs cl
            JOIN batches b ON cl.batch_id = b.id
            WHERE b.manufacturer_id = auth.user_id() OR 
                  b.current_owner_id = auth.user_id()
        ) OR
        auth.user_role() = 'admin'
    );

CREATE POLICY "Auditors can manage compliance files" ON compliance_files
    FOR ALL USING (
        compliance_log_id IN (
            SELECT id FROM compliance_logs 
            WHERE auditor_id = auth.user_id()
        ) OR
        auth.user_role() = 'admin'
    );

-- Audit logs policies
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (auth.user_role() = 'admin');

CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (user_id = auth.user_id());

-- System settings policies
CREATE POLICY "Public settings are readable by all" ON system_settings
    FOR SELECT USING (is_public = true);

CREATE POLICY "Admins can manage all settings" ON system_settings
    FOR ALL USING (auth.user_role() = 'admin');

-- Create function to log audit events
CREATE OR REPLACE FUNCTION log_audit_event(
    p_action VARCHAR(100),
    p_resource_type VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        ip_address,
        user_agent
    ) VALUES (
        auth.user_id(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        current_setting('request.headers', true)::json->>'x-forwarded-for',
        current_setting('request.headers', true)::json->>'user-agent'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create audit triggers
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_audit_event(
            'CREATE',
            TG_TABLE_NAME,
            NEW.id,
            NULL,
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_audit_event(
            'UPDATE',
            TG_TABLE_NAME,
            NEW.id,
            to_jsonb(OLD),
            to_jsonb(NEW)
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_audit_event(
            'DELETE',
            TG_TABLE_NAME,
            OLD.id,
            to_jsonb(OLD),
            NULL
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER users_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER batches_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON batches
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER compliance_logs_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON compliance_logs
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER files_audit_trigger
    AFTER INSERT OR UPDATE OR DELETE ON files
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();