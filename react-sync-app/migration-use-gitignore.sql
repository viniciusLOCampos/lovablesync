-- Migração para adicionar coluna use_gitignore
-- Execute este SQL no painel do Supabase: SQL Editor > New Query

-- Adicionar coluna use_gitignore com valor padrão true
ALTER TABLE sync_configs 
ADD COLUMN IF NOT EXISTS use_gitignore BOOLEAN DEFAULT true;

-- Atualizar registros existentes para ter o valor padrão true
UPDATE sync_configs 
SET use_gitignore = true 
WHERE use_gitignore IS NULL;
