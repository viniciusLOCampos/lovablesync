// Script para testar a conexão com o Supabase após criação das tabelas
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Credenciais do Supabase não encontradas no .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('🔄 Testando conexão com o Supabase...');
    console.log(`📍 URL: ${supabaseUrl}`);
    console.log(`🔑 Projeto: mxsjahqjerkpaqixiaxd`);
    
    try {
        // Testar conexão básica
        console.log('\n1. Testando conexão básica...');
        const { data: healthCheck, error: healthError } = await supabase
            .from('sync_configs')
            .select('count', { count: 'exact', head: true });
        
        if (healthError) {
            console.error('❌ Erro na conexão:', healthError.message);
            return false;
        }
        
        console.log('✅ Conexão estabelecida com sucesso!');
        
        // Verificar se as tabelas existem
        console.log('\n2. Verificando tabela sync_configs...');
        const { data: configs, error: configError } = await supabase
            .from('sync_configs')
            .select('*')
            .limit(5);
        
        if (configError) {
            console.error('❌ Erro ao acessar sync_configs:', configError.message);
            console.log('💡 Certifique-se de que executou o script create-tables.sql no Supabase SQL Editor');
            return false;
        }
        
        console.log(`✅ Tabela sync_configs encontrada! (${configs.length} registros)`);
        
        console.log('\n3. Verificando tabela sync_logs...');
        const { data: logs, error: logError } = await supabase
            .from('sync_logs')
            .select('*')
            .limit(5);
        
        if (logError) {
            console.error('❌ Erro ao acessar sync_logs:', logError.message);
            return false;
        }
        
        console.log(`✅ Tabela sync_logs encontrada! (${logs.length} registros)`);
        
        // Testar inserção de dados
        console.log('\n4. Testando inserção de dados...');
        const { data: insertData, error: insertError } = await supabase
            .from('sync_configs')
            .insert({
                name: 'Teste de Conexão',
                source_path: 'C:\\\\teste',
                target_repo: 'teste/repo',
                status: 'inactive'
            })
            .select();
        
        if (insertError) {
            console.error('❌ Erro ao inserir dados:', insertError.message);
            return false;
        }
        
        console.log('✅ Inserção de dados bem-sucedida!');
        
        // Limpar dados de teste
        if (insertData && insertData[0]) {
            await supabase
                .from('sync_configs')
                .delete()
                .eq('id', insertData[0].id);
            console.log('🧹 Dados de teste removidos');
        }
        
        console.log('\n🎉 Todos os testes passaram! O Supabase está configurado corretamente.');
        return true;
        
    } catch (error) {
        console.error('❌ Erro inesperado:', error.message);
        return false;
    }
}

// Executar teste
testConnection()
    .then(success => {
        if (success) {
            console.log('\n✅ Configuração concluída com sucesso!');
            console.log('🚀 Você pode agora usar a aplicação normalmente.');
        } else {
            console.log('\n❌ Configuração incompleta.');
            console.log('📋 Próximos passos:');
            console.log('   1. Execute o script create-tables.sql no Supabase SQL Editor');
            console.log('   2. Execute este teste novamente: node test-connection.js');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });