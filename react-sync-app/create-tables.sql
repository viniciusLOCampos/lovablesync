-- Script para criar as tabelas necessárias no Supabase
-- Execute este script no SQL Editor do Supabase Dashboard

-- Criar tabela sync_configs
CREATE TABLE IF NOT EXISTS sync_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    source_path TEXT NOT NULL,
    target_repo VARCHAR(255) NOT NULL,
    target_branch VARCHAR(100) DEFAULT 'main',
    github_token TEXT,
    auto_sync BOOLEAN DEFAULT false,
    sync_interval INTEGER DEFAULT 300,
    last_sync TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'inactive',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela sync_logs
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    config_id UUID REFERENCES sync_configs(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    message TEXT,
    details JSONB,
    files_changed INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE sync_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;

-- Criar políticas de acesso (permitir acesso público para desenvolvimento)
CREATE POLICY "Allow all access to sync_configs" ON sync_configs
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access to sync_logs" ON sync_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela sync_configs
CREATE TRIGGER update_sync_configs_updated_at
    BEFORE UPDATE ON sync_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar logs antigos (opcional)
CREATE OR REPLACE FUNCTION cleanup_old_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Inserir dados de exemplo (opcional)
INSERT INTO sync_configs (name, source_path, target_repo, target_branch, status)
VALUES 
    ('Exemplo Config 1', 'C:\\Users\\exemplo\\projeto', 'usuario/repositorio', 'main', 'inactive'),
    ('Exemplo Config 2', 'C:\\Users\\exemplo\\outro-projeto', 'usuario/outro-repo', 'develop', 'inactive')
ON CONFLICT DO NOTHING;

-- Verificar se as tabelas foram criadas
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('sync_configs', 'sync_logs')
ORDER BY table_name;