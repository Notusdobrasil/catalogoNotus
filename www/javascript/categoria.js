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

// Função para normalizar categorias especificamente (trata acentos e espaços)
function normalizeCategory(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim() // Remove espaços extras no início e fim
    .replace(/\s+/g, ' ') // Converte múltiplos espaços em um único espaço
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
}

// Função para normalizar texto (remove acentos e converte para minúsculo)
function normalizeText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    .trim() // Remove espaços extras no início e fim
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
// Extrai anos de string/numero (aceita "1997 - 2003", "2012>", 97, etc.)
function extrairAnos(anoString) {
  if (anoString === undefined || anoString === null) return [];
  const s = String(anoString).trim();
  if (s === '' || s.toUpperCase() === 'TODOS') return [];

  const matches = s.match(/\b(\d{2,4})>?\b/g);
  if (!matches) return [];

  return matches
    .map(a => parseInt(a.replace('>', ''), 10))
    .filter(n => !Number.isNaN(n))
    .map(n => (n < 100 ? (n < 50 ? 2000 + n : 1900 + n) : n));
}

// Formata range de anos (lida com números/strings/mistos)
function formatarRangeAnos(anos) {
  if (!anos) return '';
  if (!Array.isArray(anos)) anos = [anos];

  const anosStr = anos
    .filter(a => a !== undefined && a !== null && a !== '')
    .map(a => String(a));

  if (anosStr.length === 0) return '';

  const temAnoEmDiante = anosStr.some(s => s.includes('>'));

  let todosAnos = [];
  anosStr.forEach(s => { todosAnos = todosAnos.concat(extrairAnos(s)); });

  if (todosAnos.length === 0) return [...new Set(anosStr)].join(', ');

  todosAnos = [...new Set(todosAnos)].sort((a, b) => a - b);
  const menorAno = todosAnos[0];
  const maiorAno = todosAnos[todosAnos.length - 1];

  if (menorAno === maiorAno) return temAnoEmDiante ? `${menorAno}>` : String(menorAno);
  const anoFinal = temAnoEmDiante ? `${maiorAno}>` : String(maiorAno);
  return `${menorAno} - ${anoFinal}`;
}


// Função para formatar a descrição com múltiplos modelos
function formatarDescricaoMultiplosModelos(produto) {
  const categoria = produto.categoria || '';
  const montadoras = produto.montadoras ? produto.montadoras.join(', ') : (produto.montadora || '');
  const modelos = produto.modelos ? produto.modelos.join(', ') : (produto.modelo || '');
  const anos = formatarRangeAnos(Array.isArray(produto.anos) ? produto.anos : [produto.anos ?? produto.ano]);
  
  // Formata cada linha
  const linhas = [];
  if (categoria) linhas.push(categoria);
  if (montadoras) linhas.push(montadoras);
  if (modelos) linhas.push(modelos);
  if (anos) linhas.push(anos);
  
  return linhas.join('<br>');
}

// Função auxiliar pra capitalizar o nome da categoria
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Função para montar o slide do produto (padrão dos cards do index.js)
function montarSlide(produto) {
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
  return slideDiv;
}

// Pega o parâmetro ?cat= no URL
function getCategoria() {
  const params = new URLSearchParams(window.location.search);
  return params.get("cat") || "todos";
}

function pluralizeCategoria(cat) {
  if (!cat) return '';
  const lower = cat.toLowerCase();
  if (lower === 'radiador') return 'Radiadores';
  if (lower === 'eletroventilador') return 'Eletroventiladores';
  if (lower === 'intercooler') return 'Intercoolers';
  if (lower === 'gmv') return 'GMV';
  if (lower === 'evaporadora') return 'Evaporadoras';
  if (lower === 'condensador') return 'Condensadores';
  if (lower === 'radiador de óleo motor' || lower === 'radiador de oleo motor') return 'Radiadores de óleo motor';
  if (lower === 'radiador de óleo transmissão' || lower === 'radiador de oleo transmissao') return 'Radiadores de óleo transmissão';
  if (lower === 'radiador de aquecimento') return 'Radiadores de aquecimento';
  if (lower === 'ventilador interno') return 'Ventiladores internos';
  // fallback: só adiciona 's'
  return cat + 's';
}

// Função para preencher e inicializar um swiper dinâmico por grupo/nome
function montarSwiper({ categoria, grupo, nomeContem, lancamento, wrapperId, swiperClass, btnPrev, btnNext, sectionId }) {
  
  fetch("./conversor/produtos.json")
    .then(res => res.json())
    .then(produtos => {
      // filtra tudo normalmente
      let lista = produtos.filter(p => {
        const catOk = categoria === 'todos' || (p.categoria && normalizeCategory(p.categoria) === normalizeCategory(categoria));
        const grupoOk = grupo ? (p.grupo && p.grupo.toLowerCase().includes(grupo.toLowerCase())) : true;
        const nomeOk = nomeContem
          ? (
              (p.nome && p.nome.toLowerCase().includes(nomeContem.toLowerCase())) ||
              (p.descricao && p.descricao.toLowerCase().includes(nomeContem.toLowerCase()))
            )
          : true;
        const lancOk = lancamento ? p.lancamento === true : true;
        return catOk && grupoOk && nomeOk && lancOk;
      });

      console.log(`Filtro categoria "${categoria}": ${lista.length} produtos encontrados`); // Debug

      // Agrupa produtos por código para mostrar apenas um card por código
      lista = groupProductsByCode(lista);

      // limita a 20 itens
      lista = lista.slice(0, 20);

      const wrapper = document.getElementById(wrapperId);
      const section = document.getElementById(sectionId);
      const titleId = wrapperId.replace('produtos', 'titulo');
      const titleElem = document.getElementById(titleId);
      if (!lista.length) {
        section && (section.style.display = 'none');
        titleElem && (titleElem.style.display = 'none');
        return;
      }
      section && (section.style.display = '');
      titleElem && (titleElem.style.display = '');
      wrapper.innerHTML = '';
      lista.forEach(produto => wrapper.appendChild(montarSlide(produto)));

      new Swiper(swiperClass, {
        slidesPerView: 'auto',
        spaceBetween: 24,
        loop: false,
        slidesOffsetAfter: 24,
        navigation: { nextEl: btnNext, prevEl: btnPrev },
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
        preventClicksPropagation: true,
        observer: true,
        observeParents: true,
      });
    });
}

document.addEventListener("DOMContentLoaded", async () => {
  const cat = getCategoria();
  const produtos = await fetch("./conversor/produtos.json").then(r => r.json());
  const catNomePlural = pluralizeCategoria(capitalize(cat));
  
  console.log('Categoria da URL:', cat); // Debug
  console.log('Categoria normalizada:', normalizeCategory(cat)); // Debug
  
  // Filtra produtos pela categoria atual (usando normalização)
  const produtosDaCategoria = produtos.filter(p => 
    cat === 'todos' || (p.categoria && normalizeCategory(p.categoria) === normalizeCategory(cat))
  );
  
  // Debug: mostrar algumas categorias do JSON para comparação
  const categoriasSample = [...new Set(produtos.slice(0, 100).map(p => p.categoria).filter(Boolean))];
  console.log('Amostra de categorias no JSON:', categoriasSample);
  
  // Obtém grupos únicos dos produtos da categoria
  const gruposEncontrados = [...new Set(produtosDaCategoria
    .map(p => p.grupo)
    .filter(grupo => grupo && grupo.trim() !== '')
    .map(grupo => grupo.trim())
  )];

  // Define a ordem específica dos grupos
  const ordemGrupos = [
   'Universal', 'Outras', 'Utilitários', 'Empilhadeira', 'Agrícola', 'Ônibus', 'Caminhão', 'Moto', 
    'Van', 'Picape', 'SUV', 'Passeio'
  ];

  // Ordena os grupos encontrados conforme a ordem definida
  const gruposUnicos = ordemGrupos.filter(grupo => 
    gruposEncontrados.some(g => g.toLowerCase() === grupo.toLowerCase())
  );

  console.log('Grupos encontrados:', gruposUnicos); // Debug
  console.log('Categoria buscada:', cat); // Debug
  console.log('Produtos da categoria encontrados:', produtosDaCategoria.length); // Debug

  // Nome da categoria azul, complemento cinza
  document.getElementById("titulo").innerHTML = `<span style="margin: 0; padding: 0;"></span>`;

  // 1) Todos da categoria
  document.getElementById("titulo-todos").innerHTML = `<span style="margin: 0; padding: 0;">${catNomePlural}</span>`;
  montarSwiper({
    categoria: cat,
    wrapperId: "produtos-todos",
    swiperClass: ".swiper-todos",
    btnPrev: ".swiper-button-prev-todos",
    btnNext: ".swiper-button-next-todos",
    sectionId: "section-todos"
  });

  // 2) Swiper de lançamentos da categoria atual (logo após "Todos")
  const categoriaLancamentoMap = {
    'radiador': 'radiador',
    'intercooler': 'intercooler',
    'gmv': 'gmv',
    'eletroventilador': 'eletroventilador',
    'condensador': 'condensador',
    'evaporadora': 'evaporadora',
    'radiador de aquecimento': 'radiador-de-aquecimento',
    'radiador de óleo motor': 'radiador-de-oleo-motor',
    'radiador de oleo motor': 'radiador-de-oleo-motor', // versão sem acento
    'radiador de óleo transmissão': 'radiador-de-oleo-transmissao',
    'radiador de oleo transmissao': 'radiador-de-oleo-transmissao' // versão sem acento
  };
  const catKey = cat.toLowerCase();

  // Esconde todos os swipers/títulos de lançamentos específicos primeiro
  Object.keys(categoriaLancamentoMap).forEach(key => {
    const sectionId = 'section-lancamento-' + categoriaLancamentoMap[key];
    const tituloId = 'titulo-lancamento-' + categoriaLancamentoMap[key];
    const section = document.getElementById(sectionId);
    const titulo = document.getElementById(tituloId);
    if (section) section.style.display = 'none';
    if (titulo) titulo.style.display = 'none';
  });
  
  // Esconde também o swiper/título de lançamentos gerais
  const geralSection = document.getElementById('section-lancamento-geral');
  const geralTitulo = document.getElementById('titulo-lancamento-geral');
  if (geralSection) geralSection.style.display = 'none';
  if (geralTitulo) geralTitulo.style.display = 'none';

  // Exibe o swiper de lançamentos da categoria atual
  if (catKey === 'lancamento') {
    // Exibe todos os swipers de lançamentos, um para cada categoria
    Object.keys(categoriaLancamentoMap).forEach(key => {
      const sectionId = 'section-lancamento-' + categoriaLancamentoMap[key];
      const tituloId = 'titulo-lancamento-' + categoriaLancamentoMap[key];
      const wrapperId = 'produtos-lancamento-' + categoriaLancamentoMap[key];
      const swiperClass = '.swiper-lancamento-' + categoriaLancamentoMap[key];
      const btnPrev = '.swiper-button-prev-lancamento-' + categoriaLancamentoMap[key];
      const btnNext = '.swiper-button-next-lancamento-' + categoriaLancamentoMap[key];
      // Atualiza título
      const tituloElem = document.getElementById(tituloId);
      if (tituloElem) {
        tituloElem.innerHTML = `<span style=\"color: var(--cor-primaria); font-weight:700;\">${capitalize(key)}</span> <span class=\"titulo-cinza\">Lançamentos</span>`;
        tituloElem.style.display = '';
      }
      const sectionElem = document.getElementById(sectionId);
      if (sectionElem) sectionElem.style.display = '';
      montarSwiper({
        categoria: key,
        lancamento: true,
        wrapperId,
        swiperClass,
        btnPrev,
        btnNext,
        sectionId
      });
    });
  } else if (categoriaLancamentoMap[catKey]) {
    // Só monta/exibe o swiper de lançamentos da categoria atual
    const sectionId = 'section-lancamento-' + categoriaLancamentoMap[catKey];
    const tituloId = 'titulo-lancamento-' + categoriaLancamentoMap[catKey];
    const wrapperId = 'produtos-lancamento-' + categoriaLancamentoMap[catKey];
    const swiperClass = '.swiper-lancamento-' + categoriaLancamentoMap[catKey];
    const btnPrev = '.swiper-button-prev-lancamento-' + categoriaLancamentoMap[catKey];
    const btnNext = '.swiper-button-next-lancamento-' + categoriaLancamentoMap[catKey];
    // Atualiza título
    const tituloElem = document.getElementById(tituloId);
    if (tituloElem) {
      tituloElem.innerHTML = `<span style=\"color: var(--cor-primaria); font-weight:700;\">${catNomePlural}</span> <span class=\"titulo-cinza\">Lançamentos</span>`;
      tituloElem.style.display = '';
    }
    const sectionElem = document.getElementById(sectionId);
    if (sectionElem) sectionElem.style.display = '';
    montarSwiper({
      categoria: cat,
      lancamento: true,
      wrapperId,
      swiperClass,
      btnPrev,
      btnNext,
      sectionId
    });
  }

  // 3) Criar dinamicamente swipers para cada grupo encontrado
  const mainContainer = document.querySelector('main');
  const todosSection = document.getElementById('section-todos');
  
  gruposUnicos.forEach((grupo, index) => {
    const grupoId = grupo.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Criar seção de divisor
    const divisorDiv = document.createElement('div');
    divisorDiv.className = 'divisor-de-secao';
    divisorDiv.innerHTML = `<h2 id="titulo-${grupoId}"></h2>`;
    
    // Criar seção do swiper
    const section = document.createElement('section');
    section.className = `secao-${grupoId}`;
    section.id = `section-${grupoId}`;
    section.innerHTML = `
      <div class="swiper-botoes-externo">
        <div class="swiper-button-prev-${grupoId}"></div>
        <div class="swiper-${grupoId}-wrapper">
          <div class="swiper swiper-${grupoId}">
            <div class="swiper-wrapper" id="produtos-${grupoId}"></div>
          </div>
        </div>
        <div class="swiper-button-next-${grupoId}"></div>
      </div>
      <a href="todosprodutos.html?search=${encodeURIComponent(grupo)}&categoria=${encodeURIComponent(cat)}" class="mais-produtos-link">
        <p class="mais-produtos">Ver tudo</p>
      </a>
    `;
    
    // Inserir após a seção "todos"
    todosSection.parentNode.insertBefore(divisorDiv, todosSection.nextSibling);
    divisorDiv.parentNode.insertBefore(section, divisorDiv.nextSibling);
    
    // Configurar título e montar swiper
    document.getElementById(`titulo-${grupoId}`).innerHTML = 
      `<span style="color: var(--cor-primaria); font-weight: 700;">${catNomePlural}</span> <span class="titulo-cinza">${grupo}</span>`;
    
    montarSwiper({
      categoria: cat,
      grupo: grupo,
      wrapperId: `produtos-${grupoId}`,
      swiperClass: `.swiper-${grupoId}`,
      btnPrev: `.swiper-button-prev-${grupoId}`,
      btnNext: `.swiper-button-next-${grupoId}`,
      sectionId: `section-${grupoId}`
    });
  });

  // Esconder seções fixas antigas (leve, pesado, brasado, expandido)
  const secoesPraEsconder = ['section-leve', 'section-pesado', 'section-brasado', 'section-expandido'];
  const divisoresPraEsconder = ['titulo-leve', 'titulo-pesado', 'titulo-brasado', 'titulo-expandido'];
  
  secoesPraEsconder.forEach(sectionId => {
    const section = document.getElementById(sectionId);
    if (section) section.style.display = 'none';
  });
  
  divisoresPraEsconder.forEach(titleId => {
    const title = document.getElementById(titleId);
    if (title && title.parentElement) {
      title.parentElement.style.display = 'none'; // Esconde a div divisor-de-secao
    }
  });
});
