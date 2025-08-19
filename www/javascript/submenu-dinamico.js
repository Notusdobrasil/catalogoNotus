// Script para gerar dinamicamente os submenus do header baseados nos grupos
function gerarSubmenusDinamicos() {
    fetch('./conversor/produtos.json')
        .then(response => response.json())
        .then(produtos => {
            // Mapear categorias para IDs mais limpos
            const categoriasMap = {
                'radiador': 'RADIADOR',
                'intercooler': 'INTERCOOLER', 
                'gmv': 'GMV',
                'eletroventilador': 'ELETROVENTILADOR',
                'condensador': 'CONDENSADOR',
                'evaporadora': 'EVAPORADORA',
                'radiador de óleo motor': 'RADIADOR DE ÓLEO MOTOR',
                'radiador de óleo transmissão': 'RADIADOR DE ÓLEO TRANSMISSÃO',
                'radiador de aquecimento': 'RADIADOR DE AQUECIMENTO'
            };

            // Ordem específica dos grupos (igual ao categoria.js)
            const ordemGrupos = [
                'Passeio', 'SUV', 'Picape', 'Van', 'Moto', 'Caminhão', 'Ônibus', 'Agrícola', 'Empilhadeira', 'Utilitários', 'Outras', 'Universal'
            ];

            // Para cada categoria, encontrar os grupos disponíveis
            Object.keys(categoriasMap).forEach(categoriaUrl => {
                const categoriaUpper = categoriasMap[categoriaUrl];
                
                // Filtrar produtos da categoria
                const produtosDaCategoria = produtos.filter(p => 
                    p.categoria && p.categoria.toUpperCase() === categoriaUpper
                );
                
                // Obter grupos únicos da categoria
                const gruposEncontrados = [...new Set(produtosDaCategoria
                    .map(p => p.grupo)
                    .filter(grupo => grupo && grupo.trim() !== '')
                    .map(grupo => grupo.trim())
                )];

                // Ordenar grupos conforme a ordem definida
                const gruposOrdenados = ordemGrupos.filter(grupo => 
                    gruposEncontrados.some(g => g.toLowerCase() === grupo.toLowerCase())
                );

                // Atualizar todos os submenus da categoria
                const submenus = document.querySelectorAll(`a[href="categoria.html?cat=${categoriaUrl}"]`);
                submenus.forEach(linkCategoria => {
                    const parentLi = linkCategoria.parentElement;
                    if (parentLi && parentLi.classList.contains('has-submenu')) {
                        const submenu2 = parentLi.querySelector('.submenu-2');
                        if (submenu2) {
                            // Limpar submenu atual
                            submenu2.innerHTML = '';
                            
                            // Adicionar itens de grupo
                            gruposOrdenados.forEach(grupo => {
                                const li = document.createElement('li');
                                const a = document.createElement('a');
                                a.href = `todosprodutos.html?search=${encodeURIComponent(grupo)}&categoria=${encodeURIComponent(categoriaUpper)}`;
                                a.textContent = grupo;
                                li.appendChild(a);
                                submenu2.appendChild(li);
                            });
                        }
                    }
                });
            });
        })
        .catch(error => {
            console.error('Erro ao carregar produtos para gerar submenus:', error);
        });
}

// Executar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', gerarSubmenusDinamicos);
