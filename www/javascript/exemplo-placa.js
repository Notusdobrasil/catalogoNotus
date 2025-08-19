// Exemplo de resposta da API APIBRASIL para consulta de placa
// Este é apenas um exemplo para demonstrar a estrutura dos dados

const exemploRespostaAPI = {
    "status": "success",
    "marca": "VOLKSWAGEN",
    "modelo": "GOL",
    "ano": "2018",
    "cor": "BRANCA",
    "municipio": "SAO PAULO",
    "uf": "SP",
    "combustivel": "FLEX",
    "categoria": "PARTICULAR",
    "chassi": "9BWAA05W***",
    "placa": "ABC1234",
    "renavam": "123456789"
};

// Exemplo de como os produtos são filtrados
const exemploFiltrageProdutos = {
    // Produto que SERIA ENCONTRADO para o Volkswagen Gol 2018
    produtoCompativel: {
        "id": 1,
        "codigo": "NT-RAD-001",
        "categoria": "Radiador",
        "montadora": "VOLKSWAGEN", // ✅ Montadora bate
        "modelo": "GOL", // ✅ Modelo bate
        "ano": "2016-2020", // ✅ Ano 2018 está no range
        "descricao": "Radiador para Volkswagen Gol",
        "imagem": "./conversor/ImagensProdutos/radiador-gol.jpg",
        "score": 15 // 10 (montadora) + 5 (modelo)
    },

    // Produto que NÃO seria encontrado
    produtoIncompativel: {
        "id": 2,
        "codigo": "NT-RAD-002",
        "categoria": "Radiador",
        "montadora": "FIAT", // ❌ Montadora diferente
        "modelo": "PALIO", // ❌ Modelo diferente
        "ano": "2010-2015", // ❌ Ano fora do range
        "descricao": "Radiador para Fiat Palio",
        "imagem": "./conversor/ImagensProdutos/radiador-palio.jpg",
        "score": 0 // Não compatível
    }
};

// Fluxo completo da busca por placa
const fluxoBuscaPlaca = {
    passo1: "Usuário digita 'ABC-1234' no campo de busca",
    passo2: "Sistema valida formato da placa",
    passo3: "Requisição para API APIBRASIL com placa limpa 'ABC1234'",
    passo4: "API retorna dados: Volkswagen Gol 2018",
    passo5: "Sistema busca produtos onde montadora = 'VOLKSWAGEN'",
    passo6: "Filtra por modelo contendo 'GOL'",
    passo7: "Verifica compatibilidade de ano (2018 no range 2016-2020)",
    passo8: "Ordena por score de compatibilidade",
    passo9: "Exibe produtos compatíveis para o usuário"
};

// Códigos de erro comuns da API
const codigosErroAPI = {
    401: "Chave de API inválida ou expirada",
    402: "Créditos insuficientes na conta",
    404: "Placa não encontrada na base de dados",
    429: "Muitas requisições - limite de rate excedido",
    500: "Erro interno do servidor da API"
};

// Exemplo de configuração para produção
const configProducao = {
    // Usar proxy backend para proteger chave da API
    useProxy: true,
    proxyUrl: '/api/consulta-placa',
    
    // Cache de consultas
    enableCache: true,
    cacheTimeout: 3600000, // 1 hora
    
    // Retry automático
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
    
    // Analytics
    trackConsultas: true,
    trackErros: true
};

console.log('Exemplos carregados para consulta de placa');
console.log('Verifique a documentação em README-PLACA.md para mais detalhes');
