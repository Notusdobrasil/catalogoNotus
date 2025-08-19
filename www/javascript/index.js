document.addEventListener('DOMContentLoaded', function() {
  // Função para formatar a descrição do produto
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

  // ===== BUSCA E REDIRECT =====
  const form = document.getElementById('searchFormIndex');
  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const searchTerm = document
        .getElementById('searchInputIndex')
        .value
        .trim();
      if (!searchTerm) return;

      const params = new URLSearchParams();
      params.set('search', searchTerm);
      window.location.href = `todosprodutos.html?${params.toString()}`;
    });
  }

  // ===== DROPDOWN “Categorias” =====
  const dropdown = document.querySelector('.dropdown');
  const submenu  = dropdown.querySelector('.submenu');
  const toggle   = dropdown.querySelector('.link_menu_lateral');
  let hideTimer;

  // 1) Hover: abre na hora, fecha com delay
  dropdown.addEventListener('mouseenter', () => {
    clearTimeout(hideTimer);
    dropdown.classList.add('open');
  });
  dropdown.addEventListener('mouseleave', () => {
    hideTimer = setTimeout(() => {
      dropdown.classList.remove('open');
    }, 300);
  });

  // 2) Clique (mobile): alterna open
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    clearTimeout(hideTimer);
    dropdown.classList.toggle('open');
  });

  // 3) Fecha se clicar fora
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) {
      dropdown.classList.remove('open');
    }
  });
});

function abrirMenuCategorias() {
    const submenu = document.querySelector('.dropdown .submenu');
    submenu.style.display = 'block';
    submenu.style.opacity = '1';
    submenu.style.transform = 'translateY(0)';
}

function fecharMenuCategorias() {
    const submenu = document.querySelector('.dropdown .submenu');
    submenu.style.opacity = '0';
    submenu.style.transform = 'translateY(-10px)';
    setTimeout(() => {
        submenu.style.display = 'none';
    }, 300); // Tempo da transição
}

document.addEventListener('DOMContentLoaded', () => {
  const btn      = document.getElementById("btn-whatsapp");
  const card     = document.getElementById("card-whatsapp");
  const balao    = document.getElementById("balao-whatsapp");
  const wrapper  = document.getElementById("icon-wrapper");
  const icoWhats = document.getElementById("whatsapp-icon");
  const icoClose = document.getElementById("close-icon");
  const DURATION = 600;
  const HALF     = DURATION / 2;

  // Garante que apenas o ícone do WhatsApp esteja visível inicialmente
  // Comentado temporariamente para depuração
  /*
  if (icoWhats) {
    icoWhats.style.opacity = '1';
    icoWhats.style.transform = 'translate(-50%, -50%) scale(1)';
  }
  if (icoClose) {
    icoClose.style.opacity = '0';
    icoClose.style.transform = 'translate(-50%, -50%) scale(0)';
  }
  */

  btn.addEventListener("click", e => {
    e.preventDefault();
    const opening = !card.classList.contains("show");

    // 1) toggle da classe única .show
    card.classList.toggle("show", opening);
    balao.classList.toggle("show", !opening);

    // 2) anima spin
    wrapper.classList.remove("spin-flip", "spin-back");
    void wrapper.offsetWidth;
    wrapper.classList.add(opening ? "spin-flip" : "spin-back");

    // 3) troca ícones no meio da animação
    setTimeout(() => {
      if (icoWhats) {
        icoWhats.style.opacity   = opening ? '0' : '1';
        icoWhats.style.transform = `translate(-50%, -50%) scale(${opening?0:1})`;
      }
      if (icoClose) {
        icoClose.style.opacity   = opening ? '1' : '0';
        icoClose.style.transform = `translate(-50%, -50%) scale(${opening?1:0})`;
      }
    }, HALF);
  });
});

const swiperBanners = new Swiper('.swiper-banners', {
    slidesPerView: 1,
    spaceBetween: 0.1,
    roundLengths: true,
    loop: true,
    pagination: {
        el: ".swiper-pagination",
        dynamicBullets: true,
        clickable: true,
    },
    navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
    },
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
});

const swiperCategorias = new Swiper('.swiper-categorias', {
    loop: true,
    passiveListeners: true, // Melhora a performance do scroll
    resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
    allowTouchMove: true,   // Permite o toque
    watchOverflow: true,    // Impede erros se não houver slides suficientes
    watchOverflow: true,  
    slidesPerView: 5,
    spaceBetween: 20,
    speed: 400,
    navigation: {
        nextEl: '.swiper-button-next-categorias',
        prevEl: '.swiper-button-prev-categorias',
    },
    breakpoints: {
                    0: {
                    slidesPerView: 1.85,
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
                    slidesPerView: 2.3,
                    spaceBetween: 24
                    },
                    1024: {
                    slidesPerView: 2.9,
                    spaceBetween: 24
                    },
                    1440: {
                    slidesPerView: 4.2,
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
    autoplay: {
        delay: 5000,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
    },
});

function carregarLancamentos() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(produtos => {
            const container = document.querySelector("#produtos-lancamentos");

            if (!container) {
                console.error('Container de lançamentos não encontrado');
                return;
            }

            // Filtra produtos de lançamento
            const produtosLancamento = produtos.filter(produto => produto.lancamento === true);
            
            // Agrupa por código e combina modelos
            const lancamentosAgrupados = groupProductsByCode(produtosLancamento).slice(0, 10);

            if (lancamentosAgrupados.length === 0) {
                container.innerHTML = '<p>Nenhum lançamento disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            lancamentosAgrupados.forEach(produto => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';

                const card = document.createElement('div');
                card.className = 'card-two';

                // Criar container para o conteúdo principal
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';

                const pCodigo = document.createElement('p');
                pCodigo.textContent = produto.codigo;
                pCodigo.classList.add('titulo-lancamento-prod');

                const img = document.createElement('img');
                img.src = produto.imagem;
                img.alt = produto.nome || 'Produto';

                const pDescricao = document.createElement('p');
                pDescricao.innerHTML = formatarDescricaoMultiplosModelos(produto);
                pDescricao.classList.add('titulo-lancamento-descricao');

                // Adicionar elementos ao card-content
                cardContent.appendChild(pCodigo);
                cardContent.appendChild(img);
                cardContent.appendChild(pDescricao);

                // Criar container para os ícones
                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';

                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-regular fa-heart';
                heartIcon.dataset.id = produto.id;
                heartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(produto.id, produto.codigo, produto.imagem);
                    heartIcon.classList.toggle('fa-solid');
                    heartIcon.classList.toggle('fa-regular');
                    if (heartIcon.classList.contains('fa-solid')) {
                        heartIcon.style.color = 'red';
                        abrirNav();
                    } else {
                        heartIcon.style.color = '#134596';
                    }
                });

                const cartIcon = document.createElement('i');
                cartIcon.className = 'fa-solid fa-cart-shopping';
                cartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(produto.id, produto.codigo, produto.imagem);
                });

                // Adicionar ícones ao container
                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);

                // Adicionar evento de clique no card
                card.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('fa-heart') &&
                        !e.target.classList.contains('fa-cart-shopping')) {
                        window.location.href = `ficha-produto.html?id=${produto.id}`;
                    }
                });

                // Montar o card
                card.appendChild(cardContent);
                card.appendChild(iconsContainer);
                slideDiv.appendChild(card);
                container.appendChild(slideDiv);
            });

            new Swiper('.swiper-lancamentos', {
                slidesPerView: 'auto',
    passiveListeners: true, // Melhora a performance do scroll
    resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
    allowTouchMove: true,   // Permite o toque
    watchOverflow: true,    // Impede erros se não houver slides suficientes
                        watchOverflow: true,  
                        spaceBetween: 200,
                        loop: false,
                        slidesOffsetAfter: 200,
                        navigation: {
                            nextEl: '.swiper-button-next-lancamento',
                            prevEl: '.swiper-button-prev-lancamento',
                        },
                        breakpoints: {
                            0: {
                            slidesPerView: 1.7,
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
                            slidesPerView: 2.3,
                            spaceBetween: 24
                            },
                            1024: {
                            slidesPerView: 2.9,
                            spaceBetween: 24
                            },
                            1440: {
                            slidesPerView: 4.2,
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
        })
        .catch(error => console.error('Erro ao carregar lançamentos:', error));
}

function carregarRadiadores() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(produtos => {
            const container = document.querySelector("#produtos-radiadores");

            if (!container) {
                console.error('Container de radiadores não encontrado');
                return;
            }

            // Filtra produtos de radiador
            const produtosRadiador = produtos.filter(produto => 
                produto.categoria && produto.categoria.toLowerCase() === 'radiador'
            );
            
            // Agrupa por código e combina modelos
            const radiadoresAgrupados = groupProductsByCode(produtosRadiador).slice(0, 10);

            if (radiadoresAgrupados.length === 0) {
                container.innerHTML = '<p>Nenhum radiador disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            radiadoresAgrupados.forEach(produto => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';

                const card = document.createElement('div');
                card.className = 'card-two';

                // Criar container para o conteúdo principal
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';

                const pCodigo = document.createElement('p');
                pCodigo.textContent = produto.codigo;
                pCodigo.classList.add('titulo-lancamento-prod');

                const img = document.createElement('img');
                img.src = produto.imagem;
                img.alt = produto.nome || 'Produto';

                const pDescricao = document.createElement('p');
                pDescricao.innerHTML = formatarDescricaoMultiplosModelos(produto);
                pDescricao.classList.add('titulo-lancamento-descricao');

                // Adicionar elementos ao card-content
                cardContent.appendChild(pCodigo);
                cardContent.appendChild(img);
                cardContent.appendChild(pDescricao);

                // Criar container para os ícones
                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';

                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-regular fa-heart';
                heartIcon.dataset.id = produto.id;
                heartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(produto.id, produto.codigo, produto.imagem);
                    heartIcon.classList.toggle('fa-solid');
                    heartIcon.classList.toggle('fa-regular');
                    if (heartIcon.classList.contains('fa-solid')) {
                        heartIcon.style.color = 'red';
                        abrirNav();
                    } else {
                        heartIcon.style.color = '#134596';
                    }
                });

                const cartIcon = document.createElement('i');
                cartIcon.className = 'fa-solid fa-cart-shopping';
                cartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(produto.id, produto.codigo, produto.imagem);
                });

                // Adicionar ícones ao container
                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);

                // Adicionar evento de clique no card
                card.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('fa-heart') &&
                        !e.target.classList.contains('fa-cart-shopping')) {
                        window.location.href = `ficha-produto.html?id=${produto.id}`;
                    }
                });

                // Montar o card
                card.appendChild(cardContent);
                card.appendChild(iconsContainer);
                slideDiv.appendChild(card);
                container.appendChild(slideDiv);
            });

            // Inicializa o Swiper para Radiadores
            new Swiper('.swiper-radiadores', {
                slidesPerView: 'auto',
    passiveListeners: true, // Melhora a performance do scroll
    resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
    allowTouchMove: true,   // Permite o toque
    watchOverflow: true,    // Impede erros se não houver slides suficientes
                watchOverflow: true,  
                spaceBetween: 200,
                loop: false,
                slidesOffsetAfter: 200,
                navigation: {
                    nextEl: '.swiper-button-next-radiador',
                    prevEl: '.swiper-button-prev-radiador',
                },
                breakpoints: {
                    0: {
                    slidesPerView: 1.7,
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
                    slidesPerView: 2.3,
                    spaceBetween: 24
                    },
                    1024: {
                    slidesPerView: 2.9,
                    spaceBetween: 24
                    },
                    1440: {
                    slidesPerView: 4.2,
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
        })
        .catch(error => console.error('Erro ao carregar radiadores:', error));
}

function carregarCondensadores() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(produtos => {
            const container = document.querySelector("#produtos-condensadores");

            if (!container) {
                console.error('Container de condensadores não encontrado');
                return;
            }

            // Filtra produtos de condensador
            const produtosCondensador = produtos.filter(produto => 
                produto.categoria && produto.categoria.toLowerCase() === 'condensador'
            );
            
            // Agrupa por código e combina modelos
            const condensadoresAgrupados = groupProductsByCode(produtosCondensador).slice(0, 10);

            if (condensadoresAgrupados.length === 0) {
                container.innerHTML = '<p>Nenhum condensador disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            condensadoresAgrupados.forEach(produto => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';

                const card = document.createElement('div');
                card.className = 'card-two';

                // Criar container para o conteúdo principal
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';

                const pCodigo = document.createElement('p');
                pCodigo.textContent = produto.codigo;
                pCodigo.classList.add('titulo-lancamento-prod');

                const img = document.createElement('img');
                img.src = produto.imagem;
                img.alt = produto.nome || 'Produto';

                const pDescricao = document.createElement('p');
                pDescricao.innerHTML = formatarDescricaoMultiplosModelos(produto);
                pDescricao.classList.add('titulo-lancamento-descricao');

                // Adicionar elementos ao card-content
                cardContent.appendChild(pCodigo);
                cardContent.appendChild(img);
                cardContent.appendChild(pDescricao);

                // Criar container para os ícones
                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';

                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-regular fa-heart';
                heartIcon.dataset.id = produto.id;
                heartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(produto.id, produto.codigo, produto.imagem);
                    heartIcon.classList.toggle('fa-solid');
                    heartIcon.classList.toggle('fa-regular');
                    if (heartIcon.classList.contains('fa-solid')) {
                        heartIcon.style.color = 'red';
                        abrirNav();
                    } else {
                        heartIcon.style.color = '#134596';
                    }
                });

                const cartIcon = document.createElement('i');
                cartIcon.className = 'fa-solid fa-cart-shopping';
                cartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(produto.id, produto.codigo, produto.imagem);
                });

                // Adicionar ícones ao container
                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);

                // Adicionar evento de clique no card
                card.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('fa-heart') &&
                        !e.target.classList.contains('fa-cart-shopping')) {
                        window.location.href = `ficha-produto.html?id=${produto.id}`;
                    }
                });

                // Montar o card
                card.appendChild(cardContent);
                card.appendChild(iconsContainer);
                slideDiv.appendChild(card);
                container.appendChild(slideDiv);
            });

            // Inicializa o Swiper para Condensadores
            new Swiper('.swiper-condensadores', {
                slidesPerView: 1,
                spaceBetween: 200,
    passiveListeners: true, // Melhora a performance do scroll
    resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
    allowTouchMove: true,   // Permite o toque
    watchOverflow: true,    // Impede erros se não houver slides suficientes
                watchOverflow: true,  
                loop: false,
                slidesOffsetAfter: 200,
                navigation: {
                    nextEl: '.swiper-button-next-condensador',
                    prevEl: '.swiper-button-prev-condensador',
                },
                breakpoints: {
                    0: {
                    slidesPerView: 1.7,
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
                    slidesPerView: 2.3,
                    spaceBetween: 24
                    },
                    1024: {
                    slidesPerView: 2.9,
                    spaceBetween: 24
                    },
                    1440: {
                    slidesPerView: 4.2,
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
        })
        .catch(error => console.error('Erro ao carregar condensadores:', error));
}

function carregarGMV() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(produtos => {
            const container = document.querySelector("#produtos-gmv");

            if (!container) {
                console.error('Container de GMV não encontrado');
                return;
            }

            // Filtra produtos de GMV
            const produtosGMV = produtos.filter(produto => 
                produto.categoria && produto.categoria.toLowerCase() === 'gmv'
            );
            
            // Agrupa por código e combina modelos
            const gmvsAgrupados = groupProductsByCode(produtosGMV).slice(0, 10);

            if (gmvsAgrupados.length === 0) {
                container.innerHTML = '<p>Nenhum GMV disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            gmvsAgrupados.forEach(produto => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';

                const card = document.createElement('div');
                card.className = 'card-two';

                // Criar container para o conteúdo principal
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';

                const pCodigo = document.createElement('p');
                pCodigo.textContent = produto.codigo;
                pCodigo.classList.add('titulo-lancamento-prod');

                const img = document.createElement('img');
                img.src = produto.imagem;
                img.alt = produto.nome || 'Produto';

                const pDescricao = document.createElement('p');
                pDescricao.innerHTML = formatarDescricaoMultiplosModelos(produto);
                pDescricao.classList.add('titulo-lancamento-descricao');

                // Adicionar elementos ao card-content
                cardContent.appendChild(pCodigo);
                cardContent.appendChild(img);
                cardContent.appendChild(pDescricao);

                // Criar container para os ícones
                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';

                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-regular fa-heart';
                heartIcon.dataset.id = produto.id;
                heartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(produto.id, produto.codigo, produto.imagem);
                    heartIcon.classList.toggle('fa-solid');
                    heartIcon.classList.toggle('fa-regular');
                    if (heartIcon.classList.contains('fa-solid')) {
                        heartIcon.style.color = 'red';
                        abrirNav();
                    } else {
                        heartIcon.style.color = '#134596';
                    }
                });

                const cartIcon = document.createElement('i');
                cartIcon.className = 'fa-solid fa-cart-shopping';
                cartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(produto.id, produto.codigo, produto.imagem);
                });

                // Adicionar ícones ao container
                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);

                // Adicionar evento de clique no card
                card.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('fa-heart') &&
                        !e.target.classList.contains('fa-cart-shopping')) {
                        window.location.href = `ficha-produto.html?id=${produto.id}`;
                    }
                });

                // Montar o card
                card.appendChild(cardContent);
                card.appendChild(iconsContainer);
                slideDiv.appendChild(card);
                container.appendChild(slideDiv);
            });

            // Inicializa o Swiper para GMV
            new Swiper('.swiper-gmv', {
                slidesPerView: 1,
    passiveListeners: true, // Melhora a performance do scroll
    resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
    allowTouchMove: true,   // Permite o toque
    watchOverflow: true,    // Impede erros se não houver slides suficientes
                watchOverflow: true,  
                spaceBetween: 200,
                loop: false,
                slidesOffsetAfter: 200,
                navigation: {
                    nextEl: '.swiper-button-next-gmv',
                    prevEl: '.swiper-button-prev-gmv',
                },
                breakpoints: {
                    0: {
                    slidesPerView: 1.7,
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
                    slidesPerView: 2.3,
                    spaceBetween: 24
                    },
                    1024: {
                    slidesPerView: 2.9,
                    spaceBetween: 24
                    },
                    1440: {
                    slidesPerView: 4.2,
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
        })
        .catch(error => console.error('Erro ao carregar GMVs:', error));
}

function carregarIntercoolers() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(produtos => {
            const container = document.querySelector("#produtos-intercooler");

            if (!container) {
                console.error('Container de intercoolers não encontrado');
                return;
            }

            // Filtra produtos de intercooler
            const produtosIntercooler = produtos.filter(produto => 
                produto.categoria && produto.categoria.toLowerCase() === 'intercooler'
            );
            
            // Agrupa por código e combina modelos
            const intercoolersAgrupados = groupProductsByCode(produtosIntercooler).slice(0, 10);

            if (intercoolersAgrupados.length === 0) {
                container.innerHTML = '<p>Nenhum intercooler disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            intercoolersAgrupados.forEach(produto => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';

                const card = document.createElement('div');
                card.className = 'card-two';

                // Criar container para o conteúdo principal
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';

                const pCodigo = document.createElement('p');
                pCodigo.textContent = produto.codigo;
                pCodigo.classList.add('titulo-lancamento-prod');

                const img = document.createElement('img');
                img.src = produto.imagem;
                img.alt = produto.nome || 'Produto';

                const pDescricao = document.createElement('p');
                pDescricao.innerHTML = formatarDescricaoMultiplosModelos(produto);
                pDescricao.classList.add('titulo-lancamento-descricao');

                // Adicionar elementos ao card-content
                cardContent.appendChild(pCodigo);
                cardContent.appendChild(img);
                cardContent.appendChild(pDescricao);

                // Criar container para os ícones
                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';

                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-regular fa-heart';
                heartIcon.dataset.id = produto.id; 
                heartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    toggleFavorite(produto.id, produto.codigo, produto.imagem);
                    heartIcon.classList.toggle('fa-solid');
                    heartIcon.classList.toggle('fa-regular');
                    if (heartIcon.classList.contains('fa-solid')) {
                        heartIcon.style.color = 'red';
                        abrirNav();
                    } else {
                        heartIcon.style.color = '#134596';
                    }
                });

                const cartIcon = document.createElement('i');
                cartIcon.className = 'fa-solid fa-cart-shopping';
                cartIcon.addEventListener('click', (e) => {
                    e.stopPropagation();
                    addToCart(produto.id, produto.codigo, produto.imagem);
                });

                // Adicionar ícones ao container
                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);

                // Adicionar evento de clique no card
                card.addEventListener('click', function(e) {
                    if (!e.target.classList.contains('fa-heart') &&
                        !e.target.classList.contains('fa-cart-shopping')) {
                        window.location.href = `ficha-produto.html?id=${produto.id}`;
                    }
                });

                // Montar o card
                card.appendChild(cardContent);
                card.appendChild(iconsContainer);
                slideDiv.appendChild(card);
                container.appendChild(slideDiv);
            });

            // Inicializa o Swiper para Intercoolers
            new Swiper('.swiper-intercooler', {
                slidesPerView: 1,
                passiveListeners: true, // Melhora a performance do scroll
                resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
                allowTouchMove: true,   // Permite o toque
                watchOverflow: true,    // Impede erros se não houver slides suficientes
                watchOverflow: true,  
                spaceBetween: 200,
                loop: false,
                slidesOffsetAfter: 200,
                navigation: {
                    nextEl: '.swiper-button-next-intecooler',
                    prevEl: '.swiper-button-prev-intecooler',
                },
                breakpoints: {
                    0: {
                    slidesPerView: 1.7,
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
                    slidesPerView: 2.3,
                    spaceBetween: 24
                    },
                    1024: {
                    slidesPerView: 2.9,
                    spaceBetween: 24
                    },
                    1440: {
                    slidesPerView: 4.2,
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
        })
        .catch(error => console.error('Erro ao carregar intercoolers:', error));
}

// Chama a função quando o DOM estiver carregado
document.addEventListener("DOMContentLoaded", function() {
    carregarLancamentos();
    carregarRadiadores();
    carregarCondensadores();
    carregarGMV();
    carregarIntercoolers();
});

// Menu hamburguer mobile
document.addEventListener('DOMContentLoaded', function() {
    const hamburguer = document.getElementById('hamburguer-menu');
    const menuLateral = document.getElementById('menu-lateral');

    if (!hamburguer || !menuLateral) return;

    function closeMenuOnClickOutside(event) {
        if (window.innerWidth <= 800 && menuLateral.classList.contains('open')) {
            if (!menuLateral.contains(event.target) && !hamburguer.contains(event.target)) {
                menuLateral.classList.remove('open');
            }
        }
    }

    hamburguer.addEventListener('click', function(e) {
        e.stopPropagation();
        menuLateral.classList.toggle('open');
    });

    // Fecha ao clicar fora
    document.addEventListener('click', closeMenuOnClickOutside);

    // Fecha ao redimensionar para desktop
    window.addEventListener('resize', function() {
        if (window.innerWidth > 800) {
            menuLateral.classList.remove('open');
        }
    });
});

// Botão Fale Conosco da index.html para contato com os vendedores
let btnFaleConosco = document.getElementById("btn-faleconosco")
let listaFaleConosco = document.getElementById("lista-faleconosco")

btnFaleConosco.addEventListener("click", function (event) {
    event.preventDefault()
    listaFaleConosco.classList.toggle("visible")
    btnFaleConosco.classList.toggle("secao1-botao-sembordaembaixo")
})

function toggleMenuWhatsapp() {
    const cardWhatsapp = document.getElementById('card-whatsapp');
    cardWhatsapp.classList.toggle('invisible');
}

document.addEventListener('DOMContentLoaded', () => {
    // Recupera os favoritos do localStorage
    const savedFavorites = JSON.parse(localStorage.getItem('favorites')) || [];

    // Atualiza o estado visual dos ícones de coração
    const heartIcons = document.querySelectorAll('.fa-heart');
    heartIcons.forEach(icon => {
        const produtoId = icon.dataset.produtoId; // Certifique-se de que o ícone tenha um atributo data-produto-id
        if (savedFavorites.some(fav => fav.id === produtoId)) {
            icon.classList.add('fa-solid');
            icon.classList.remove('fa-regular');
            icon.style.color = 'red';
        } else {
            icon.classList.add('fa-regular');
            icon.classList.remove('fa-solid');
            icon.style.color = '#134596';
        }
    });
});
