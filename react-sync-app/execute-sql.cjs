// Script para executar SQL diretamente no Supabase
const https = require('https');
const fs = require('fs');
const path = require('path');

// Função para ler arquivo .env
function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });
    
    return env;
}

// Função para fazer requisição HTTP
function makeRequest(url, options, data) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(body);
                    resolve({ data: result, status: res.statusCode });
                } catch (e) {
                    resolve({ data: body, status: res.statusCode });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function executeSQLScript() {
    console.log('🔄 Executando script SQL no Supabase...');
    
    try {
        // Carregar variáveis de ambiente
        const env = loadEnv();
        const supabaseUrl = env.VITE_SUPABASE_URL;
        const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseServiceKey) {
            console.error('❌ Credenciais do Supabase não encontradas no .env');
            return false;
        }
        
        console.log(`📍 URL: ${supabaseUrl}`);
        console.log(`🔑 Projeto: mxsjahqjerkpaqixiaxd`);
        
        // Ler o arquivo SQL
        const sqlFilePath = path.join(__dirname, 'create-tables.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        console.log('\n📄 Arquivo SQL carregado com sucesso');
        
        // Executar comandos SQL individuais
        const sqlCommands = [
            // Criar tabela sync_configs
            `CREATE TABLE IF NOT EXISTS sync_configs (
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
            )`,
            
            // Criar tabela sync_logs
            `CREATE TABLE IF NOT EXISTS sync_logs (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                config_id UUID REFERENCES sync_configs(id) ON DELETE CASCADE,
                status VARCHAR(50) NOT NULL,
                message TEXT,
                details JSONB,
                files_changed INTEGER DEFAULT 0,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )`,
            
            // Habilitar RLS
            `ALTER TABLE sync_configs ENABLE ROW LEVEL SECURITY`,
            `ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY`,
            
            // Criar políticas
            `CREATE POLICY IF NOT EXISTS "Allow all access to sync_configs" ON sync_configs FOR ALL USING (true) WITH CHECK (true)`,
            `CREATE POLICY IF NOT EXISTS "Allow all access to sync_logs" ON sync_logs FOR ALL USING (true) WITH CHECK (true)`
        ];
        
        console.log(`\n🔧 Executando ${sqlCommands.length} comandos SQL...`);
        
        const apiUrl = new URL('/rest/v1/rpc/exec_sql', supabaseUrl);
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            }
        };
        
        let successCount = 0;
        
        for (let i = 0; i < sqlCommands.length; i++) {
            const command = sqlCommands[i];
            
            try {
                console.log(`\n[${i + 1}/${sqlCommands.length}] Executando comando...`);
                
                const response = await makeRequest(apiUrl, options, {
                    sql_query: command
                });
                
                if (response.status === 200 || response.status === 201) {
                    console.log(`✅ Comando ${i + 1} executado com sucesso`);
                    successCount++;
                } else {
                    console.log(`⚠️  Comando ${i + 1} retornou status ${response.status}`);
                }
                
                // Pequena pausa entre comandos
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (cmdError) {
                console.log(`⚠️  Comando ${i + 1} falhou: ${cmdError.message}`);
            }
        }
        
        console.log(`\n📊 Resumo da execução:`);
        console.log(`✅ Sucessos: ${successCount}`);
        
        // Verificar se as tabelas foram criadas
        console.log('\n🔍 Verificando se as tabelas foram criadas...');
        
        const checkUrl = new URL('/rest/v1/sync_configs', supabaseUrl);
        checkUrl.searchParams.append('select', 'count');
        checkUrl.searchParams.append('head', 'true');
        
        const checkOptions = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${supabaseServiceKey}`,
                'apikey': supabaseServiceKey
            }
        };
        
        try {
            const checkResponse = await makeRequest(checkUrl, checkOptions);
            
            if (checkResponse.status === 200) {
                console.log('✅ Tabela sync_configs criada e acessível!');
                
                // Verificar sync_logs
                const logsUrl = new URL('/rest/v1/sync_logs', supabaseUrl);
                logsUrl.searchParams.append('select', 'count');
                logsUrl.searchParams.append('head', 'true');
                
                const logsResponse = await makeRequest(logsUrl, checkOptions);
                
                if (logsResponse.status === 200) {
                    console.log('✅ Tabela sync_logs criada e acessível!');
                    return true;
                } else {
                    console.log('⚠️  Tabela sync_logs não está acessível');
                    return false;
                }
            } else {
                console.log('⚠️  Tabela sync_configs não está acessível');
                return false;
            }
        } catch (checkError) {
            console.log('⚠️  Erro ao verificar tabelas:', checkError.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Erro durante execução:', error.message);
        return false;
    }
}

// Executar script
executeSQLScript()
    .then(success => {
        if (success) {
            console.log('\n🎉 Banco de dados configurado com sucesso!');
            console.log('🚀 Você pode agora usar a aplicação normalmente.');
            console.log('\n💡 Execute "node test-connection.js" para fazer um teste completo.');
        } else {
            console.log('\n❌ Configuração automática falhou.');
            console.log('\n📋 Execute manualmente no Supabase SQL Editor:');
            console.log('   1. Acesse https://supabase.com/dashboard');
            console.log('   2. Selecione o projeto mxsjahqjerkpaqixiaxd');
            console.log('   3. Vá em SQL Editor > New query');
            console.log('   4. Cole o conteúdo do arquivo create-tables.sql');
            console.log('   5. Clique em Run');
        }
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });