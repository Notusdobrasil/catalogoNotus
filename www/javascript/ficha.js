// Função para normalizar texto (remove acentos e converte para minúsculo)
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

// Função para normalizar termos de busca (trata plurais e variações de gênero)
function normalizeTerm(term) {
  if (!term) return '';
  
  let normalized = normalizeText(term);
  
  // Dicionário de termos específicos e suas variações
  const termVariations = {
    'condensador': ['condensador', 'condensadora', 'condensadores', 'condensadoras'],
    'radiador': ['radiador', 'radiadora', 'radiadores', 'radiadora'],
    'intercooler': ['intercooler', 'intercoolers'],
    'eletroventilador': ['eletroventilador', 'eletroventiladora', 'eletroventiladores', 'eletroventiladoras'],
    'evaporador': ['evaporador', 'evaporadora', 'evaporadores', 'evaporadoras'],
    'ventilador': ['ventilador', 'ventiladora', 'ventiladores', 'ventiladoras'],
    'gmv': ['gmv', 'gmvs']
  };
  
  // Verifica se o termo corresponde a alguma variação conhecida
  for (const [baseTerm, variations] of Object.entries(termVariations)) {
    if (variations.includes(normalized)) {
      return baseTerm; // Retorna o termo base
    }
  }
  
  // Tratamento genérico para plurais e variações de gênero
  // Remove sufixos comuns em ordem de prioridade
  if (normalized.endsWith('ores')) {
    return normalized.slice(0, -4) + 'or'; // ex: condensadores -> condensador
  }
  if (normalized.endsWith('oras')) {
    return normalized.slice(0, -4) + 'or'; // ex: condensadoras -> condensador
  }
  if (normalized.endsWith('eres')) {
    return normalized.slice(0, -4) + 'er'; // ex: intercoolers -> intercooler
  }
  if (normalized.endsWith('ades')) {
    return normalized.slice(0, -4) + 'ade'; // ex: unidades -> unidade
  }
  if (normalized.endsWith('oes')) {
    return normalized.slice(0, -3) + 'ao'; // ex: radiações -> radiacao
  }
  if (normalized.endsWith('ais')) {
    return normalized.slice(0, -3) + 'al'; // ex: radiais -> radial
  }
  if (normalized.endsWith('eis')) {
    return normalized.slice(0, -3) + 'el'; // ex: níveis -> nivel
  }
  if (normalized.endsWith('es')) {
    return normalized.slice(0, -2); // ex: motores -> motor
  }
  if (normalized.endsWith('as')) {
    return normalized.slice(0, -2) + 'a'; // ex: pecas -> peca
  }
  if (normalized.endsWith('s') && normalized.length > 3) {
    return normalized.slice(0, -1); // ex: radiadores -> radiador
  }
  if (normalized.endsWith('a') && normalized.length > 3) {
    // Tenta remover 'a' feminino: condensadora -> condensador
    const withoutA = normalized.slice(0, -1);
    if (withoutA.endsWith('or') || withoutA.endsWith('er') || withoutA.endsWith('ar')) {
      return withoutA;
    }
  }
  
  return normalized;
}

// Função de busca inteligente que procura em todos os campos do produto
function searchInAllFields(produto, searchTerms) {
  // Se não há termos de busca, retorna true
  if (!searchTerms || searchTerms.length === 0) return true;
  
  // Coleta todos os valores do produto em uma string única
  const allProductData = Object.values(produto)
    .filter(value => value !== null && value !== undefined)
    .map(value => normalizeText(String(value)))
    .join(' ');
  
  // Verifica se TODAS as palavras-chave estão presentes (considerando variações)
  return searchTerms.every(term => {
    const normalizedSearchTerm = normalizeTerm(term);
    const originalTerm = normalizeText(term);
    
    // Busca tanto pelo termo normalizado quanto pelo termo original
    return allProductData.includes(normalizedSearchTerm) || 
           allProductData.includes(originalTerm);
  });
}

// Função para formatar a descrição do produto (versão original)
function formatarDescricaoProduto(produto) {
  const categoria = produto.categoria || '';
  const montadora = produto.montadora || '';
  const modelo = produto.modelo || '';
  const ano = produto.ano || '';
  
  // Formata cada linha
  const linhas = [];
  if (categoria) linhas.push(categoria);
  if (montadora) linhas.push(montadora);
  if (modelo) linhas.push(modelo);
  if (ano) linhas.push(ano);
  
  return linhas.join('<br>');
}

// Função para agrupar produtos por código e combinar modelos
function groupProductsByCode(produtos) {
  const grouped = {};
  
  produtos.forEach(produto => {
    const codigo = produto.codigo;
    if (!grouped[codigo]) {
      // Primeiro produto com este código - usa como base
      grouped[codigo] = {
        ...produto,
        modelos: [produto.modelo],
        anos: [produto.ano],
        montadoras: [produto.montadora]
      };
    } else {
      // Adiciona modelo se não existir já
      if (produto.modelo && !grouped[codigo].modelos.includes(produto.modelo)) {
        grouped[codigo].modelos.push(produto.modelo);
      }
      // Adiciona ano se não existir já
      if (produto.ano && !grouped[codigo].anos.includes(produto.ano)) {
        grouped[codigo].anos.push(produto.ano);
      }
      // Adiciona montadora se não existir já
      if (produto.montadora && !grouped[codigo].montadoras.includes(produto.montadora)) {
        grouped[codigo].montadoras.push(produto.montadora);
      }
    }
  });
  
  return Object.values(grouped);
}

// Função para extrair anos de uma string e converter para números
function extrairAnos(anoString) {
  if (!anoString || anoString === 'TODOS') return [];
  
  // Regex para encontrar anos de 4 dígitos ou 2 dígitos, incluindo casos com ">"
  const matches = anoString.match(/\b(\d{2,4})>?\b/g);
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

// Função para formatar range de anos
function formatarRangeAnos(anos) {
  if (!anos || anos.length === 0) return '';
  
  // Verifica se algum ano tem ">" indicando "em diante"
  const temAnoEmDiante = anos.some(anoString => anoString && anoString.includes('>'));
  
  // Extrai todos os anos numéricos de todas as strings de ano
  let todosAnos = [];
  anos.forEach(anoString => {
    const anosExtraidos = extrairAnos(anoString);
    todosAnos = todosAnos.concat(anosExtraidos);
  });
  
  if (todosAnos.length === 0) {
    // Se não conseguiu extrair anos numéricos, retorna as strings originais
    return [...new Set(anos)].join(', ');
  }
  
  // Remove duplicatas e ordena
  todosAnos = [...new Set(todosAnos)].sort((a, b) => a - b);
  
  const menorAno = todosAnos[0];
  const maiorAno = todosAnos[todosAnos.length - 1];
  
  if (menorAno === maiorAno) {
    return temAnoEmDiante ? `${menorAno}>` : menorAno.toString();
  } else {
    const anoFinal = temAnoEmDiante ? `${maiorAno}>` : maiorAno.toString();
    return `${menorAno} - ${anoFinal}`;
  }
}

// Função para formatar a descrição com múltiplos modelos
function formatarDescricaoMultiplosModelos(produto) {
  const categoria = produto.categoria || '';
  const montadoras = produto.montadoras ? produto.montadoras.join(', ') : (produto.montadora || '');
  const modelos = produto.modelos ? produto.modelos.join(', ') : (produto.modelo || '');
  const anos = formatarRangeAnos(produto.anos || [produto.ano]);
  
  // Formata cada linha
  const linhas = [];
  if (categoria) linhas.push(categoria);
  if (montadoras) linhas.push(montadoras);
  if (modelos) linhas.push(modelos);
  if (anos) linhas.push(anos);
  
  return linhas.join('<br>');
}

async function populateRelatedProducts(currentProduto) {
    try {
        const response = await fetch("./conversor/produtos.json");
        const produtos = await response.json();

        // Extrai os números após o hífen e antes do ponto, ex: "NT-7091.523" => "7091"
        const match = currentProduto.codigo.match(/-(\d+)\./);
        const numeroSimilar = match ? match[1] : null;
        
        if (!numeroSimilar) {
            console.error("Formato do código diferente do esperado:", currentProduto.codigo);
            return;
        }

        // Filtra os produtos que possuem o mesmo trecho numérico e que não sejam o produto atual
        const relatedProducts = produtos.filter(p => {
            if (!p.codigo || p.codigo === currentProduto.codigo) return false;
            const m = p.codigo.match(/-(\d+)\./);
            return m && m[1] === numeroSimilar;
        });

        // Remove itens com código duplicado
        const uniqueRelatedProducts = [...new Map(
            relatedProducts.map(p => [p.codigo, p])
        ).values()];

        // Seleciona o container dos cards
        const carouselContainer = document.querySelector(".carousel-container");
        if (carouselContainer) {
            // Limpa o container
            carouselContainer.innerHTML = '';

            // Cria estrutura do swiper
            const swiperWrapper = document.createElement('div');
            swiperWrapper.className = 'swiper-wrapper';

            if (uniqueRelatedProducts.length === 0) {
                swiperWrapper.innerHTML = '<p style="text-align: center; padding: 20px;">Nenhum produto relacionado encontrado.</p>';
                carouselContainer.appendChild(swiperWrapper);
                return;
            }

            uniqueRelatedProducts.forEach(p => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';

                const card = document.createElement("div");
                card.className = "card-two";

                // card-content
                const cardContent = document.createElement("div");
                cardContent.className = "card-content";

                const pCodigo = document.createElement("p");
                pCodigo.textContent = p.codigo || "Código não definido";
                pCodigo.classList.add("titulo-lancamento-prod");

                const img = document.createElement("img");
                img.src = p.imagem || './image/radiador.png';
                img.alt = p.nome || p.codigo || '';

                const pDescricao = document.createElement("p");
                pDescricao.innerHTML = formatarDescricaoMultiplosModelos(p);
                pDescricao.classList.add("titulo-lancamento-descricao");

                cardContent.append(pCodigo, img, pDescricao);
                card.appendChild(cardContent);

                // icons-container
                const iconsContainer = document.createElement("div");
                iconsContainer.className = "icons-container";

                // Ícone de favorito
                let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                const isFavorite = favorites.some(item => item.id === p.id);
                const heartIcon = document.createElement('i');
                heartIcon.className = isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                heartIcon.setAttribute('data-id', p.id || p.codigo);
                if (isFavorite) heartIcon.style.color = 'red';
                heartIcon.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                    const existingItem = favorites.find(item => item.id === p.id);
                    if (existingItem) {
                        this.classList.remove("fa-solid");
                        this.classList.add("fa-regular");
                        this.style.color = "";
                        favorites = favorites.filter(item => item.id !== p.id);
                    } else {
                        favorites.push({
                            id: p.id,
                            name: p.codigo,
                            image: p.imagem,
                            quantity: 1
                        });
                        this.classList.remove("fa-regular");
                        this.classList.add("fa-solid");
                        this.style.color = "red";
                        abrirNav();
                    }
                    localStorage.setItem('favorites', JSON.stringify(favorites));
                    renderFavorites();
                });

                // Ícone de carrinho
                const cartIcon = document.createElement('i');
                cartIcon.className = 'fa-solid fa-cart-shopping';
                cartIcon.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    let cart = JSON.parse(localStorage.getItem('cart')) || [];
                    const existingItem = cart.find(item => item.id === p.id);
                    if (existingItem) {
                        existingItem.quantity += 1;
                    } else {
                        cart.push({
                            id: p.id,
                            name: p.codigo,
                            image: p.imagem || './image/radiador.png',
                            quantity: 1
                        });
                    }
                    localStorage.setItem('cart', JSON.stringify(cart));
                    alert("Produto adicionado ao carrinho!");
                });

                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);
                card.appendChild(iconsContainer);

                // Redirecionamento ao clicar no card (exceto ícones)
                card.addEventListener("click", function(e) {
                    if (!e.target.classList.contains("fa-heart") && !e.target.classList.contains("fa-cart-shopping")) {
                        window.location.href = "ficha-produto.html?id=" + p.id;
                    }
                });

                slideDiv.appendChild(card);
                swiperWrapper.appendChild(slideDiv);
            });

            // Adiciona a estrutura do swiper ao container
            carouselContainer.appendChild(swiperWrapper);

            // Adiciona botões de navegação e paginação
            const btnPrev = document.createElement('div');
            btnPrev.className = 'swiper-button-prev swiper-button-prev-relacionados';
            const btnNext = document.createElement('div');
            btnNext.className = 'swiper-button-next swiper-button-next-relacionados';
            const pagination = document.createElement('div');
            pagination.className = 'swiper-pagination swiper-pagination-relacionados';

            if (window.innerWidth >= 886) {
                carouselContainer.appendChild(btnPrev);
                carouselContainer.appendChild(btnNext);
                carouselContainer.appendChild(pagination);
            }

            // Inicializa o Swiper
            setTimeout(() => {
                new Swiper('.carousel-container', {
                    slidesPerView: 'auto',
                    spaceBetween: 200,
                    slidesOffsetAfter: 200,
                    loop: false,
                    navigation: {
                        nextEl: '.swiper-button-next-relacionados',
                        prevEl: '.swiper-button-prev-relacionados',
                    },
                    breakpoints: {
                        0: {
                        slidesPerView: 1.8,
                        spaceBetween: 10
                        },
                        480: {
                        slidesPerView: 2.2,
                        spaceBetween: 10
                        },
                        634: {
                        slidesPerView: 3,
                        spaceBetween: 20
                        },
                        768: {
                        slidesPerView: 2.9,
                        spaceBetween: 24
                        },
                        1024: {
                        slidesPerView: 4,
                        spaceBetween: 24
                        },
                        1440: {
                        slidesPerView: 5,
                        spaceBetween: 24
                        },
                        1920: {
                        slidesPerView: 5.2,
                        spaceBetween: 24
                        },
                        2260: {
                        slidesPerView: 6.2,
                        spaceBetween: 24
                        }
                    },
                    watchOverflow: true,
                    allowTouchMove: true,
                    preventClicks: true,
                    preventClicksPropagation: true
                });
            }, 0);
        }
    } catch (error) {
        console.error("Erro ao carregar produtos relacionados:", error);
    }
}

document.addEventListener("DOMContentLoaded", async function () {
    try {
        // Carregar o arquivo JSON de produtos
        const response = await fetch("./conversor/produtos.json");
        const produtos = await response.json();
        
        // Obter o ID do produto via URL
        const params = new URLSearchParams(window.location.search);
        const produtoId = params.get("id");
        
        // Encontrar o produto correspondente
        const produto = produtos.find(p => p.id == produtoId);
        
        if (produto) {
            // Configurar botões de favorito e carrinho
            const favoriteBtn = document.getElementById("favorite-btn");
            const cartBtn = document.getElementById("cart-btn");

            // Verificar se o produto já está nos favoritos
            let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
            const isFavorite = favorites.some(item => item.id === produto.id);
            if (isFavorite) {
                favoriteBtn.classList.remove("fa-regular");
                favoriteBtn.classList.add("fa-solid");
                favoriteBtn.style.color = "red";
            }

            // Evento de clique no botão de favorito
            favoriteBtn.addEventListener("click", function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
                const existingItem = favorites.find(item => item.id === produto.id);

                if (existingItem) {
                    favorites = favorites.filter(item => item.id !== produto.id);
                    this.classList.remove("fa-solid");
                    this.classList.add("fa-regular");
                    this.style.color = "";
                } else {
                    favorites.push({
                        id: produto.id,
                        name: produto.codigo,
                        image: produto.imagem,
                        quantity: 1
                    });
                    this.classList.remove("fa-regular");
                    this.classList.add("fa-solid");
                    this.style.color = "red";
                    abrirNav();
                }

                localStorage.setItem('favorites', JSON.stringify(favorites));
                renderFavorites();
            });

            // Evento de clique no botão do carrinho
            cartBtn.addEventListener("click", function() {
                let cart = JSON.parse(localStorage.getItem('cart')) || [];
                const existingItem = cart.find(item => item.id === produto.id);
                
                if (existingItem) {
                    existingItem.quantity += 1;
                } else {
                    cart.push({
                        id: produto.id,
                        name: produto.codigo,
                        image: produto.imagem || './image/radiador.png',
                        quantity: 1
                    });
                }
                
                localStorage.setItem('cart', JSON.stringify(cart));
                abrirNavCarrinho();
            });

            // Atualizar elementos do grid com verificação de valores nulos ou vazios
            document.getElementById("produto-codigo").textContent = produto.codigo || "-";
            document.getElementById("produto-nome").textContent = produto.nome || "-";
            document.getElementById("produto-linha").textContent = produto.linha || "-";
            document.getElementById("produto-transmissao").textContent = produto.transmissao || "-";
            document.getElementById("produto-tecnologia").textContent = produto.tecnologia || "-";
            document.getElementById("produto-ac").textContent = produto.ac || "-";
            document.getElementById("produto-alturacolmeia").textContent = produto.alturacolmeia || "-";
            document.getElementById("produto-comprimentocolmeia").textContent = produto.comprimentocolmeia || "-";
            document.getElementById("produto-larguracolmeia").textContent = produto.larguracolmeia || "-";

            // Atualizar imagem principal
            const mainImage = document.querySelector(".main-image");
            if (mainImage && produto.imagem) {
                mainImage.src = produto.imagem;
                mainImage.alt = produto.nome;
            }
            
            // Atualizar as imagens extras no thumbnail-container
            const thumbnailContainer = document.querySelector(".thumbnail-container");
            if (thumbnailContainer) {
                thumbnailContainer.innerHTML = "";
                const chavesImagens = ["imagem", "2imagem", "3imagem", "4imagem"];
                const imagensDisponiveis = chavesImagens.filter(chave => produto[chave]);
                
                // Só mostra o container de miniaturas se houver mais de uma imagem
                if (imagensDisponiveis.length > 1) {
                    imagensDisponiveis.forEach(chave => {
                        const img = document.createElement("img");
                        img.src = produto[chave];
                        img.alt = produto.nome;
                        img.classList.add("thumbnail");
                        img.addEventListener("click", () => {
                            mainImage.src = produto[chave];
                        });
                        thumbnailContainer.appendChild(img);
                    });
                } else {
                    // Se tiver apenas uma imagem, esconde o container de miniaturas
                    thumbnailContainer.style.display = "none";
                }
            }
            
            // Chama as funções para preencher as tabelas
            await populateProductTable();
            await populateApplicationsTable();
            
            // Chama a função para exibir os produtos relacionados
            populateRelatedProducts(produto);

            // Atualiza o título da versão mobile dinamicamente
            document.getElementById("produto-titulo-mobile").textContent =
                (produto.nome || "-") + " - " + (produto.codigo || "-");

            // Atualiza os outros campos dinâmicos na versão mobile
            document.getElementById("produto-linha-mobile").textContent =
                produto.linha || "-";
            document.getElementById("produto-tecnologia-mobile").textContent =
                produto.tecnologia || "-";
            document.getElementById("produto-ac-mobile").textContent =
                produto.ac || "-";
            document.getElementById("produto-transmissao-mobile").textContent =
                produto.transmissao || "-";
            document.getElementById("produto-altura-mobile").textContent =
                produto.altura || "-";
            document.getElementById("produto-comprimento-mobile").textContent =
                produto.comprimento || "-";
            document.getElementById("produto-largura-mobile").textContent =
                produto.largura || "-";
            document.getElementById("produto-alturacolmeia-mobile").textContent =
                produto.alturacolmeia || "-";
            document.getElementById("produto-comprimentocolmeia-mobile").textContent =
                produto.comprimentocolmeia || "-";
            document.getElementById("produto-larguracolmeia-mobile").textContent =
                produto.larguracolmeia || "-";
        } else {
            console.error("Produto não encontrado para o ID:", produtoId);
        }
    } catch (error) {
        console.error("Erro ao carregar os produtos:", error);
    }

// expõe o closeModal globalmente
window.closeModal = function() {
  document.getElementById("imgModal").style.display = "none";
  document.body.classList.remove('modal-open');
};

});


// Função para preencher a tabela com os dados dos produtos
async function populateProductTable() {
    try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get("id");
        if (!productId) {
            console.error("Id do produto não informado na URL");
            return;
        }
        
        const response = await fetch("./conversor/produtos.json");
        const produtos = await response.json();
        const produto = produtos.find(p => p.id == productId);
        
        if (!produto) {
            console.error("Produto não encontrado para o id:", productId);
            return;
        }
        
        // Encontra todos os produtos com o mesmo código mas IDs diferentes
        const produtosRelacionados = produtos.filter(p => 
            p.codigo === produto.codigo && p.id != productId
        );

        // Remove duplicatas baseado no código
        const produtosUnicos = [...new Map(
            [produto, ...produtosRelacionados].map(p => [p.codigo, p])
        ).values()];

        const productTableDiv = document.getElementById("produtoTabela");
        if (!productTableDiv) {
            console.error("Elemento produtoTabela não encontrado");
            return;
        }
        
        // Cria a tabela e o cabeçalho
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Notus do Brasil</th>
                <th>OEM</th>
                <th>Valeo</th>
                <th>Visconde</th>
                <th>Denso</th>
                <th>Mahle</th>
                <th>Marelli</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Preenche as linhas da tabela
        const tbody = document.createElement("tbody");
        
        // Função para separar múltiplos códigos
        function separarCodigos(codigo) {
            if (!codigo) return ["-"];
            const codigoStr = String(codigo).trim();
            if (!codigoStr) return ["-"];
            if (!codigoStr.includes(' - ')) return [codigoStr];
            return codigoStr.split(' - ').map(c => c.trim()).filter(c => c);
        }

        // Função para criar linhas de um produto
        function criarLinhasProduto(produto, index) {
            const codigo = separarCodigos(produto.codigo);
            const referenciaoriginal = separarCodigos(produto.referenciaoriginal);
            const valeos = separarCodigos(produto.valeo);
            const viscondes = separarCodigos(produto.visconde);
            const densos = separarCodigos(produto.denso);
            const mahles = separarCodigos(produto.mahle);
            const marellis = separarCodigos(produto.marelli);

            const maxLinhas = Math.max(
                codigo.length,
                referenciaoriginal.length,
                valeos.length,
                viscondes.length,
                densos.length,
                mahles.length,
                marellis.length
            );

            for (let i = 0; i < maxLinhas; i++) {
                const row = document.createElement("tr");
                row.className = (index + i) % 2 === 0 ? "row-white" : "row-gray";
                
                // Adiciona classe para esconder linhas extras
                if (i >= 4) {
                    row.classList.add("hidden-row");
                    row.style.display = "none";
                }
                
                row.innerHTML = `
                    <td>${i < codigo.length ? codigo[i] : "-"}</td>
                    <td>${i < referenciaoriginal.length ? referenciaoriginal[i] : "-"}</td>
                    <td>${i < valeos.length ? valeos[i] : "-"}</td>
                    <td>${i < viscondes.length ? viscondes[i] : "-"}</td>
                    <td>${i < densos.length ? densos[i] : "-"}</td>
                    <td>${i < mahles.length ? mahles[i] : "-"}</td>
                    <td>${i < marellis.length ? marellis[i] : "-"}</td>
                `;
                tbody.appendChild(row);
            }
        }

        // Adiciona as linhas dos produtos únicos
        produtosUnicos.forEach((produto, index) => {
            criarLinhasProduto(produto, index);
        });
        
        table.appendChild(tbody);
        productTableDiv.innerHTML = "";
        productTableDiv.appendChild(table);

        // Adiciona o botão "Ver mais" se houver mais de 4 linhas
        const hiddenRows = table.querySelectorAll(".hidden-row");
        if (hiddenRows.length > 0) {
            const buttonContainer = document.createElement("div");
            buttonContainer.style.textAlign = "left";
            buttonContainer.style.marginTop = "10px";
            buttonContainer.style.marginLeft = "10px";
            
            let isExpanded = false;
            verMaisButton.addEventListener("click", (e) => {
                e.preventDefault();
                hiddenRows.forEach(row => {
                    row.style.display = isExpanded ? "none" : "table-row";
                });
                verMaisButton.querySelector('.mais-produtos').textContent = isExpanded ? "Ver mais" : "Ver menos";
                isExpanded = !isExpanded;
            });
            
            buttonContainer.appendChild(verMaisButton);
            productTableDiv.appendChild(buttonContainer);
        }
    } catch (error) {
        console.error("Erro ao preencher a tabela de produtos:", error);
    }
}

async function populateApplicationsTable() {
    try {
        const params = new URLSearchParams(window.location.search);
        const productId = params.get("id");
        if (!productId) {
            console.error("Id do produto não informado na URL");
            return;
        }
        
        const response = await fetch("./conversor/produtos.json");
        const produtos = await response.json();
        const produtoAtual = produtos.find(p => p.id == productId);
        
        if (!produtoAtual) {
            console.error("Produto não encontrado para o id:", productId);
            return;
        }

        // Encontra todos os produtos com o mesmo código mas IDs diferentes
        const produtosRelacionados = produtos.filter(p => 
            p.codigo === produtoAtual.codigo && p.id != productId
        );

        const applicationsTableDiv = document.querySelector("#produtoTabela:nth-of-type(2)");
        if (!applicationsTableDiv) return;

        // Cria a tabela e o cabeçalho
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        thead.innerHTML = `
            <tr>
                <th>Montadora</th>
                <th>Modelo</th>
                <th>Motor</th>
                <th>Ano</th>
                <th>A/C</th>
                <th>Transmissão</th>
                <th>Tecnologia</th>
            </tr>
        `;
        table.appendChild(thead);

        // Preenche as linhas da tabela
        const tbody = document.createElement("tbody");

        // Adiciona primeiro o produto atual
        const rowAtual = document.createElement("tr");
        rowAtual.className = "row-white";
        rowAtual.innerHTML = `
            <td>${produtoAtual.montadora || "-"}</td>
            <td>${produtoAtual.modelo || "-"}</td>
            <td>${produtoAtual.litragem || "-"}</td>
            <td>${produtoAtual.ano || "-"}</td>
            <td>${produtoAtual.ac || "-"}</td>
            <td>${produtoAtual.transmissao || "-"}</td>
            <td>${produtoAtual.tecnologia || "-"}</td>
        `;
        tbody.appendChild(rowAtual);

        // Adiciona os produtos relacionados
        produtosRelacionados.forEach((produto, index) => {
            const row = document.createElement("tr");
            row.className = (index + 1) % 2 === 0 ? "row-white" : "row-gray";
            
            // Adiciona classe para esconder linhas extras
            if (index >= 3) { // Ajustado para 3 pois já temos 1 linha do produto atual
                row.classList.add("hidden-row");
                row.style.display = "none";
            }

            row.innerHTML = `
                <td>${produto.montadora || "-"}</td>
                <td>${produto.modelo || "-"}</td>
                <td>${produto.litragem || "-"}</td>
                <td>${produto.ano || "-"}</td>
                <td>${produto.ac || "-"}</td>
                <td>${produto.transmissao || "-"}</td>
                <td>${produto.tecnologia || "-"}</td>
            `;
            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        applicationsTableDiv.innerHTML = "";
        applicationsTableDiv.appendChild(table);

        // Adiciona o botão "Ver mais" se houver mais de 4 linhas (incluindo o produto atual)
        const hiddenRows = table.querySelectorAll(".hidden-row");
        if (hiddenRows.length > 0) {
            const buttonContainer = document.createElement("div");
            buttonContainer.style.textAlign = "left";
            buttonContainer.style.marginTop = "10px";
            buttonContainer.style.marginLeft = "10px";
            
            const verMaisButton = document.createElement("a");
            verMaisButton.href = "#";
            verMaisButton.className = "mais-produtos-link";
            verMaisButton.innerHTML = '<p class="mais-produtos">Ver mais</p>';
            
            let isExpanded = false;
            verMaisButton.addEventListener("click", (e) => {
                e.preventDefault();
                hiddenRows.forEach(row => {
                    row.style.display = isExpanded ? "none" : "table-row";
                });
                verMaisButton.querySelector('.mais-produtos').textContent = isExpanded ? "Ver mais" : "Ver menos";
                isExpanded = !isExpanded;
            });
            
            buttonContainer.appendChild(verMaisButton);
            applicationsTableDiv.appendChild(buttonContainer);
        }
    } catch (error) {
        console.error("Erro ao preencher a tabela de aplicações:", error);
    }
}

document.addEventListener("DOMContentLoaded", function () {
    populateApplicationsTable();
});
// Seleciona os elementos do modal e da imagem principal

const mainImage = document.querySelector('.main-image');
const modal     = document.getElementById("imgModal");
const modalImg  = document.getElementById("modalImg");

mainImage.addEventListener("click", function() {
  modal.style.display = "flex";
  modalImg.src = this.src;
});

function closeModal() {
  modal.style.display = "none";
}

function imageZoom(imgID, resultID) {
  const img       = document.getElementById(imgID);
  const result    = document.getElementById(resultID);
  const container = img.parentElement;
  const lens      = document.createElement('div');
  lens.className  = 'img-zoom-lens';
  container.insertBefore(lens, img);

  let cx, cy;

  // função que (re)calcula tamanho e escala do zoom
  function updateZoomScale() {
    cx = result.offsetWidth  / lens.offsetWidth;
    cy = result.offsetHeight / lens.offsetHeight;
    result.style.backgroundSize =
      `${img.offsetWidth * cx}px ${img.offsetHeight * cy}px`;
  }

  img.addEventListener('load', () => {
    result.style.backgroundImage = `url(${img.src})`;
    updateZoomScale();
  });
  if (img.complete) img.dispatchEvent(new Event('load'));

  // show/hide no container
  container.addEventListener('mouseenter', () => {
    lens.style.display   = 'block';
    result.style.display = 'block';
    updateZoomScale();
  });
  container.addEventListener('mouseleave', () => {
    lens.style.display   = 'none';
    result.style.display = 'none';
  });

  // recalcula sempre que a janela mudar de tamanho
  window.addEventListener('resize', () => {
    if (result.style.display === 'block') {
      updateZoomScale();
    }
  });

  function getCursorPos(e) {
    const rect = img.getBoundingClientRect();
    const x = (e.pageX || e.touches[0].pageX) - rect.left - window.pageXOffset;
    const y = (e.pageY || e.touches[0].pageY) - rect.top  - window.pageYOffset;
    return { x, y };
  }

  function moveLens(e) {
    e.preventDefault();
    const pos = getCursorPos(e);
    let x = pos.x - lens.offsetWidth/2;
    let y = pos.y - lens.offsetHeight/2;
    x = Math.max(0, Math.min(x, img.offsetWidth  - lens.offsetWidth));
    y = Math.max(0, Math.min(y, img.offsetHeight - lens.offsetHeight));
    lens.style.left = `${x}px`;
    lens.style.top  = `${y}px`;
    result.style.backgroundPosition = `-${x * cx}px -${y * cy}px`;
  }

  lens.addEventListener('mousemove', moveLens);
  img .addEventListener('mousemove', moveLens);
  lens.addEventListener('touchmove', moveLens);
  img .addEventListener('touchmove', moveLens);
}

window.addEventListener('load', () =>
  imageZoom('produtoImagem','zoomResult')
);

// --- PATCH: Atualiza o ícone da ficha-produto ao remover favorito pelo menu ---
const originalRenderFavorites = window.renderFavorites || renderFavorites;
window.renderFavorites = function() {
    originalRenderFavorites && originalRenderFavorites();
    // Atualiza o ícone da ficha-produto se existir
    const favoriteBtn = document.getElementById("favorite-btn");
    if (favoriteBtn) {
        const params = new URLSearchParams(window.location.search);
        const produtoId = params.get("id");
        let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        const isFavorite = favorites.some(item => String(item.id) === String(produtoId));
        if (isFavorite) {
            favoriteBtn.classList.remove("fa-regular");
            favoriteBtn.classList.add("fa-solid");
            favoriteBtn.style.color = "red";
        } else {
            favoriteBtn.classList.remove("fa-solid");
            favoriteBtn.classList.add("fa-regular");
            favoriteBtn.style.color = "";
        }
    }
};

// Adiciona funcionalidade para fechar o modal ao clicar fora da imagem
modal.addEventListener("click", function(event) {
  if (event.target === modal) {
    closeModal();
  }
});

function ajustarScrollTabela() {
  const tabelas = document.querySelectorAll("#produtoTabela");

  tabelas.forEach(container => {
    const tabela = container.querySelector("table");
    if (!tabela) return;

    if (tabela.scrollWidth <= container.clientWidth) {
      container.style.overflowX = "hidden";
    } else {
      container.style.overflowX = "auto";
    }
  });
}

// Executa após carregar
window.addEventListener("load", ajustarScrollTabela);
// Executa também quando redimensionar a janela
window.addEventListener("resize", ajustarScrollTabela);
