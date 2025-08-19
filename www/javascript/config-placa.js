// Configuração da API APIBRASIL
// 
// INSTRUÇÕES PARA CONFIGURAR:
// 1. Acesse https://apibrasil.com.br/
// 2. Crie uma conta e obtenha seu Bearer Token JWT
// 3. O token JWT já está configurado corretamente abaixo
// 4. Verifique se você tem créditos suficientes para consultas

const CONFIG_PLACA_API = {
    // Sua chave de API da APIBRASIL
    apiKey: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2dhdGV3YXkuYXBpYnJhc2lsLmlvL2FwaS92Mi9hdXRoL3JlZ2lzdGVyIiwiaWF0IjoxNzU1MDE1NTU0LCJleHAiOjE3ODY1NTE1NTQsIm5iZiI6MTc1NTAxNTU1NCwianRpIjoibDgxREZlZndqMnFwMWtXSiIsInN1YiI6IjE2NDc2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.c1oEvAI4CogseLndgL4P3IOERFk9CDhVYCc8JqqT2j0',
    
    // URLs da API (tentará em ordem de prioridade)
    apiUrls: [
        'https://gateway.apibrasil.io/api/v2/vehicles/base/000/dados',
        'https://apibrasil.com.br/api/v2/vehicles/base/000/dados',
        'https://api.apibrasil.com.br/api/v2/vehicles/base/000/dados'
    ],
    
    // URL principal (compatibilidade)
    apiUrl: 'https://gateway.apibrasil.io/api/v2/vehicles/base/000/dados',
    
    // Timeout para requisições (em millisegundos)
    timeout: 15000,
    
    // Configurações de retry
    maxRetries: 2,
    retryDelay: 1000,
    
    // Habilitar/desabilitar logs de debug
    debug: true
};

// Verificar se a configuração é válida
function verificarConfiguracao() {
    if (!CONFIG_PLACA_API.apiKey || CONFIG_PLACA_API.apiKey === 'SUA_CHAVE_DA_APIBRASIL') {
        console.warn('⚠️ Chave da API APIBRASIL não configurada!');
        console.warn('📝 Configure sua chave em: javascript/config-placa.js');
        return false;
    }
    
    if (CONFIG_PLACA_API.debug) {
        console.log('✅ Configuração da API de placa carregada');
        console.log('🔑 Chave configurada:', CONFIG_PLACA_API.apiKey.substring(0, 8) + '...');
        console.log('🌐 URLs disponíveis:', CONFIG_PLACA_API.apiUrls);
    }
    
    return true;
}

// Função para testar conectividade com a API
async function testarConectividade() {
    if (!CONFIG_PLACA_API.apiKey || CONFIG_PLACA_API.apiKey === 'SUA_CHAVE_DA_APIBRASIL') {
        console.error('❌ Configure a chave da API primeiro');
        return false;
    }

    console.log('🧪 Testando conectividade com a API...');
    
    for (const url of CONFIG_PLACA_API.apiUrls) {
        try {
            console.log(`🔗 Testando: ${url}`);
            
            const response = await fetch(`${url}/ABC1234`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${CONFIG_PLACA_API.apiKey}`,
                    'Accept': 'application/json'
                },
                signal: AbortSignal.timeout(5000) // 5 segundos para teste
            });

            console.log(`📊 Status: ${response.status} - ${url}`);
            
            if (response.ok || response.status === 404) {
                // 404 é esperado para placa de teste
                console.log(`✅ URL funcionando: ${url}`);
                return true;
            }
            
        } catch (error) {
            console.log(`❌ Falha em: ${url} - ${error.message}`);
        }
    }
    
    console.error('❌ Nenhuma URL está funcionando');
    return false;
}

// Exportar configuração
if (typeof window !== 'undefined') {
    window.CONFIG_PLACA_API = CONFIG_PLACA_API;
    window.verificarConfiguracao = verificarConfiguracao;
    window.testarConectividade = testarConectividade;
    
    // Verificar configuração automaticamente
    document.addEventListener('DOMContentLoaded', verificarConfiguracao);
}

// Para uso em Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG_PLACA_API;
}
