-- Criar tabela de configurações de sincronização
CREATE TABLE sync_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    source_repo TEXT NOT NULL,
    target_repo TEXT NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de logs de sincronização
CREATE TABLE sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES sync_configs(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('success', 'error', 'in_progress')) NOT NULL,
    message TEXT NOT NULL,
    files_processed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para sync_configs
CREATE POLICY "Permitir todas as operações para usuários autenticados" ON sync_configs
    FOR ALL USING (true);

CREATE POLICY "Permitir leitura para usuários anônimos" ON sync_configs
    FOR SELECT USING (true);

-- Políticas de acesso para sync_logs
CREATE POLICY "Permitir todas as operações para usuários autenticados" ON sync_logs
    FOR ALL USING (true);

CREATE POLICY "Permitir leitura para usuários anônimos" ON sync_logs
    FOR SELECT USING (true);

-- Função para limpar logs antigos (mais de 3 dias)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_logs 
    WHERE created_at < NOW() - INTERVAL '3 days';
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sync_configs_updated_at
    BEFORE UPDATE ON sync_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Conceder permissões para as roles anon e authenticated
GRANT ALL PRIVILEGES ON sync_configs TO anon;
GRANT ALL PRIVILEGES ON sync_configs TO authenticated;
GRANT ALL PRIVILEGES ON sync_logs TO anon;
GRANT ALL PRIVILEGES ON sync_logs TO authenticated;

-- Conceder permissões para as sequências
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;