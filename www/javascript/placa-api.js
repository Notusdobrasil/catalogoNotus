// Função para normalizar texto (remove acentos e converte para minúsculo)
function normalizeText(text) {
    if (!text) return '';
    return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

// Função para validar formato da placa
function validarFormatoPlaca(placa) {
    if (!placa) return false;
    
    // Remove espaços e converte para maiúsculo
    placa = placa.replace(/\s+/g, '').toUpperCase();
    
    // Formato antigo: ABC1234
    const formatoAntigo = /^[A-Z]{3}\d{4}$/;
    
    // Formato Mercosul: ABC1D23
    const formatoMercosul = /^[A-Z]{3}\d[A-Z]\d{2}$/;
    
    return formatoAntigo.test(placa) || formatoMercosul.test(placa);
}

// Função auxiliar para extrair anos (versão segura para placa-api)
function extrairAnosSeguro(anoString) {
    if (!anoString || anoString === 'TODOS') return [];
    
    // Converter para string se não for
    const stringAno = String(anoString).trim();
    if (!stringAno) return [];
    
    // Regex para encontrar anos de 4 dígitos ou 2 dígitos, incluindo casos com ">"
    const matches = stringAno.match(/\b(\d{2,4})>?\b/g);
    if (!matches) return [];
    
    return matches.map(ano => {
        // Remove o ">" se existir e converte para número
        const cleanAno = ano.replace('>', '');
        const num = parseInt(cleanAno);
        
        // Se for 2 dígitos, assume que é 19XX ou 20XX
        if (num < 100) {
            return num < 50 ? 2000 + num : 1900 + num;
        }
        return num;
    });
}

// Função para formatar placa para exibição
function formatarPlaca(placa) {
    if (!placa) return '';
    
    placa = placa.replace(/\s+/g, '').toUpperCase();
    
    // Formato antigo: ABC-1234
    if (/^[A-Z]{3}\d{4}$/.test(placa)) {
        return placa.substring(0, 3) + '-' + placa.substring(3);
    }
    
    // Formato Mercosul: ABC1D23
    if (/^[A-Z]{3}\d[A-Z]\d{2}$/.test(placa)) {
        return placa.substring(0, 4) + '-' + placa.substring(4);
    }
    
    return placa;
}

// Função para consultar dados do veículo pela placa
async function consultarPlaca(placa) {
    try {
        // Verificar se a configuração está disponível
        if (!window.CONFIG_PLACA_API) {
            throw new Error('Configuração da API não encontrada. Verifique se config-placa.js foi carregado.');
        }
        
        const config = window.CONFIG_PLACA_API;
        
        // Verificar se a chave da API está configurada
        if (!config.apiKey || config.apiKey === 'SUA_CHAVE_DA_APIBRASIL') {
            throw new Error('Chave da API não configurada. Configure sua chave da APIBRASIL no arquivo config-placa.js');
        }

        // Validar formato da placa
        if (!validarFormatoPlaca(placa)) {
            throw new Error('Formato de placa inválido. Use o formato ABC-1234 ou ABC1D23');
        }

        // Limpar placa (remover hífens e espaços)
        const placaLimpa = placa.replace(/[-\s]/g, '').toUpperCase();

        // Mostrar loading
        mostrarLoading('Consultando dados da placa...');

        // Tentar múltiplas URLs com POST
        const urlsParaTestar = config.apiUrls || [config.apiUrl];
        let ultimoErro = null;

        for (const url of urlsParaTestar) {
            try {
                if (config.debug) {
                    console.log(`Tentando POST: ${url}`);
                }

                // Fazer requisição POST como no Postman
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${config.apiKey}`,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    body: JSON.stringify({ 
                        placa: placaLimpa,
                        homolog: false
                    }),
                    signal: AbortSignal.timeout(config.timeout)
                });

                // Verificar se a resposta foi bem-sucedida
                if (response.ok) {
                    const dados = await response.json();

                    // A API retorna os dados dentro de "data"
                    const dadosVeiculo = dados.data || dados;

                    // Verificar se retornou dados válidos
                    if (!dadosVeiculo || (!dadosVeiculo.MARCA && !dadosVeiculo.MODELO)) {
                        throw new Error('Dados do veículo não encontrados para esta placa');
                    }

                    // Log de debug se habilitado
                    if (config.debug) {
                        console.log(`✅ Sucesso com POST: ${url}`);
                        console.log('Dados retornados da API:', dados);
                    }

                    // Esconder loading
                    esconderLoading();

                    // Processar e retornar os dados (a API retorna em maiúsculo)
                    return {
                        sucesso: true,
                        placa: formatarPlaca(placa),
                        marca: dadosVeiculo.MARCA || 'Não informado',
                        modelo: dadosVeiculo.MODELO || 'Não informado',
                        ano: dadosVeiculo.ano || dadosVeiculo.anoModelo,
                        cor: dadosVeiculo.cor,
                        municipio: dadosVeiculo.municipio,
                        uf: dadosVeiculo.uf,
                        dados: dadosVeiculo
                    };
                }

                // Tratar erros específicos da API
                if (response.status === 401) {
                    throw new Error('Chave de API inválida ou expirada');
                } else if (response.status === 402) {
                    throw new Error('Créditos insuficientes na conta da API');
                } else if (response.status === 404) {
                    throw new Error('Placa não encontrada na base de dados');
                } else if (response.status === 429) {
                    throw new Error('Muitas requisições. Tente novamente em alguns segundos');
                }

                const errorData = await response.json().catch(() => ({}));
                ultimoErro = new Error(errorData.message || `Erro na consulta: ${response.status}`);

            } catch (error) {
                if (config.debug) {
                    console.log(`❌ Falhou POST com URL: ${url} - ${error.message}`);
                }
                ultimoErro = error;
                
                // Se é erro de rede, tentar próxima URL
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    continue;
                }
                
                // Para outros erros (401, 404, etc), não tentar outras URLs
                break;
            }
        }

        // Se chegou aqui, todas as URLs falharam
        throw ultimoErro || new Error('Falha ao consultar todas as URLs disponíveis');

    } catch (error) {
        esconderLoading();
        
        if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
            console.error('Erro detalhado ao consultar placa:', error);
        }
        
        // Tratar diferentes tipos de erro
        if (error.name === 'AbortError') {
            throw new Error('Consulta da placa excedeu o tempo limite');
        }
        
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            throw new Error('Erro de conexão. Verifique sua internet e se a URL da API está correta');
        }
        
        throw error;
    }
}

// Função para buscar produtos compatíveis com o veículo
function buscarProdutosPorVeiculo(dadosVeiculo, produtosData) {
    if (!dadosVeiculo || !produtosData) return [];

    const { marca, modelo, ano } = dadosVeiculo;
    
    // Normalizar dados do veículo para busca
    const marcaNormalizada = normalizeText(marca);
    const modeloNormalizado = normalizeText(modelo);
    
    // Debug: Log dos dados do veículo
    if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
        console.log('🔍 Buscando produtos para veículo:', {
            marca, modelo, ano,
            marcaNormalizada, modeloNormalizado
        });
    }
    
    // Filtrar produtos que são compatíveis com o veículo
    const produtosCompativeis = produtosData.filter(produto => {
        // Verificar compatibilidade com a marca - LÓGICA MELHORADA
        let montadoraCompativel = false;
        if (produto.montadora && marca) {
            const montadoraProdutoNorm = normalizeText(produto.montadora);
            const marcaVeiculoNorm = normalizeText(marca);
            
            // Tratamento especial para variações de marca
            const marcasEquivalentes = {
                'volkswagen': ['volkswagen', 'vw'],
                'vw': ['volkswagen', 'vw'],
                'general motors': ['general motors', 'gm', 'chevrolet'],
                'gm': ['general motors', 'gm', 'chevrolet'],
                'chevrolet': ['general motors', 'gm', 'chevrolet']
            };
            
            // Verifica se há equivalência direta
            montadoraCompativel = montadoraProdutoNorm.includes(marcaVeiculoNorm) ||
                                 marcaVeiculoNorm.includes(montadoraProdutoNorm);
            
            // Se não bateu, verifica equivalências
            if (!montadoraCompativel && marcasEquivalentes[marcaVeiculoNorm]) {
                montadoraCompativel = marcasEquivalentes[marcaVeiculoNorm].some(equiv => 
                    montadoraProdutoNorm.includes(equiv) || equiv.includes(montadoraProdutoNorm)
                );
            }
        }
        
        // Verificar compatibilidade com o modelo - LÓGICA MELHORADA
        let modeloCompativel = false;
        if (produto.modelo && modelo) {
            const modeloProdutoNorm = normalizeText(produto.modelo);
            const modeloVeiculoNorm = normalizeText(modelo);
            
            // Verifica se o modelo do produto está contido no modelo do veículo
            // Ex: "FOX" está em "VW/FOX 1.6 GII"
            modeloCompativel = modeloVeiculoNorm.includes(modeloProdutoNorm) ||
                              modeloProdutoNorm.includes(modeloVeiculoNorm);
            
            // Se não bateu, tenta dividir por palavras e comparar
            if (!modeloCompativel) {
                const palavrasProduto = modeloProdutoNorm.split(/[\s\/\-_]+/).filter(p => p.length > 2);
                const palavrasVeiculo = modeloVeiculoNorm.split(/[\s\/\-_]+/).filter(p => p.length > 2);
                
                // Verifica se alguma palavra significativa do produto bate com alguma do veículo
                modeloCompativel = palavrasProduto.some(palavraProd => 
                    palavrasVeiculo.some(palavraVeic => 
                        palavraVeic.includes(palavraProd) || palavraProd.includes(palavraVeic)
                    )
                );
            }
        }
        
        // Verificar compatibilidade com o ano - LÓGICA APRIMORADA
        let anoCompativel = true;
        let scoreAno = 0;
        
        if (ano && produto.ano && produto.ano !== 'TODOS') {
            const anosVeiculo = extrairAnosSeguro(produto.ano);
            const anoVeiculo = parseInt(ano);
            
            if (anosVeiculo.length > 0 && !isNaN(anoVeiculo)) {
                const anoMin = Math.min(...anosVeiculo);
                const anoMax = Math.max(...anosVeiculo);
                
                // Verificar se há indicação de "em diante" (>)
                const temAnoEmDiante = String(produto.ano).includes('>');
                
                if (temAnoEmDiante) {
                    // Se tem ">", o ano deve ser maior ou igual ao mínimo
                    anoCompativel = anoVeiculo >= anoMin;
                    if (anoCompativel) {
                        // Bonus maior para anos exatos ou próximos
                        if (anoVeiculo === anoMin) scoreAno = 30;
                        else if (anoVeiculo <= anoMin + 3) scoreAno = 20;
                        else scoreAno = 10;
                    }
                } else {
                    // Range normal - deve estar dentro do intervalo
                    anoCompativel = anoVeiculo >= anoMin && anoVeiculo <= anoMax;
                    if (anoCompativel) {
                        // Bonus maior para anos centrais do range
                        const distanciaMinima = Math.min(
                            Math.abs(anoVeiculo - anoMin),
                            Math.abs(anoVeiculo - anoMax)
                        );
                        if (distanciaMinima === 0) scoreAno = 30; // Ano exato
                        else if (distanciaMinima <= 2) scoreAno = 20; // Muito próximo
                        else scoreAno = 10; // Dentro do range
                    }
                }
                
                // Log de debug para anos
                if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug && anoCompativel) {
                    console.log(`📅 Ano compatível - Produto: ${produto.codigo}, Ano produto: ${produto.ano}, Ano veículo: ${anoVeiculo}, Score: ${scoreAno}`);
                }
            }
        }
        
        // NOVA LÓGICA DE COMPATIBILIDADE MAIS RESTRITIVA (incluindo ano)
        let isCompativel = false;
        
        // Para produtos serem considerados compatíveis, devem atender:
        // 1. Compatibilidade de marca/modelo
        // 2. Compatibilidade de ano (quando especificado no produto)
        
        if (!anoCompativel) {
            // Se o ano não é compatível, produto é descartado
            isCompativel = false;
        }
        // Prioridade 1: MARCA + MODELO + ANO compatível (mais relevante)
        else if (montadoraCompativel && modeloCompativel) {
            isCompativel = true;
        }
        // Prioridade 2: Apenas MODELO + ANO compatível (modelo específico é mais importante que marca genérica)
        else if (modeloCompativel) {
            isCompativel = true;
        }
        // Prioridade 3: Apenas MARCA + ANO compatível + categoria específica de interesse
        else if (montadoraCompativel && produto.categoria) {
            const categoriasRelevantes = [
                'radiador', 'condensador', 'intercooler', 'eletroventilador', 
                'evaporadora', 'gmv', 'radiador de oleo', 'ventilador'
            ];
            const categoriaRelevante = categoriasRelevantes.some(cat => 
                normalizeText(produto.categoria).includes(cat)
            );
            // Só inclui produtos da marca se for categoria relevante E ano compatível
            isCompativel = categoriaRelevante;
        }
        
        // Debug: Log da comparação para alguns produtos
        if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug && isCompativel) {
            console.log('✅ Produto compatível encontrado:', {
                codigo: produto.codigo,
                montadora: produto.montadora,
                modelo: produto.modelo,
                ano: produto.ano,
                categoria: produto.categoria,
                montadoraCompativel,
                modeloCompativel,
                anoCompativel,
                scoreAno,
                prioridade: montadoraCompativel && modeloCompativel ? 'MARCA+MODELO+ANO' : 
                           modeloCompativel ? 'MODELO+ANO' : 'MARCA+CATEGORIA+ANO'
            });
        }
        
        return isCompativel;
    });

    // Debug: Log do resultado final
    if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
        console.log(`🎯 Total de produtos compatíveis encontrados: ${produtosCompativeis.length}`);
        if (produtosCompativeis.length > 0) {
            console.log('Primeiros 5 produtos com scores:', produtosCompativeis.slice(0, 5).map(p => ({
                codigo: p.codigo,
                montadora: p.montadora,
                modelo: p.modelo,
                ano: p.ano,
                categoria: p.categoria,
                score: calcularScoreCompatibilidade(p, marcaNormalizada, modeloNormalizado, ano)
            })));
        }
    }

    // Ordenar por relevância (produtos que batem marca, modelo e ano primeiro)
    const produtosOrdenados = produtosCompativeis.sort((a, b) => {
        const scoreA = calcularScoreCompatibilidade(a, marcaNormalizada, modeloNormalizado, ano);
        const scoreB = calcularScoreCompatibilidade(b, marcaNormalizada, modeloNormalizado, ano);
        return scoreB - scoreA;
    });
    
    // FILTRAR APENAS OS MAIS RELEVANTES
    // Se temos produtos com score alto (modelo específico + ano), limitar a esses
    if (produtosOrdenados.length > 0) {
        const scoreMaximo = calcularScoreCompatibilidade(produtosOrdenados[0], marcaNormalizada, modeloNormalizado, ano);
        let produtosFiltrados;
        
        // Se o melhor produto tem score alto (modelo específico + ano), filtra apenas produtos com score similar
        if (scoreMaximo >= 130) {
            // Produtos com modelo específico + ano exato - mantém apenas esses
            produtosFiltrados = produtosOrdenados.filter(p => 
                calcularScoreCompatibilidade(p, marcaNormalizada, modeloNormalizado, ano) >= 130
            );
            if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
                console.log(`🎯 Filtro aplicado: Apenas produtos com modelo específico + ano exato (${produtosFiltrados.length} produtos)`);
            }
        } else if (scoreMaximo >= 100) {
            // Produtos com modelo específico - mantém apenas esses
            produtosFiltrados = produtosOrdenados.filter(p => 
                calcularScoreCompatibilidade(p, marcaNormalizada, modeloNormalizado, ano) >= 100
            );
            if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
                console.log(`🎯 Filtro aplicado: Apenas produtos com modelo específico (${produtosFiltrados.length} produtos)`);
            }
        } else if (scoreMaximo >= 50) {
            // Produtos com marca + alguma compatibilidade - limita aos top 15
            produtosFiltrados = produtosOrdenados.slice(0, 15);
            if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
                console.log(`🎯 Filtro aplicado: Top 15 produtos com marca compatível (${produtosFiltrados.length} produtos)`);
            }
        } else {
            // Produtos genéricos - limita aos top 8
            produtosFiltrados = produtosOrdenados.slice(0, 8);
            if (CONFIG_PLACA_API && CONFIG_PLACA_API.debug) {
                console.log(`🎯 Filtro aplicado: Top 8 produtos genéricos (${produtosFiltrados.length} produtos)`);
            }
        }
        
        return produtosFiltrados;
    }
    
    return produtosOrdenados;
}

// Função auxiliar para calcular score de compatibilidade
function calcularScoreCompatibilidade(produto, marcaNormalizada, modeloNormalizado, anoVeiculo = null) {
    let score = 0;
    
    const montadoraProdutoNorm = normalizeText(produto.montadora || '');
    const modeloProdutoNorm = normalizeText(produto.modelo || '');
    const modeloVeiculoNorm = normalizeText(modeloNormalizado || '');
    
    // ALTA PRIORIDADE: Modelo específico bate exatamente
    if (modeloProdutoNorm && modeloVeiculoNorm.includes(modeloProdutoNorm)) {
        score += 100; // Prioridade máxima
    }
    
    // MÉDIA PRIORIDADE: Marca + palavras do modelo batem
    if (montadoraProdutoNorm.includes(marcaNormalizada)) {
        score += 50;
        
        // Bonus se palavras do modelo também batem
        if (modeloProdutoNorm && modeloVeiculoNorm) {
            const palavrasProduto = modeloProdutoNorm.split(/[\s\/\-_]+/).filter(p => p.length > 2);
            const palavrasVeiculo = modeloVeiculoNorm.split(/[\s\/\-_]+/).filter(p => p.length > 2);
            
            const palavrasComuns = palavrasProduto.filter(p => 
                palavrasVeiculo.some(v => v.includes(p) || p.includes(v))
            ).length;
            
            score += palavrasComuns * 20;
        }
    }
    
    // BAIXA PRIORIDADE: Apenas marca compatível
    if (montadoraProdutoNorm.includes(marcaNormalizada) && !modeloProdutoNorm) {
        score += 10; // Produtos genéricos da marca
    }
    
    // BONUS IMPORTANTE: Compatibilidade de ano
    if (anoVeiculo && produto.ano && produto.ano !== 'TODOS') {
        const anosVeiculo = extrairAnosSeguro(produto.ano);
        const anoVeiculoNum = parseInt(anoVeiculo);
        
        if (anosVeiculo.length > 0 && !isNaN(anoVeiculoNum)) {
            const anoMin = Math.min(...anosVeiculo);
            const anoMax = Math.max(...anosVeiculo);
            
            // Verificar se há indicação de "em diante" (>)
            const temAnoEmDiante = String(produto.ano).includes('>');
            
            let anoCompativel = false;
            if (temAnoEmDiante) {
                anoCompativel = anoVeiculoNum >= anoMin;
            } else {
                anoCompativel = anoVeiculoNum >= anoMin && anoVeiculoNum <= anoMax;
            }
            
            if (anoCompativel) {
                // Bonus maior para anos exatos ou próximos
                if (anoVeiculoNum === anoMin || anoVeiculoNum === anoMax) {
                    score += 30; // Ano exato
                } else if (Math.abs(anoVeiculoNum - anoMin) <= 2 || Math.abs(anoVeiculoNum - anoMax) <= 2) {
                    score += 20; // Muito próximo
                } else {
                    score += 10; // Dentro do range
                }
            } else {
                // PENALIZAÇÃO: Se o ano não é compatível, reduz drasticamente o score
                score -= 50;
            }
        }
    }
    
    // BONUS: Categorias mais importantes para veículos
    if (produto.categoria) {
        const categoriaNorm = normalizeText(produto.categoria);
        if (categoriaNorm.includes('radiador')) score += 15;
        else if (categoriaNorm.includes('condensador')) score += 12;
        else if (categoriaNorm.includes('intercooler')) score += 10;
        else if (categoriaNorm.includes('eletroventilador')) score += 8;
        else if (categoriaNorm.includes('evaporador')) score += 5;
    }
    
    return score;
}

// Função para mostrar resultado da consulta de placa
function mostrarResultadoPlaca(dadosVeiculo, produtosEncontrados) {
    // Criar modal ou seção para mostrar resultado
    const resultadoHtml = `
        <div id="resultado-placa" class="resultado-placa-modal">
            <div class="resultado-placa-content">
                <div class="resultado-placa-header">
                    <h3>Veículo Encontrado</h3>
                    <button onclick="fecharResultadoPlaca()" class="btn-fechar">×</button>
                </div>
                <div class="resultado-placa-body">
                    <div class="veiculo-info">
                        <h4>Dados do Veículo</h4>
                        <p><strong>Placa:</strong> ${dadosVeiculo.placa}</p>
                        <p><strong>Marca:</strong> ${dadosVeiculo.marca}</p>
                        <p><strong>Modelo:</strong> ${dadosVeiculo.modelo}</p>
                        ${dadosVeiculo.ano ? `<p><strong>Ano:</strong> ${dadosVeiculo.ano}</p>` : ''}
                        ${dadosVeiculo.cor ? `<p><strong>Cor:</strong> ${dadosVeiculo.cor}</p>` : ''}
                    </div>
                    <div class="produtos-info">
                        <h4>Produtos Compatíveis</h4>
                        <p>${produtosEncontrados.length} produto(s) encontrado(s)</p>
                        <button onclick="aplicarFiltroPorPlaca()" class="btn-aplicar-filtro">
                            Ver Produtos Compatíveis
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Adicionar modal ao DOM
    const modalExistente = document.getElementById('resultado-placa');
    if (modalExistente) {
        modalExistente.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', resultadoHtml);
    
    // Armazenar dados para uso posterior
    window.dadosVeiculoConsultado = dadosVeiculo;
    window.produtosVeiculoConsultado = produtosEncontrados;
}

// Função para fechar resultado da placa
function fecharResultadoPlaca() {
    const modal = document.getElementById('resultado-placa');
    if (modal) {
        modal.remove();
    }
}

// Função para aplicar filtro baseado na consulta de placa
function aplicarFiltroPorPlaca() {
    if (!window.dadosVeiculoConsultado) return;
    
    const dadosVeiculo = window.dadosVeiculoConsultado;
    
    // Construir URL com filtros baseados no veículo
    let url = 'todosprodutos.html?';
    const params = [];
    
    // Adicionar filtros baseados nos dados do veículo
    if (dadosVeiculo.marca) {
        params.push(`montadora=${encodeURIComponent(dadosVeiculo.marca)}`);
    }
    
    if (dadosVeiculo.modelo) {
        params.push(`search=${encodeURIComponent(dadosVeiculo.modelo)}`);
        params.push(`campo=modelo`);
    }
    
    // Adicionar indicador de que é busca por placa
    params.push(`busca=placa`);
    params.push(`placa=${encodeURIComponent(dadosVeiculo.placa)}`);
    
    url += params.join('&');
    
    // Fechar modal e redirecionar
    fecharResultadoPlaca();
    window.location.href = url;
}

// Função para mostrar loading
function mostrarLoading(mensagem = 'Carregando...') {
    const loadingHtml = `
        <div id="loading-placa" class="loading-placa-overlay">
            <div class="loading-placa-content">
                <div class="loading-spinner"></div>
                <p>${mensagem}</p>
            </div>
        </div>
    `;
    
    const loadingExistente = document.getElementById('loading-placa');
    if (loadingExistente) {
        loadingExistente.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', loadingHtml);
}

// Função para esconder loading
function esconderLoading() {
    const loading = document.getElementById('loading-placa');
    if (loading) {
        loading.remove();
    }
}

// Função para mostrar erro
function mostrarErro(mensagem) {
    const erroHtml = `
        <div id="erro-placa" class="erro-placa-modal">
            <div class="erro-placa-content">
                <div class="erro-placa-header">
                    <h3>Erro na Consulta</h3>
                    <button onclick="fecharErroPlaca()" class="btn-fechar">×</button>
                </div>
                <div class="erro-placa-body">
                    <p>${mensagem}</p>
                    <button onclick="fecharErroPlaca()" class="btn-ok">OK</button>
                </div>
            </div>
        </div>
    `;
    
    const erroExistente = document.getElementById('erro-placa');
    if (erroExistente) {
        erroExistente.remove();
    }
    
    document.body.insertAdjacentHTML('beforeend', erroHtml);
}

// Função para fechar erro
function fecharErroPlaca() {
    const modal = document.getElementById('erro-placa');
    if (modal) {
        modal.remove();
    }
}

// Exportar funções principais para uso global
window.consultarPlaca = consultarPlaca;
window.buscarProdutosPorVeiculo = buscarProdutosPorVeiculo;
window.mostrarResultadoPlaca = mostrarResultadoPlaca;
window.fecharResultadoPlaca = fecharResultadoPlaca;
window.aplicarFiltroPorPlaca = aplicarFiltroPorPlaca;
window.fecharErroPlaca = fecharErroPlaca;
window.validarFormatoPlaca = validarFormatoPlaca;
