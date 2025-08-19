// VARIAVEIS DE CONTROLE 

let favorites = [];
let cart = [];
let produtos = [];
let currentPage = 1;
const itemsPerPage = 32;
let produtosPaginados = [];

// VARIAVEIS DE CONTROLE

function alert(mensagem) {
  const box = document.getElementById("customAlert");
  const text = document.getElementById("alertText");

  text.textContent = mensagem;

  box.classList.remove("hidden");
  void box.offsetWidth; // força reflow
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
    setTimeout(() => box.classList.add("hidden"), 400);
  }, 2500);
}

document.addEventListener("DOMContentLoaded", function () {
    const montadoras = [
        "Mahindra", "Audi", "BMW", "BYD", "Caterpillar", "Chana", "Cherry", "Chevrolet", "Chrysler", "Citroen",
        "Daewoo", "Ducati", "Daf", "Daihatsu", "Dodge", "Effa", "Fiat", "Ford", "GWM", "Hafei", "Honda",
        "Hyster", "Hyundai", "Infiniti", "Iveco", "Kia", "Komatsu", "Jac", "Jaguar", "Jeep", "Jimbei", 
        "Kion", "Kawasaki", "Land Rover", "Lexus", "Man", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", 
        "Nissan", "Perkins", "Peugeot", "Porsche", "Renault", "Smart", "Scania", "Ssangyong", "Seat", 
        "Subaru", "Suzuki", "Toyota", "Universal", "Volkswagen", "Volvo", "Lifan", "Tesla", "Maserati", "Yamaha"
    ];

    const container = document.getElementById("checkboxContainer");

    if (!container) {
        console.error("Elemento checkboxContainer não encontrado");
        return;
    }

    montadoras.forEach(montadora => {
        const div = document.createElement("div");
        div.innerHTML = `<input type="checkbox" name="montadoras" value="${montadora}"> ${montadora}`;
        container.appendChild(div);
    });

    // Adiciona evento de mudança aos checkboxes
    document.querySelectorAll('#checkboxContainer input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', filterProducts);
    });

    // Adiciona evento de input à barra de pesquisa
    document.getElementById('txtBusca').addEventListener('input', filterProducts);
});

document.addEventListener("DOMContentLoaded", function () {
    const categorias = [
        "Radiador", "Intercooler", "GMV", "Eletroventilador", "Condensador", "Evaporadora", "Radiador de óleo motor", "Radiador de óleo transmissão", "Radiador de aquecimento", "Ventilador interno"
    ];

    const container = document.getElementById("checkboxContainer2");

    if (!container) {
        console.error("Elemento checkboxContainer2 não encontrado");
        return;
    }

    categorias.forEach(categoria => {
        const div = document.createElement("div");
        div.innerHTML = `<input type="checkbox" name="categorias" value="${categoria}"> ${categoria}`;
        container.appendChild(div);
    });

    // Adiciona evento de mudança aos checkboxes
    document.querySelectorAll('#checkboxContainer2 input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', filterProducts);
    });
});

const navTopo = document.getElementById('nav-topo');
const navFixo = document.getElementById('nav-fixo');

function atualizarHeader() {
  if (window.scrollY === 0) {
    navTopo.classList.remove('hidden');
    navFixo.style.top = `${navTopo.offsetHeight}px`;
    document.body.style.paddingTop = `${navTopo.offsetHeight + navFixo.offsetHeight}px`;
  } else {
    navTopo.classList.add('hidden');
    navFixo.style.top = `0px`;
    document.body.style.paddingTop = `${navFixo.offsetHeight}px`;
  }
}

window.addEventListener('scroll', atualizarHeader);
window.addEventListener('load', atualizarHeader);



// HEADER FUNCTIONS

// ...existing code...

function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function checkout() {
    saveCartToLocalStorage();
    alert('Itens enviados ao carrinho!');
    cart = [];
    updateCart();
}

document.getElementById('checkoutButton').addEventListener('click', checkout);

function updateQuantity(itemId, newQuantity) {
  const item = cart.find(item => item.id === itemId);
  if (item) {
    item.quantity = parseInt(newQuantity, 10);
    updateCartDisplay();
  }
}

function updateCartDisplay() {
  // ...existing code to update the cart display...
}

// ...existing code...

// CART FUNCTIONS 


function initializeCarousels() {
    const carousels = document.querySelectorAll('.carousel-container');

    carousels.forEach((carouselContainer) => {
        const carousel = carouselContainer.querySelector('.carousel');
        const cards = carousel.querySelectorAll('.card, .card-two');
        const totalSlides = cards.length;
        let currentIndex = 0;

        function showSlide(index) {
            const cardWidth = cards[0].offsetWidth + parseInt(getComputedStyle(cards[0]).marginRight);
            const visibleCards = Math.floor(carouselContainer.offsetWidth / cardWidth);
            const maxIndex = Math.max(totalSlides - visibleCards, 0);
            currentIndex = Math.min(Math.max(index, 0), maxIndex);
            const newTransform = -currentIndex * cardWidth;
            carousel.style.transform = `translateX(${newTransform}px)`;
        }

        function nextSlide() {
            showSlide(currentIndex + 1);
        }

        function prevSlide() {
            showSlide(currentIndex - 1);
        }

        const nextButton = carouselContainer.querySelector('.next-button');
        const prevButton = carouselContainer.querySelector('.prev-button');

        if (nextButton) nextButton.addEventListener('click', nextSlide);
        if (prevButton) prevButton.addEventListener('click', prevSlide);

        // Inicializa o carrossel na posição correta
        showSlide(currentIndex);

        // Recalcula a largura dos cards e o número de cards visíveis quando a janela for redimensionada
        window.addEventListener('resize', () => showSlide(currentIndex));
    });
}

document.addEventListener("DOMContentLoaded", function () {
    // Recupera os favoritos do localStorage
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
        favorites = JSON.parse(savedFavorites);
        renderFavorites(); // Renderiza os favoritos no menu oculto
        // Abre o menu se houver favoritos
        if (favorites.length > 0) {
            abrirNav();
        }
    }

    // Outras inicializações que você já tem
    initializeCarousels();
    generateLists();
    populateCarousels();
    syncFavoriteIcons();

    document.querySelectorAll('.fa-heart[data-id]').forEach(icon => {
    icon.addEventListener('click', e => {
      const id = icon.getAttribute('data-id');
      icon.classList.toggle('fa-regular');
      icon.classList.toggle('fa-solid');
      icon.style.color = icon.classList.contains('fa-solid') ? 'red' : '';
      // adiciona/remove do array e salva
      if (icon.classList.contains('fa-solid')) {
        addToFavoritesById(id, icon);
      } else {
        removeFromFavorites(id);
      }
    });
  });

});

function clickMenu() {
    const itens = document.getElementById('itens');
    if (itens.style.display == 'block') {
        itens.style.display = 'none';
    } else {
        itens.style.display = 'block';
    }
}

const favoriteIcons = document.querySelectorAll('.fa-heart');
favoriteIcons.forEach((icon, index) => {
    icon.addEventListener('click', () => {
        icon.classList.toggle('fa-regular');
        icon.classList.toggle('fa-solid'); 
        if (icon.classList.contains('fa-solid')) {
            const card = icon.closest('.card, .card-two');
            addToFavorites(card, index);
            abrirNav(); // Abre o menu oculto quando um item é adicionado aos favoritos
            animateCardAddition(card);
        } else {
            removeFromFavorites(index);
            fecharNav(); // Fecha o menu quando o item é removido dos favoritos
        }
    });
});

function updateFavoriteQuantity(itemId, newQuantity) {
    newQuantity = parseInt(newQuantity); // Converte para número inteiro
    if (newQuantity < 1) newQuantity = 1; // Garante que a quantidade mínima seja 1

    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const item = favorites.find(item => item.id === itemId);
    
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('favorites', JSON.stringify(favorites));
        renderFavorites();
    }
}

function sendFavoritesToCart() {
    // 1. Recupera favoritos e carrinho
    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    const cart      = JSON.parse(localStorage.getItem('cart'))      || [];

    // 2. Seleciona os itens marcados
    const selectedItems = document.querySelectorAll('.favorite-checkbox:checked');
    if (!selectedItems.length) {
        alert('Selecione ao menos um favorito para enviar.');
        return;
    }

    selectedItems.forEach(checkbox => {
        const itemId = parseInt(checkbox.dataset.itemId, 10);
        const favItem = favorites.find(item => item.id === itemId);
        if (!favItem) return;

        // 3. Lê a quantidade diretamente do input associado
        const container = checkbox.closest('.cart-item');
        const inputQty  = container.querySelector('input[type="number"]');
        const qty = inputQty
            ? Math.max(1, parseInt(inputQty.value, 10) || 1)
            : (favItem.quantity || 1);

        // 4. Atualiza a quantidade no próprio array de favoritos (zera após enviar)
        favItem.quantity = 1; // Zera ou define como 1 após enviar para o carrinho

        // 5. Adiciona ao carrinho, somando se já existir
        const existing = cart.find(c => c.id === itemId);
        if (existing) {
            existing.quantity += qty;
        } else {
            cart.push({ ...favItem, quantity: qty });
        }
    });

    // 6. Salva ambos no localStorage
    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('cart',      JSON.stringify(cart));

    // 7. Renderiza novamente os favoritos (agora com quantidades zeradas)
    renderFavorites();

    fecharNav();
    setTimeout(() => abrirNavCarrinho(), 300);
}


function removeFromFavorites(itemId) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    favorites = favorites.filter(item => item.id !== itemId);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();

    const heartIcons = document.querySelectorAll('.fa-heart');
    heartIcons.forEach(icon => {
    if (icon.dataset.id === String(itemId)) {
        icon.classList.replace('fa-solid', 'fa-regular');
        icon.style.color = '';  // volta à cor padrão do CSS
    }
    });
}


function renderFavorites() {
    const cartItems = document.getElementById("cart-items");
    if (!cartItems) return;

    const favorites = JSON.parse(localStorage.getItem('favorites')) || [];
    cartItems.innerHTML = '';

    if (favorites.length === 0) {
        cartItems.innerHTML = '<p style="text-align: center; color: var(--cor-terciaria); padding: 20px;">Você não possui favoritos</p>';
        return;
    }

    favorites.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.dataset.itemId = item.id;
        div.innerHTML = `
            <div class="favorite-item-select">
                <input type="checkbox" class="favorite-checkbox" data-item-id="${item.id}">
            </div>
            <div class="favorite-item-content">
                <img src="${item.image}" alt="${item.name}" style="max-width: 100px; max-height: 100px; object-fit: contain; border-radius: 5px;">
                <span>${item.name}</span>
                <div class="quantity-controls">
                    <input type="number" value="${item.quantity || 1}" min="1" onchange="updateFavoriteQuantity(${item.id}, this.value)" style="width: 70px; text-align: center; background:#fff; padding: 2px; border-radius: 7px;">
                </div>
                <button onclick="removeFromFavorites(${item.id})" class="remove-button">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        cartItems.appendChild(div);
    });
}


function addToFavorites(card, index) {
  // Monta o objeto de favorito
  const favoriteItem = {
    id: index,
    name: card.querySelector('.titulo-lancamento-prod').innerText,
    price: 100.00, // Substitua pelo valor real
    image: card.querySelector('img').src,
    description: card.querySelector('.titulo-lancamento-descricao')
      ? card.querySelector('.titulo-lancamento-descricao').innerText
      : 'Sem descrição',
    quantity: 1
  };

  // Atualiza array de favoritos
  const existingItem = favorites.find(item => item.id === favoriteItem.id);
  if (!existingItem) {
    favorites.push(favoriteItem);
  } else {
    existingItem.quantity = 1;
  }

  // Salva no localStorage
  localStorage.setItem('favorites', JSON.stringify(favorites));

  // Marca o coração como “favorito”
  const heartIcon = card.querySelector('.fa-heart');
  if (heartIcon) {
    heartIcon.dataset.id = favoriteItem.id;                // associa o id
    heartIcon.classList.replace('fa-regular', 'fa-solid'); // troca para sólido
    heartIcon.style.color = 'red';                         // aplica cor
  }

  // Atualiza interface do menu de favoritos
  renderFavorites();
}

function animateCardAddition(card) {
    const clone = card.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.zIndex = '1000';
    document.body.appendChild(clone);

    const rect = card.getBoundingClientRect();
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;

    const cartIcon = document.querySelector('.fa-cart-shopping');
    const cartRect = cartIcon.getBoundingClientRect();

    clone.style.transition = 'all 0.5s ease-in-out';
    clone.style.transform = `translate(${cartRect.left - rect.left}px, ${cartRect.top - rect.top}px) scale(0.1)`;
    clone.style.opacity = '0';

    setTimeout(() => {
        document.body.removeChild(clone);
    }, 500);
}

//MENU LATERAL FAVORITOS E CARRINHO
function abrirNav() {
    const menuOculto = document.getElementById("menuoculto");
    if (menuOculto) {
        // Se for tela de celular (<=768px), usa 100%, caso contrário, 40%
        menuOculto.style.width = (window.innerWidth <= 768) ? '100%' : '40%';
        document.body.style.overflowX = 'hidden';
    }
}

function fecharNav() {
    const menuOculto = document.getElementById("menuoculto");
    if (menuOculto) {
        menuOculto.style.width = '0';
        document.body.style.overflowX = 'auto';
    }
}

// Fecha o menu ao clicar fora dele
document.addEventListener('click', function(event) {
    const menuOculto = document.getElementById("menuoculto");
    const btnFechar = document.querySelector('.btnFechar');
    const heartIcon = document.querySelector('.fa-heart');
    
    if (menuOculto && menuOculto.style.width === '100%') {
        if (!menuOculto.contains(event.target) && 
            !heartIcon.contains(event.target) && 
            !btnFechar.contains(event.target)) {
            fecharNav();
        }
    }
});

// Fecha o menu ao pressionar ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        fecharNav();
    }
});

//MENU LATERAL FAVORITOS E CARRINHO

// MENU SUPERIOR FILTRO ABRE A FECHA

function abrirNav2() {
    const menuOculto2 = document.getElementById("menuoculto2");
    if (menuOculto2) {
        menuOculto2.style.top = "0"; 
        menuOculto2.classList.add("open"); // Adiciona a classe 'open' ao abrir o menu
    }
}

function apenasFecharNav2() {
    const menuOculto2 = document.getElementById('menuoculto2');
    if (menuOculto2) {
        console.log('Classes antes de remover:', menuOculto2.classList);
        menuOculto2.classList.remove('open');
        menuOculto2.style.top = '-100%'; // Move o menu para fora da tela com transição
        console.log('Classes após remover:', menuOculto2.classList);
    } else {
        console.log('Elemento menuoculto2 não encontrado');
    }
}

function fecharNav2() {
      // 1) Montadoras selecionadas
      const selectedMontadoras = Array.from(
        document.querySelectorAll('#checkboxContainer input[type="checkbox"]:checked')
      ).map(chk => chk.value);

      // 2) Categorias selecionadas
      const selectedCategorias = Array.from(
        document.querySelectorAll('#checkboxContainer2 input[type="checkbox"]:checked')
      ).map(chk => chk.value);

      // 3) Termo de busca livre
      const termoGeral = document.getElementById('searchInputIndex').value.trim();

      // 4) Monta parâmetros de URL
      const params = new URLSearchParams();
      selectedMontadoras.forEach(m => params.append('montadora', m));
      selectedCategorias.forEach(c => params.append('categoria', c));
      if (termoGeral) {
        params.set('search', termoGeral);
      }

      // 5) Fecha o menu
      document.getElementById('menuoculto2').classList.remove('open');

      // 6) Redireciona para todosprodutos.html com a querystring
      const query = params.toString();
      window.location.href = 'todosprodutos.html' + (query ? `?${query}` : '');
    }

// MENU SUPERIOR FILTRO ABRE A FECHA

// SUB MENU PARTE SUPERIOR CATEGORIAS 

function toggleMenuCategorias(event) {
    event.preventDefault(); // Evita a navegação do link

    let target = event.target;

    // Se o clique foi no <i>, pega o elemento pai (<a>)
    if (target.tagName === "I") {
        target = target.parentElement;
    }

    let submenu = target.nextElementSibling; // Pega o submenu associado

    if (submenu) {
        // Alterna a visibilidade do submenu
        submenu.style.display = submenu.style.display === "block" ? "none" : "block";
    }
}

function toggleMenu() {
    const menuOculto = document.getElementById("menuoculto");
    if (menuOculto) {
        if (menuOculto.style.width === '40%') {
            fecharNav();
        } else {
            abrirNav();
            // Renderiza os favoritos ao abrir o menu
            const savedFavorites = localStorage.getItem('favorites');
            if (savedFavorites) {
                favorites = JSON.parse(savedFavorites);
                renderFavorites();
            }
        }
    }
}

// Evento para fechar o menu ao clicar fora dele
document.addEventListener("click", function (event) {
    let dropdown = document.querySelector(".dropdown");
    let submenu = document.querySelector(".submenu");

    // Se o clique não for dentro do dropdown, fecha o submenu
    if (!dropdown.contains(event.target)) {
        submenu.style.display = "none";
    }
});

// SUB MENU PARTE SUPERIOR CATEGORIAS 

// BUSCA MEIO DA PÁGINA 

function toggleSearchBar() {
    let searchBar = document.getElementById("searchBar");
    if (searchBar.style.display === "none" || searchBar.style.display === "") {
        searchBar.style.display = "block"; // Mostra a barra de pesquisa
    } else {
        searchBar.style.display = "none"; // Esconde a barra de pesquisa
    }
}

// FILTRO DENTRO DA BARRA DE BUSCA 

function filtroSearchbaricon() {
    let filtroSearchbar = document.getElementById("filtroSearchbaricon");

    if (!filtroSearchbar.classList.contains("active")) {
        filtroSearchbar.style.display = "block"; // Exibe o elemento antes da animação
        setTimeout(() => {
            filtroSearchbar.classList.add("active"); // Aplica a animação de entrada
        }, 200); // Pequeno delay para garantir que o CSS reconheça a mudança
    } else {
        filtroSearchbar.classList.remove("active"); // Inicia a animação de saída
        setTimeout(() => {
            filtroSearchbar.style.display = "none"; // Esconde após a transição
        }, 500); // Tempo correspondente à animação
    }
}

// SLIDE SWIPER 

var swiper = new Swiper(".mySwiper", {
  slidesPerView: 1,
  spaceBetween: 10,
    passiveListeners: true, // Melhora a performance do scroll
    resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
    allowTouchMove: true,   // Permite o toque
    watchOverflow: true,    // Impede erros se não houver slides suficientes
  navigation: {
    nextEl: ".swiper-button-next",
    prevEl: ".swiper-button-prev",
  },
  pagination: {
    el: ".swiper-pagination",
  },
  mousewheel: true,
  keyboard: true,
});

// ICON ROTATE

document.querySelector('.search-icon').addEventListener('click', function() {
    this.classList.toggle('rotate');
});

function addToCart(produtoId, nome, imagem) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === produtoId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ 
            id: produtoId, 
            name: nome, 
            image: imagem, 
            quantity: 1 
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    abrirNavCarrinho(); // Abre o menu do carrinho ao adicionar um item
}

function generateLists() {
    const montadoras = ["Mahindra", "Audi", "BMW", "BYD", "Caterpillar", "Chana", "Cherry", "Chevrolet", "Chrysler", "Citroen", "Daewoo", "Ducati", "Daf", "Daihatsu", "Dodge", "Effa", "Fiat", "Ford", "GWM", "Hafei", "Honda", "Hyster", "Hyundai", "Infiniti", "Iveco", "Kia", "Komatsu", "Jac", "Jaguar", "Jeep", "Jimbei", "Kia", "Kion", "Kawasaki", "Land Rover", "Lexus", "Man", "Mazda", "Mercedes-Benz", "Mini", "Mitsubishi", "Nissan", "Perkins", "Peugeot", "Porsche", "Renault", "Smart", "Scania", "Ssangyong", "Seat", "Subaru", "Suzuki", "Toyota", "Universal", "Volkswagen", "Volvo", "Lifan", "Tesla", "Maserati", "Yamaha"];
    
    const categorias = ["Radiador", "Intercooler", "GMV", "Eletroventilador", "Condensador", "Evaporadora", "Radiador de óleo motor", "Radiador de óleo transmissão", "Radiador de aquecimento", "Ventiladores internos"];

    const montadorasList = document.getElementById('montadoras-list');
    const categoriasList = document.getElementById('categorias-list');

    montadoras.forEach(montadora => {
        const div = document.createElement('div');
        div.innerHTML = `<input type="checkbox" name="montadoras"> ${montadora}`;
        montadorasList.appendChild(div);
    });

    categorias.forEach(categoria => {
        const div = document.createElement('div');
        div.innerHTML = `<input type="checkbox" name="Categorias"> ${categoria}`;
        categoriasList.appendChild(div);
    });
}

const carouselsData = {
    "linha-completa-carousel": [
        { title: "Radiador", img: "./image/radiador.png" },
        { title: "Intercooler", img: "./image/intercooler.png" },
        { title: "GMV", img: "./image/gmv.png" },
        { title: "Eletroventilador", img: "./image/eletroventilador-03.png" },
        { title: "Condensador", img: "./image/condesador.png" },
        { title: "Evaporadora", img: "./image/evaporador.png" },
        { title: "Radiador de óleo motor", img: "./image/radiadoroleo.png" },
        { title: "Radiador de aquecimento", img: "./image/radiadorquente.png" },
        { title: "Ventilador interno", img: "./image/ventiladorinterno.png" }
    ]
};

function populateCarousels() {
  Object.keys(carouselsData).forEach(carouselId => {
    const carousel = document.getElementById(carouselId);
    carouselsData[carouselId].forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'card-two';
      card.innerHTML = `
        <p class="titulo-lancamento-prod">${item.title}</p>
        <img src="${item.img}" alt="${item.title}">
        <p class="titulo-lancamento-descricao">${item.desc || ''}</p>
        <i class="fa-regular fa-heart" data-id="${item.id || index}"></i>
        <i class="fa-solid fa-cart-shopping"></i>
      `;
      carousel.appendChild(card);
    });
  });
}

// 2) Função que sincroniza ícones com o localStorage
function syncFavoriteIcons() {
  const favs = JSON.parse(localStorage.getItem('favorites')) || [];
  document.querySelectorAll('.fa-heart[data-id]').forEach(icon => {
    const id = icon.getAttribute('data-id');
    if (favs.some(item => String(item.id) === id)) {
      icon.classList.replace('fa-regular', 'fa-solid');
      icon.style.color = 'red';
    } else {
      icon.classList.replace('fa-solid', 'fa-regular');
      icon.style.color = '';
    }
  });
}

function clearFavorites() {
    const favoritesContainer = document.getElementById('cart-items');
    favoritesContainer.innerHTML = '';
}

document.addEventListener('DOMContentLoaded', populateCarousels);

function carregarProdutos() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(data => {
            produtos = data; // Armazena os produtos carregados
            renderProducts(produtos); // Renderiza todos os produtos
        })
        .catch(error => console.error("Erro ao carregar produtos:", error));
}

// Função para aplicar os filtros
function aplicarFiltros() {
    const montadoraSelecionada = document.getElementById("filtro-montadora").value;
    const categoriaSelecionada = document.getElementById("filtro-categoria").value;

    console.log("Montadora selecionada:", montadoraSelecionada);
    console.log("Categoria selecionada:", categoriaSelecionada);

    const produtosFiltrados = produtos.filter(produto => {
        const filtroMontadora = montadoraSelecionada === "" || produto.montadora === montadoraSelecionada;
        const filtroCategoria = categoriaSelecionada === "" || produto.categoria === categoriaSelecionada;
        return filtroMontadora && filtroCategoria;
    });

    console.log("Produtos filtrados:", produtosFiltrados);
    renderProducts(produtosFiltrados); // Use renderProducts para ambos os casos
}

// Chama a função ao carregar a página
document.getElementById("botao-filtrar").addEventListener("click", aplicarFiltros);

function toggleFavorite(produtoId, nome, imagem) {
    let favorites = JSON.parse(localStorage.getItem('favorites')) || [];

    const existingItem = favorites.find(item => item.id === produtoId);
    if (existingItem) {
        favorites = favorites.filter(item => item.id !== produtoId);
    } else {
        favorites.push({ id: produtoId, name: nome, image: imagem });
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
    abrirNav(); // Abre o menu oculto quando um item é adicionado aos favoritos
}

function renderCart() {
    const cartContainer = document.getElementById('cart-items-cart');
    if (!cartContainer) return; // Evita erro caso esteja em outra página

    cartContainer.innerHTML = '';
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let total = 0;

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width: 100px; height: auto; margin-right: 15px;">
            <span>${item.name} - ${item.quantity}x</span>
            <button onclick="removeFromCart(${item.id})">Remover</button>
        `;
        cartContainer.appendChild(div);
        total += item.quantity * 100; // Atualize com o preço real do produto
    });

    document.getElementById('total-value').innerText = total.toFixed(2);
}

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
  const temAnoEmDiante = anos.some(anoString => anoString && typeof anoString === 'string' && anoString.includes('>'));
  
  // Extrai todos os anos numéricos de todas as strings de ano
  let todosAnos = [];
  anos.forEach(anoString => {
    if (anoString && typeof anoString === 'string') {
      const anosExtraidos = extrairAnos(anoString);
      todosAnos = todosAnos.concat(anosExtraidos);
    }
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

// 1) renderProducts unificado: recebe só o array e sabe onde injetar
function renderProducts(produtos) {
  const container = document.getElementById('produtos-container'); 
  // certifique-se de que é este o ID do elemento no seu HTML
  if (!container) {
    console.error('Container de produtos não encontrado!');
    return;
  }
  container.innerHTML = '';
  
  // Agrupa produtos por código para mostrar múltiplos modelos
  const produtosAgrupados = groupProductsByCode(produtos);

  produtosAgrupados.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'card-two';

    const cardContent = document.createElement('div');
    cardContent.className = 'card-content';

    const pCodigo = document.createElement('p');
    pCodigo.textContent = prod.codigo;
    pCodigo.classList.add('titulo-lancamento-prod');

    const img = document.createElement('img');
    img.src = prod.imagem;
    img.alt = prod.descricao;

    const pDescricao = document.createElement('p');
    pDescricao.innerHTML = formatarDescricaoMultiplosModelos(prod);
    pDescricao.classList.add('titulo-lancamento-descricao');

    cardContent.append(pCodigo, img, pDescricao);
    card.appendChild(cardContent);

    // você pode reaproveitar aqui o resto dos ícones e evento de clique...
    container.appendChild(card);
  });
}

function renderProductsPage(produtosArray) {
    const container = document.getElementById('produtos-container');
    if (!container) return;
    container.innerHTML = '';
    
    // Agrupa produtos por código para mostrar múltiplos modelos
    const produtosAgrupados = groupProductsByCode(produtosArray);
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageItems = produtosAgrupados.slice(start, end);
    
    for (let i = 0; i < pageItems.length; i++) {
        const prod = pageItems[i];
        const card = document.createElement('div');
        card.className = 'card-two';
        // Conteúdo do card igual ao index.html, incluindo ícones
        const cardContent = document.createElement('div');
        cardContent.className = 'card-content';
        const pCodigo = document.createElement('p');
        pCodigo.textContent = prod.codigo;
        pCodigo.classList.add('titulo-lancamento-prod');
        const img = document.createElement('img');
        img.src = prod.imagem || './image/logo.png'; // Imagem padrão se não houver
        img.alt = prod.descricao;
        const pDescricao = document.createElement('p');
        pDescricao.innerHTML = formatarDescricaoMultiplosModelos(prod);
        pDescricao.classList.add('titulo-lancamento-descricao');
        cardContent.append(pCodigo, img, pDescricao);
        card.appendChild(cardContent);
        // Adiciona os ícones de favorito e carrinho
        const iconsContainer = document.createElement('div');
        iconsContainer.className = 'icons-container';
        // Ícone de favorito
        const heartIcon = document.createElement('i');
        heartIcon.className = 'fa-regular fa-heart';
        heartIcon.setAttribute('data-id', prod.id || prod.codigo);
        heartIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleFavorite(prod.id || prod.codigo, prod.codigo, prod.imagem);
            heartIcon.classList.toggle('fa-solid');
            heartIcon.classList.toggle('fa-regular');
            if (heartIcon.classList.contains('fa-solid')) {
                heartIcon.style.color = 'red';
                abrirNav();
            } else {
                heartIcon.style.color = '#134596';
            }
        });
        // Ícone de carrinho
        const cartIcon = document.createElement('i');
        cartIcon.className = 'fa-solid fa-cart-shopping';
        cartIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(prod.id || prod.codigo, prod.codigo, prod.imagem);
        });
        iconsContainer.appendChild(heartIcon);
        iconsContainer.appendChild(cartIcon);
        card.appendChild(iconsContainer);
        // Adiciona redirecionamento para ficha do produto ao clicar no card (exceto nos ícones)
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('fa-heart') && !e.target.classList.contains('fa-cart-shopping')) {
                window.location.href = `ficha-produto.html?id=${prod.id}`;
            }
        });
        container.appendChild(card);
    }
    setupPagination(produtosAgrupados);
}

function setupPagination(produtosArray) {
    const pagination = document.getElementById('pagination');
    if (!pagination) return;
    pagination.innerHTML = '';
    const pageCount = Math.ceil(produtosArray.length / itemsPerPage);
    if (pageCount <= 1) return;

    // --- GRUPO DE NAVEGAÇÃO À ESQUERDA --- //
    const navGroup = document.createElement('div');
    navGroup.style.display = 'inline-flex';
    navGroup.style.gap = '0px';
    navGroup.style.marginRight = '18px';
    navGroup.className = 'pagination-nav-group';

    // |< Botão voltar 10 páginas
    const jumpBackBtn = document.createElement('button');
    jumpBackBtn.textContent = '|<';
    jumpBackBtn.style.color = '#009440';
    jumpBackBtn.style.fontSize = '1.3em';
    jumpBackBtn.style.fontWeight = 'bold';
    jumpBackBtn.disabled = currentPage === 1;
    jumpBackBtn.addEventListener('click', () => {
        currentPage = (currentPage <= 10) ? 1 : currentPage - 10;
        renderProductsPage(produtosArray);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    navGroup.appendChild(jumpBackBtn);

    // < Botão voltar uma página
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '<';
    prevBtn.style.color = '#ffcb00';
    prevBtn.style.fontSize = '1.3em';
    prevBtn.style.fontWeight = 'bold';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderProductsPage(produtosArray);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    navGroup.appendChild(prevBtn);

    // Página atual (apenas texto, destacado)
    const currentPageSpan = document.createElement('span');
    currentPageSpan.textContent = currentPage;
    currentPageSpan.className = 'active';
    currentPageSpan.style.background = '#fff';
    currentPageSpan.style.color = '#134592';
    currentPageSpan.style.fontSize = '1.3em';
    currentPageSpan.style.fontWeight = 'bold';
    currentPageSpan.style.borderRadius = '5px';
    currentPageSpan.style.padding = '7px 8px';
    navGroup.appendChild(currentPageSpan);

    // > Botão avançar uma página
    const nextBtn = document.createElement('button');
    nextBtn.textContent = '>';
    nextBtn.style.color = '#ffcb00';
    nextBtn.style.fontSize = '1.3em';
    nextBtn.style.fontWeight = 'bold';
    nextBtn.disabled = currentPage === pageCount;
    nextBtn.addEventListener('click', () => {
        if (currentPage < pageCount) {
            currentPage++;
            renderProductsPage(produtosArray);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    navGroup.appendChild(nextBtn);

    // >| Botão avançar 10 páginas
    const jumpFwdBtn = document.createElement('button');
    jumpFwdBtn.textContent = '>|';
    jumpFwdBtn.style.color = '#009440';
    jumpFwdBtn.style.fontSize = '1.3em';
    jumpFwdBtn.style.fontWeight = 'bold';
    jumpFwdBtn.disabled = currentPage === pageCount;
    jumpFwdBtn.addEventListener('click', () => {
        currentPage = (currentPage + 10 >= pageCount) ? pageCount : currentPage + 10;
        renderProductsPage(produtosArray);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    navGroup.appendChild(jumpFwdBtn);

    pagination.appendChild(navGroup);

    // --- GRUPO DE JANELA DE PÁGINAS À DIREITA --- //
    const windowGroup = document.createElement('div');
    windowGroup.style.display = 'inline-flex';
    windowGroup.style.gap = '0px';
    windowGroup.className = 'pagination-window-group';

    const maxVisible = 7;
    let start, end;
    if (pageCount <= maxVisible + 2) {
        start = 1;
        end = pageCount;
    } else {
        if (currentPage <= Math.ceil(maxVisible / 2)) {
            start = 1;
            end = maxVisible;
        } else if (currentPage > pageCount - Math.floor(maxVisible / 2)) {
            end = pageCount;
            start = pageCount - maxVisible + 1;
        } else {
            start = currentPage - Math.floor(maxVisible / 2);
            end = start + maxVisible - 1;
        }
        if (start < 1) {
            start = 1;
            end = maxVisible;
        }
        if (end > pageCount) {
            end = pageCount;
            start = end - maxVisible + 1;
        }
    }

    // Botão primeira página
    if (start > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.textContent = '1';
        firstBtn.className = (currentPage === 1) ? 'active' : '';
        firstBtn.addEventListener('click', () => {
            currentPage = 1;
            renderProductsPage(produtosArray);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        windowGroup.appendChild(firstBtn);
        if (start > 2) {
            const dotsStart = document.createElement('span');
            dotsStart.textContent = '...';
            dotsStart.style.margin = '7px 6px';
            windowGroup.appendChild(dotsStart);
        }
    }

    for (let i = start; i <= end; i++) {
        const btn = document.createElement('button');
        btn.textContent = i;
        btn.className = (i === currentPage) ? 'active' : '';
        btn.addEventListener('click', () => {
            currentPage = i;
            renderProductsPage(produtosArray);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        windowGroup.appendChild(btn);
    }

    // Reticências e último botão
    if (end < pageCount) {
        if (end < pageCount - 1) {
            const dots = document.createElement('span');
            dots.textContent = '...';
            dots.style.margin = '7px 6px';
            windowGroup.appendChild(dots);
        }
        const lastBtn = document.createElement('button');
        lastBtn.textContent = pageCount;
        lastBtn.className = (pageCount === currentPage) ? 'active' : '';
        lastBtn.addEventListener('click', () => {
            currentPage = pageCount;
            renderProductsPage(produtosArray);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        windowGroup.appendChild(lastBtn);
    }

    pagination.appendChild(windowGroup);
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

// 2) filterProducts só chama renderProducts(array)
function filterProducts() {
  const params    = new URLSearchParams(window.location.search);
  const termo     = (params.get('search') || '').trim();
  const campo     = params.get('campo') || '';

  // Se o campo é 'placa', fazer consulta de placa
  if (campo === 'placa' && termo) {
    console.log('🚗 Detectada busca por placa:', termo);
    // Verificar se a função de consulta de placa está disponível
    if (typeof consultarPlacaEFiltrarProdutos === 'function') {
      console.log('✅ Função consultarPlacaEFiltrarProdutos encontrada, executando...');
      consultarPlacaEFiltrarProdutos(termo);
      return;
    } else {
      console.log('❌ Função consultarPlacaEFiltrarProdutos não encontrada');
      // Se estamos no index.html, redirecionar para todosprodutos.html
      if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
        console.log('🔄 Redirecionando para todosprodutos.html com parâmetros de placa');
        const url = `todosprodutos.html?search=${encodeURIComponent(termo)}&campo=placa`;
        window.location.href = url;
        return;
      }
    }
  }

  // Divide o termo de busca em palavras-chave individuais
  const searchTerms = termo ? termo.split(/\s+/).filter(t => t.length > 0) : [];

  const urlMont   = params.getAll('montadora').map(v => v.toLowerCase());
  const urlCat    = params.getAll('categoria').map(v => v.toLowerCase());

  const selMont   = Array.from(
    document.querySelectorAll('#checkboxContainer input:checked')
  ).map(i => i.value.toLowerCase());
  const selCat    = Array.from(
    document.querySelectorAll('#checkboxContainer2 input:checked')
  ).map(i => i.value.toLowerCase());

  const finalMont = Array.from(new Set([...urlMont, ...selMont]));
  const finalCat  = Array.from(new Set([...urlCat,  ...selCat ]));

  fetch('./conversor/produtos.json')
    .then(r => r.json())
    .then(all => {
      const filtrados = all.filter(prod => {
        // Nova busca inteligente em todos os campos
        const matchSearch = searchInAllFields(prod, searchTerms);

        const matchM = finalMont.length === 0 ||
          (prod.montadora &&
           finalMont.includes(prod.montadora.toLowerCase()));

        const matchC = finalCat.length === 0 ||
          (prod.categoria &&
           finalCat.includes(prod.categoria.toLowerCase()));

        return matchSearch && matchM && matchC;
      });

      // 👇 AQUI: mostra/oculta a mensagem de "nenhum produto encontrado"
      const noResultsMessage = document.getElementById('noResultsMessage');
      if (noResultsMessage) {
        noResultsMessage.style.display = filtrados.length === 0 ? 'block' : 'none';
      }

      produtosPaginados = filtrados;
      currentPage = 1;
      renderProductsPage(produtosPaginados);
    })
    .catch(console.error);
}

// 3) Ao carregar a página: pré-popula e dispara o filtro _uma vez_
document.addEventListener('DOMContentLoaded', () => {
  const params      = new URLSearchParams(window.location.search);
  const term        = params.get('search') || '';
  const txtBusca    = document.getElementById('txtBusca');
  if (txtBusca && term) txtBusca.value = term;

  // dispara _já_, exibindo apenas o card buscado
  filterProducts();

  // reaplica em cada mudança
  if (txtBusca) {
    txtBusca.addEventListener('input', filterProducts);
  }
  document.querySelectorAll(
    '#checkboxContainer input, #checkboxContainer2 input'
  ).forEach(chk => chk.addEventListener('change', filterProducts));
});


// Eventos para disparar o filtro
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('txtBusca').addEventListener('input', filterProducts);

    document.querySelectorAll('#checkboxContainer input, #checkboxContainer2 input')
        .forEach(checkbox => {
            checkbox.addEventListener('change', filterProducts);
        });
});

document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("formCadastro");

    // Quando o formulário for enviado
    form.addEventListener("submit", function (event) {
        // Impede o envio do formulário, para poder verificar antes
        event.preventDefault();

        // Obtém os valores dos campos
        const nome = document.getElementById("nome").value;
        const email = document.getElementById("email").value;
        const senha = document.getElementById("senha").value;

        // Verifica se algum campo está vazio
        if (nome === "" || email === "" || senha === "") {
            alert("Por favor, preencha todos os campos.");
        } else {
            // Se tudo estiver preenchido, você pode prosseguir com o envio ou outras ações
            form.submit(); // Envia o formulário
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    // Outras inicializações já existentes...
    
    carregarProdutos(); // Carrega os produtos logo após o DOM estar pronto
});

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM carregado"); // Debug
    
    // Seleciona todos os card-one
    const cards = document.querySelectorAll('.card-one');
    console.log("Cards encontrados:", cards.length); // Debug
    
    cards.forEach(card => {
        card.style.cursor = 'pointer'; // Adiciona cursor pointer
        
        card.addEventListener('click', function(e) {
            // Previne o redirecionamento apenas se clicar nos ícones
            if (e.target.tagName === 'I') {
                e.stopPropagation();
                return;
            }
            
            const titulo = this.querySelector('.titulo-linha');
            console.log("Título encontrado:", titulo?.textContent); // Debug
            
            if (titulo) {
                localStorage.setItem('filtroCategoria', titulo.textContent);
                console.log("Redirecionando para todosprodutos.html"); // Debug
                window.location.href = 'todosprodutos.html';
            }
        });
    });
});

function redirecionarParaProdutos(event, card) {
    // Se o clique foi em um ícone, não redireciona
    if (event.target.tagName === 'I') {
        return;
    }

    const titulo = card.querySelector('.titulo-linha');
    if (titulo) {
        const categoria = titulo.textContent.trim();

        // Codifica a categoria para uso seguro na URL
        const categoriaParam = encodeURIComponent(categoria.toLowerCase());

        // Redireciona para a URL com parâmetro
        window.location.href = `categoria.html?cat=${categoriaParam}`;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const cards = document.querySelectorAll('.card-one');
    cards.forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(event) {
            redirecionarParaProdutos(event, this);
        });
    });
});


function initializeSwiper(containerClass, slidesLength) {
    return new Swiper(containerClass, {
        slidesPerView: 1,
        passiveListeners: true, // Melhora a performance do scroll
        resistanceRatio: 0.85,  // Dificulta um pouco o arraste, evitando ativação acidental
        allowTouchMove: true,   // Permite o toque
        watchOverflow: true,    // Impede erros se não houver slides suficientes
        spaceBetween: 20,
        loop: false,
        navigation: {
            nextEl: `${containerClass} .swiper-button-next`,
            prevEl: `${containerClass} .swiper-button-prev`,
        },
        breakpoints: {
            320: {
                slidesPerView: 1,
            },
            768: {
                slidesPerView: Math.min(3, slidesLength),
            },
            1024: {
                slidesPerView: Math.min(3, slidesLength),
            }
        },
        watchOverflow: true,
        observer: true,
        observeParents: true,
        allowTouchMove: true,
        slidesPerGroup: 1
    });
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

            const codigosUnicos = new Set();
            const condensadores = produtos
                .filter(produto => {
                    if (produto.categoria && 
                        produto.categoria.toLowerCase() === 'condensador' && 
                        produto.codigo && 
                        !codigosUnicos.has(produto.codigo)) {
                        codigosUnicos.add(produto.codigo);
                        return true;
                    }
                    return false;
                })
                .slice(0, 20);

            if (condensadores.length === 0) {
                container.innerHTML = '<p>Nenhum condensador disponível no momento.</p>';
                return;
            }

            container.innerHTML = '';

            condensadores.forEach(produto => {
                const slideDiv = document.createElement('div');
                slideDiv.className = 'swiper-slide';
                
                const card = document.createElement('div');
                card.className = 'card-two';
                
                const cardContent = document.createElement('div');
                cardContent.className = 'card-content';
                
                const pCodigo = document.createElement('p');
                pCodigo.textContent = produto.codigo;
                pCodigo.classList.add('titulo-lancamento-prod');

                const img = document.createElement('img');
                img.src = produto.imagem;
                img.alt = produto.nome || 'Produto';

                const pDescricao = document.createElement('p');
                pDescricao.textContent = produto.descricao;
                pDescricao.classList.add('titulo-lancamento-descricao');

                cardContent.appendChild(pCodigo);
                cardContent.appendChild(img);
                cardContent.appendChild(pDescricao);

                const iconsContainer = document.createElement('div');
                iconsContainer.className = 'icons-container';
                
                const heartIcon = document.createElement('i');
                heartIcon.className = 'fa-regular fa-heart';
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

                iconsContainer.appendChild(heartIcon);
                iconsContainer.appendChild(cartIcon);

                card.appendChild(cardContent);
                card.appendChild(iconsContainer);
                slideDiv.appendChild(card);
                container.appendChild(slideDiv);
            });

            // Inicializa o Swiper após adicionar todos os slides
            const swiper = initializeSwiper('.swiper-condensadores', condensadores.length);
        })
        .catch(error => console.error('Erro ao carregar condensadores:', error));
}

// Repita o mesmo padrão para carregarGMV e carregarIntercoolers
// ... existing code ...

function abrirNavCarrinho() {
    const menuOculto = document.getElementById("menuoculto-carrinho");
    if (menuOculto) {
        // Se for tela de celular (<=768px), usa 100%, caso contrário, 40%
        menuOculto.style.width = (window.innerWidth <= 768) ? '100%' : '40%';
        document.body.style.overflowX = 'hidden';
        renderCarrinho(); // Renderiza os itens do carrinho ao abrir o menu
    }
}

function fecharNavCarrinho() {
    const menuOculto = document.getElementById("menuoculto-carrinho");
    if (menuOculto) {
        menuOculto.style.width = '0';
        document.body.style.overflowX = 'auto';
    }
}

function toggleMenuCarrinho() {
    const menuOculto = document.getElementById("menuoculto-carrinho");
    if (menuOculto) {
        if (menuOculto.style.width === '40%') {
            fecharNavCarrinho();
        } else {
            abrirNavCarrinho();
        }
    }
}

function renderCarrinho() {
    const cartContainer = document.getElementById('cart-items-carrinho');
    if (!cartContainer) return;

    cartContainer.innerHTML = '';
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p style="text-align: center; color: var(--cor-terciaria);">Seu carrinho está vazio</p>';
        return;
    }

    cart.forEach(item => {
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="favorite-item-content">
                <img src="${item.image}" alt="${item.name}" style="max-width: 100px; min-width: 100px; max-height: 100px; min-height: 100px; object-fit: contain; border-radius: 5px;">
                <span>${item.name}</span>
                <div class="quantity-controls">
                    <input type="number" value="${item.quantity || 1}" min="1" onchange="updateCartQuantity(${item.id}, this.value)" style="width: 70px; text-align: center; background:#fff; padding: 2px; border-radius: 7px;">
                </div>
                <button onclick="removeFromCart(${item.id})" class="remove-button">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        cartContainer.appendChild(div);
    });
}

function updateCartQuantity(itemId, newQuantity) {
    if (newQuantity < 1) return;
    
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === itemId);
    
    if (item) {
        item.quantity = newQuantity;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCarrinho();
    }
}

function removeFromCart(itemId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== itemId);
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCarrinho();
}

function limparCarrinho() {
    localStorage.setItem('cart', JSON.stringify([]));
    renderCarrinho();
}

function checkoutCarrinho() {
    alert('Compra finalizada com sucesso!');
    limparCarrinho();
    fecharNavCarrinho();
}

function toggleAllFavorites() {
    const checkboxes = document.querySelectorAll('.favorite-checkbox');
    const toggleButton = document.getElementById('toggleAllButton');
    const isAllChecked = Array.from(checkboxes).every(checkbox => checkbox.checked);
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = !isAllChecked;
    });
    
    // Atualiza o texto e ícone do botão
    toggleButton.innerHTML = isAllChecked ? 
        '<i class="fa-solid fa-check-double"></i> Marcar Todos' : 
        '<i class="fa-solid fa-square"></i> Desmarcar Todos';
}

function renderCartPage() {
  const container = document.getElementById('cart-page-items');
  if (!container) return;
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  container.innerHTML = '';

  if (cart.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px;">Seu carrinho está vazio</p>';
    return;
  }

  let totalQty = 0;
  cart.forEach(item => {
    totalQty += item.quantity;
    const div = document.createElement('div');
    div.className = 'cart-item-page';
    div.innerHTML = `
      <img 
        src="${item.image}" 
        alt="${item.name}" 
        class="me-3 rounded" 
        style="width:80px; height:80px; object-fit:cover;"
      >
      <div class="flex-grow-1">
        <h5 class="mb-1">${item.name}</h5>
        <small class="text-muted">${item.description||''}</small>
      </div>
      <div class="mx-3">
        <input 
          type="number" 
          class="form-control quantity-input" 
          value="${item.quantity}" 
          min="1" 
          data-id="${item.id}"
        >
      </div>
      <div class="fw-bold me-3">
        ${item.price ? `$${item.price.toFixed(2)}` : ''}
      </div>
      <button
        class="btn btn-link text-danger p-1 remove-btn" 
        data-id="${item.id}"
      >
        <i class="fa fa-trash"></i>
      </button>
    `;
    container.appendChild(div);
  });

  // atualiza resumo
  const qtyEl = document.getElementById('summary-qty');
  if (qtyEl) qtyEl.innerText = totalQty;
  const qtySmallEl = document.getElementById('summary-qty-small');
  if (qtySmallEl) qtySmallEl.innerText = totalQty;

  // registra os listeners nos inputs e botões de remoção
  container.querySelectorAll('.quantity-input').forEach(input =>
    input.addEventListener('change', e => {
      const id = e.target.dataset.id;
      const newQty = parseInt(e.target.value, 10);
      updateQuantity(id, newQty);
    })
  );
  container.querySelectorAll('.remove-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      const id = e.currentTarget.dataset.id;
      removeFromCart(id);
    })
  );
}

        function updateFavoriteQuantity(itemId, newQuantity) {
            newQuantity = parseInt(newQuantity); // Converte para número inteiro
            if (newQuantity < 1) newQuantity = 1; // Garante que a quantidade mínima seja 1

            const item = favorites.find(item => item.id === itemId);
            if (item) {
                item.quantity = newQuantity;
                localStorage.setItem('favorites', JSON.stringify(favorites)); // Atualiza o localStorage
                renderFavorites(); // Atualiza a interface
            }
        }

        document.addEventListener("DOMContentLoaded", function() {
            // Recupera o filtro do localStorage
            const filtroCategoria = localStorage.getItem('filtroCategoria');
            console.log("Filtro recuperado do localStorage:", filtroCategoria);
            
            if (filtroCategoria) {
                // Encontra o checkbox correspondente à categoria
                const checkboxes = document.querySelectorAll('#checkboxContainer2 input[type="checkbox"]');
                console.log("Checkboxes encontrados:", checkboxes.length);
                
                checkboxes.forEach(checkbox => {
                    console.log("Comparando:", checkbox.value, "com", filtroCategoria);
                    if (checkbox.value === filtroCategoria) {
                        console.log("Match encontrado! Marcando checkbox");
                        checkbox.checked = true;
                        // Dispara o evento de filtro
                        filterProducts();
                    }
                });
                
                // Limpa o filtro do localStorage
                localStorage.removeItem('filtroCategoria');
            }
        });

        function filterCheckboxesCategorias() {
            const query = document.getElementById('searchCategorias').value.toLowerCase();
            const checkboxes = document.querySelectorAll('#checkboxContainer2 input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                // Usa o atributo value para filtrar e exibe/oculta o elemento pai
                if (checkbox.value.toLowerCase().includes(query)) {
                    checkbox.parentElement.style.display = "";
                } else {
                    checkbox.parentElement.style.display = "none";
                }
            });
        }

        function filterCheckboxesMontadoras() {
            const query = document.getElementById('searchMontadoras').value.toLowerCase();
            const checkboxes = document.querySelectorAll('#checkboxContainer input[type="checkbox"]');
            checkboxes.forEach(checkbox => {
                if (checkbox.value.toLowerCase().includes(query)) {
                    checkbox.parentElement.style.display = "";
                } else {
                    checkbox.parentElement.style.display = "none";
                }
            });
        }

        // Nova função para alternar todos os checkboxes
        function toggleAllCheckboxes(group) {
            const container = group === 'montadoras' 
                ? document.getElementById('checkboxContainer') 
                : document.getElementById('checkboxContainer2');
            if (container) {
                const checkboxes = container.querySelectorAll('input[type="checkbox"]');
                let allChecked = true;
                checkboxes.forEach(checkbox => {
                    if (!checkbox.checked) { 
                        allChecked = false;
                    }
                });
                checkboxes.forEach(checkbox => {
                    checkbox.checked = !allChecked;
                });
            }
        }

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  // 1) Pré–marca montadoras vindas da URL
  params.getAll('montadora').forEach(m => {
    const chk = document.querySelector(
      `#checkboxContainer input[type="checkbox"][value="${m}"]`
    );
    if (chk) chk.checked = true;
  });

  // 2) Pré–marca categorias vindas da URL
  params.getAll('categoria').forEach(c => {
    const chk = document.querySelector(
      `#checkboxContainer2 input[type="checkbox"][value="${c}"]`
    );
    if (chk) chk.checked = true;
  });

  // 3) Pré–popula o campo de busca genérica
  const searchTerm = params.get('search') || '';
  const txtBusca   = document.getElementById('txtBusca');
  if (txtBusca && searchTerm) {
    txtBusca.value = searchTerm;
  }

  // 4) Dispara o filtro com tudo já ajustado
  filterProducts();

  // 5) Re–registra os listeners para mudanças dinâmicas
  if (txtBusca) {
    txtBusca.addEventListener('input', filterProducts);
  }
  document.querySelectorAll(
    '#checkboxContainer input[type="checkbox"], #checkboxContainer2 input[type="checkbox"]'
  ).forEach(chk => chk.addEventListener('change', filterProducts));
});

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const txtBusca = document.getElementById('txtBusca');
  
  // pré-popula campo de busca, se tiver
  const termo = params.get('search') || '';
  if (txtBusca) txtBusca.value = termo;

  // pré-marca checkboxes a partir da URL
  params.getAll('montadora').forEach(m => {
    const chk = document.querySelector(
      `#checkboxContainer input[value="${m}"]`
    );
    if (chk) chk.checked = true;
  });
  params.getAll('categoria').forEach(c => {
    const chk = document.querySelector(
      `#checkboxContainer2 input[value="${c}"]`
    );
    if (chk) chk.checked = true;
  });

  // agora, SEMPRE renderiza — se não houver filtros, filterProducts() traz tudo
  filterProducts();
});

document.addEventListener('DOMContentLoaded', function () {
    // ...existing code...
    // Ao carregar a página, exibe todos os produtos sem filtro
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(data => {
            produtosPaginados = data;
            currentPage = 1;
            renderProductsPage(produtosPaginados);
        })
        .catch(error => console.error('Erro ao carregar produtos:', error));
    // ...existing code...
});

// Função para enviar orçamento via WhatsApp
function sendQuoteToWhatsApp() {
  const nome = document.getElementById('inputName').value.trim();
  const cnpj = document.getElementById('inputCnpj').value.trim();
  const cidade = document.getElementById('inputCidade').value.trim();
  const empresa = document.getElementById('inputEmpresa').value.trim();
  const qtd = document.getElementById('summary-qty').textContent.trim();
  const truck = document.getElementById('summary-truck').textContent.trim();
  const cubagem = document.getElementById('summary-cubagem').textContent.trim();

  let mensagem = `Olá! Gostaria de solicitar um orçamento.\n`;
  mensagem += `Nome: ${nome}\n`;
  mensagem += `CNPJ: ${cnpj}\n`;
  mensagem += `Cidade: ${cidade}\n`;
  mensagem += `Empresa: ${empresa}\n`;
  mensagem += `Quantidade de itens: ${qtd}\n`;
  mensagem += `Meu caminhão: ${truck}\n`;
  mensagem += `Cubagem: ${cubagem}`;

  // Força abrir no WhatsApp Web para garantir que a mensagem seja preenchida
  const url = `https://web.whatsapp.com/send?phone=5511942138664&text=${encodeURIComponent(mensagem)}`;
  window.open(url, '_blank');
}

document.getElementById('sendQuoteBtn').addEventListener('click', sendQuoteToWhatsApp);

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.card-one').forEach(card => {
    card.addEventListener('touchstart', (e) => {
      e.stopPropagation(); // impede que o toque “agarre” no swiper
    }, { passive: true });
  });
});

document.addEventListener('DOMContentLoaded', () => {
  // Desbloqueia o scroll nos cards tocados
  const cards = document.querySelectorAll('.card-one');

  // Garante que o swiper não esteja capturando tudo sozinho
  const swipers = document.querySelectorAll('.swiper, .swiper-wrapper');
  swipers.forEach(swipe => {
    swipe.addEventListener('touchmove', (e) => {
      e.stopPropagation(); // permite rolar normalmente
    }, { passive: true });
  });
});

