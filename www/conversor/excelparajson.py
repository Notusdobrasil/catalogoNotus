import pandas as pd
import os
import json
import re  # Usado para trabalhar com expressões regulares

# Caminhos dos arquivos
excel_path = "produtos-catalogo.xlsx"
json_path = "produtos.json"
image_folder = "ImagensProdutos"

# Função para dividir as medidas da colmeia
def dividir_medidas_colmeia(medidas):
    if not isinstance(medidas, str):
        return {"alturacolmeia": "", "comprimentocolmeia": "", "larguracolmeia": ""}
    
    partes = medidas.split('X')
    if len(partes) == 3:
        return {
            "alturacolmeia": partes[0].strip() + "mm",
            "comprimentocolmeia": partes[1].strip() + "mm",
            "larguracolmeia": partes[2].strip() + "mm"
        }
    return {"alturacolmeia": "", "comprimentocolmeia": "", "larguracolmeia": ""}

# 1. Ler a planilha Excel
df = pd.read_excel(excel_path)

# 2. Selecionar apenas as colunas desejadas
colunas_desejadas = ['id','codigo', 'grupo', 'categoria', 'montadora', 'modelo', 'litragem', 'ano', 'ac', 'transmissao', 'referenciaoriginal', 'crossreference', 'denso', 'mahle', 'marelli', 'valeo', 'visconde', 'medidascolmeiamm', 'ncm', 'codigodebarras', 'tecnologia', 'linha']
df_selecionado = df[colunas_desejadas]

# 3. Adicionar a chave 'nome' baseada na categoria
def extrair_nome_da_categoria(categoria):
    if isinstance(categoria, str):
        # Limpa e formata a categoria para ser usada como nome
        nome = categoria.strip()
        return nome if nome else "PRODUTO"
    return "PRODUTO"

df_selecionado['nome'] = df_selecionado['categoria'].apply(extrair_nome_da_categoria)

# 4. Converter para JSON
json_data = df_selecionado.to_json(orient="records", indent=4)

# 5. Salvar JSON inicial
with open(json_path, "w", encoding="utf-8") as f:
    f.write(json_data)

print("Conversão concluída!")

# 6. Verificar a existência das imagens
image_files = os.listdir(image_folder)  # Lista de todos os arquivos na pasta

# Carregar os dados do JSON
data = json.loads(json_data)

# 7. Comparar os códigos do JSON com os arquivos de imagem
for item in data:
    codigo = str(item.get("codigo")).strip()  # Garantir que seja string e sem espaços extras
    referenciaoriginal = str(item.get("referenciaoriginal")).strip()  # Garantir que seja string e sem espaços extras

    crossreference = str(item.get("crossreference")).strip()
    
    denso = str(item.get("denso")).strip()

    mahle = str(item.get("mahle")).strip()

    marelli = str(item.get("marelli")).strip()

    valeo = str(item.get("valeo")).strip()

    visconde = str(item.get("visconde")).strip()

    # Dividir as medidas da colmeia
    medidas_colmeia = item.get("medidascolmeiamm", "")
    medidas_divididas = dividir_medidas_colmeia(medidas_colmeia)
    item.update(medidas_divididas)
    del item["medidascolmeiamm"]  # Remove a chave original

    # Criar nova descrição baseada nos campos especificados
    nome = item.get("nome", "")
    linha = item.get("linha", "")
    montadora = item.get("montadora", "")
    modelo = item.get("modelo", "")
    ano = item.get("ano", "")
    
    # Construir a nova descrição
    partes_descricao = []
    if nome: partes_descricao.append(str(nome))
    if linha: partes_descricao.append(str(linha))
    if montadora: partes_descricao.append(str(montadora))
    if modelo: partes_descricao.append(str(modelo))
    if ano: partes_descricao.append(str(ano))
    
    nova_descricao = " ".join(partes_descricao)
    item["descricao"] = nova_descricao
    
    
    if codigo:
        imagens_encontradas = sorted([img for img in image_files if img.startswith(codigo)])

        if imagens_encontradas:
            # Limita a quantidade de imagens a 4
            imagens_encontradas = imagens_encontradas[:4]

            # Adiciona a primeira imagem como "imagem"
            item["imagem"] = f"./conversor/ImagensProdutos/{imagens_encontradas[0]}"

            # Adiciona até 3 imagens extras
            for i, img in enumerate(imagens_encontradas[1:], start=2):
                item[f"{i}imagem"] = f"./conversor/ImagensProdutos/{img}"
            
            print(f"✔ {len(imagens_encontradas)} imagens adicionadas para {codigo}.")
        else:
            print(f"✘ Nenhuma imagem encontrada para {codigo}.")

# 8. Salvar o JSON atualizado com as chaves de imagem
with open(json_path, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=4)

print("JSON atualizado com as imagens e a descrição modificada!")
