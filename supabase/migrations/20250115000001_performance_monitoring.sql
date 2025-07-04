-- Epic 4.4: Database Query Optimization & Performance Monitoring
-- Additional database functions for monitoring and optimization

-- Function to get slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE FUNCTION get_slow_queries(p_min_execution_time INTEGER DEFAULT 1000)
RETURNS TABLE (
    query TEXT,
    execution_time NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE,
    frequency INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Check if pg_stat_statements extension is available
    IF NOT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT 
        pss.query,
        pss.mean_time as execution_time,
        NOW() as timestamp,
        pss.calls as frequency
    FROM pg_stat_statements pss
    WHERE pss.mean_time > p_min_execution_time
    ORDER BY pss.mean_time DESC
    LIMIT 20;
END;
$$;

-- Function to get index usage statistics
CREATE OR REPLACE FUNCTION get_index_usage_stats()
RETURNS TABLE (
    index_name TEXT,
    table_name TEXT,
    scans INTEGER,
    last_used TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.relname as index_name,
        t.relname as table_name,
        s.idx_scan as scans,
        s.last_idx_scan as last_used
    FROM pg_stat_user_indexes s
    JOIN pg_index i ON s.indexrelid = i.indexrelid
    JOIN pg_class t ON s.relid = t.oid
    ORDER BY s.idx_scan DESC
    LIMIT 50;
END;
$$;

-- Function to get table sizes
CREATE OR REPLACE FUNCTION get_table_sizes()
RETURNS TABLE (
    table_name TEXT,
    size TEXT,
    row_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size,
        n_tup_ins + n_tup_upd + n_tup_del as row_count
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
    LIMIT 20;
END;
$$;

-- Function to get database performance metrics
CREATE OR REPLACE FUNCTION get_database_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'active_connections'::TEXT as metric_name,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::NUMERIC as metric_value,
        'Number of active database connections'::TEXT as description
    UNION ALL
    SELECT 
        'cache_hit_ratio'::TEXT,
        (SELECT round(100.0 * sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)), 2)
         FROM pg_statio_user_tables)::NUMERIC,
        'Cache hit ratio percentage'::TEXT
    UNION ALL
    SELECT 
        'total_queries'::TEXT,
        (SELECT sum(calls) FROM pg_stat_statements)::NUMERIC,
        'Total number of queries executed'::TEXT
    UNION ALL
    SELECT 
        'avg_query_time'::TEXT,
        (SELECT round(avg(mean_time), 2) FROM pg_stat_statements)::NUMERIC,
        'Average query execution time in milliseconds'::TEXT;
END;
$$;

-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(p_query TEXT)
RETURNS TABLE (
    analysis_type TEXT,
    result TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    explain_result TEXT;
    plan_record RECORD;
BEGIN
    -- Get query execution plan
    BEGIN
        EXECUTE 'EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' || p_query INTO explain_result;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN QUERY SELECT 
                'error'::TEXT,
                SQLERRM::TEXT,
                'Query could not be analyzed'::TEXT;
            RETURN;
    END;

    -- Analyze the plan
    FOR plan_record IN 
        SELECT * FROM json_array_elements(explain_result::json)
    LOOP
        -- Check for sequential scans
        IF plan_record->>'Node Type' = 'Seq Scan' THEN
            RETURN QUERY SELECT 
                'warning'::TEXT,
                'Sequential scan detected on table: ' || (plan_record->>'Relation Name')::TEXT,
                'Consider adding an index on the scanned columns'::TEXT;
        END IF;

        -- Check for high cost operations
        IF (plan_record->>'Total Cost')::NUMERIC > 1000 THEN
            RETURN QUERY SELECT 
                'warning'::TEXT,
                'High cost operation detected: ' || (plan_record->>'Node Type')::TEXT,
                'Consider optimizing the query or adding indexes'::TEXT;
        END IF;

        -- Check for large result sets
        IF (plan_record->>'Actual Rows')::INTEGER > 10000 THEN
            RETURN QUERY SELECT 
                'info'::TEXT,
                'Large result set: ' || (plan_record->>'Actual Rows')::TEXT || ' rows',
                'Consider adding LIMIT or filtering conditions'::TEXT;
        END IF;
    END LOOP;

    RETURN QUERY SELECT 
        'success'::TEXT,
        'Query analysis completed'::TEXT,
        'No major performance issues detected'::TEXT;
END;
$$;

-- Function to get connection pool statistics
CREATE OR REPLACE FUNCTION get_connection_pool_stats()
RETURNS TABLE (
    pool_name TEXT,
    active_connections INTEGER,
    idle_connections INTEGER,
    total_connections INTEGER,
    max_connections INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'default'::TEXT as pool_name,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'active')::INTEGER as active_connections,
        (SELECT count(*) FROM pg_stat_activity WHERE state = 'idle')::INTEGER as idle_connections,
        (SELECT count(*) FROM pg_stat_activity)::INTEGER as total_connections,
        (SELECT setting::INTEGER FROM pg_settings WHERE name = 'max_connections')::INTEGER as max_connections;
END;
$$;

-- Function to get table bloat information
CREATE OR REPLACE FUNCTION get_table_bloat()
RETURNS TABLE (
    table_name TEXT,
    bloat_ratio NUMERIC,
    bloat_size TEXT,
    recommendation TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        schemaname || '.' || tablename as table_name,
        round(
            (pg_total_relation_size(schemaname || '.' || tablename) - 
             pg_relation_size(schemaname || '.' || tablename)) * 100.0 / 
            pg_total_relation_size(schemaname || '.' || tablename), 2
        ) as bloat_ratio,
        pg_size_pretty(
            pg_total_relation_size(schemaname || '.' || tablename) - 
            pg_relation_size(schemaname || '.' || tablename)
        ) as bloat_size,
        CASE 
            WHEN (pg_total_relation_size(schemaname || '.' || tablename) - 
                  pg_relation_size(schemaname || '.' || tablename)) * 100.0 / 
                 pg_total_relation_size(schemaname || '.' || tablename) > 20 
            THEN 'Consider running VACUUM FULL'
            ELSE 'No action needed'
        END as recommendation
    FROM pg_stat_user_tables
    WHERE pg_total_relation_size(schemaname || '.' || tablename) > 0
    ORDER BY bloat_ratio DESC
    LIMIT 10;
END;
$$;

-- Function to get index recommendations
CREATE OR REPLACE FUNCTION get_index_recommendations()
RETURNS TABLE (
    table_name TEXT,
    column_name TEXT,
    recommendation_type TEXT,
    reason TEXT,
    estimated_impact TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.relname as table_name,
        a.attname as column_name,
        'missing_index'::TEXT as recommendation_type,
        'Column frequently used in WHERE clauses without index'::TEXT as reason,
        'High'::TEXT as estimated_impact
    FROM pg_stat_user_tables t
    JOIN pg_attribute a ON t.relid = a.attrelid
    WHERE a.attnum > 0 
    AND NOT a.attisdropped
    AND NOT EXISTS (
        SELECT 1 FROM pg_index i 
        WHERE i.indrelid = t.relid 
        AND a.attnum = ANY(i.indkey)
    )
    AND EXISTS (
        SELECT 1 FROM pg_stat_user_indexes ui
        WHERE ui.relid = t.relid
        AND ui.idx_scan > 1000
    )
    LIMIT 20;
END;
$$;

-- Function to clean up old performance data
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clean up old audit logs (older than 30 days)
    DELETE FROM public.audit_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    -- Clean up old rate limits (older than 7 days)
    DELETE FROM public.rate_limits 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Clean up expired CAPTCHA verifications
    DELETE FROM public.captcha_verifications 
    WHERE expires_at < NOW();
    
    -- Clean up old real-time locations (older than 3 days)
    DELETE FROM public.real_time_locations 
    WHERE created_at < NOW() - INTERVAL '3 days';
    
    -- Vacuum tables to reclaim space
    VACUUM ANALYZE public.audit_logs;
    VACUUM ANALYZE public.rate_limits;
    VACUUM ANALYZE public.captcha_verifications;
    VACUUM ANALYZE public.real_time_locations;
END;
$$;

-- Create a view for performance monitoring dashboard
CREATE OR REPLACE VIEW performance_dashboard AS
SELECT 
    'database_metrics' as category,
    metric_name as name,
    metric_value as value,
    description as details
FROM get_database_metrics()
UNION ALL
SELECT 
    'connection_pool' as category,
    pool_name as name,
    active_connections::TEXT as value,
    'Active connections: ' || active_connections::TEXT || 
    ', Idle: ' || idle_connections::TEXT || 
    ', Total: ' || total_connections::TEXT || 
    ', Max: ' || max_connections::TEXT as details
FROM get_connection_pool_stats()
UNION ALL
SELECT 
    'table_bloat' as category,
    table_name as name,
    bloat_ratio::TEXT || '%' as value,
    'Bloat size: ' || bloat_size || ', ' || recommendation as details
FROM get_table_bloat()
WHERE bloat_ratio > 10;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_slow_queries(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_usage_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_sizes() TO authenticated;
GRANT EXECUTE ON FUNCTION get_database_metrics() TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_query_performance(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_connection_pool_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_bloat() TO authenticated;
GRANT EXECUTE ON FUNCTION get_index_recommendations() TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_performance_data() TO service_role;

-- Grant access to performance dashboard view
GRANT SELECT ON performance_dashboard TO authenticated; 