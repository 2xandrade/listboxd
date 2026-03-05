# Como Adicionar os 3 Arquivos no Google Apps Script

O código do Apps Script foi separado em **3 arquivos por categoria** para facilitar a manutenção e evitar erros ao colar código muito grande.

## 📁 Estrutura dos Arquivos

1. **apps-script-1-CORE.gs** - Funções principais e roteamento
2. **apps-script-2-USERS.gs** - Gerenciamento de usuários
3. **apps-script-3-MOVIES-LISTS.gs** - Gerenciamento de listas e filmes

## 🔧 Passo a Passo para Adicionar os Arquivos

### 1. Abra o Google Apps Script

1. Acesse sua planilha do Google Sheets
2. Clique em **Extensões** → **Apps Script**
3. Você verá um arquivo padrão chamado `Code.gs`

### 2. Adicione o Primeiro Arquivo (CORE)

1. **Selecione TODO o conteúdo** do arquivo `Code.gs` padrão e delete
2. Abra o arquivo **apps-script-1-CORE.gs** no seu editor
3. **Copie TODO o conteúdo** do arquivo
4. **Cole** no editor do Apps Script (no lugar do código que você deletou)
5. Clique em **Salvar** (ícone de disquete) ou pressione `Ctrl+S`

### 3. Adicione o Segundo Arquivo (USERS)

1. No Apps Script, clique no **+** ao lado de "Arquivos"
2. Selecione **Script**
3. Um novo arquivo será criado (pode ser chamado `Code` ou `Untitled`)
4. **Renomeie** o arquivo para `Users` (clique nos 3 pontinhos → Renomear)
5. Abra o arquivo **apps-script-2-USERS.gs** no seu editor
6. **Copie TODO o conteúdo** do arquivo
7. **Cole** no novo arquivo do Apps Script
8. Clique em **Salvar**

### 4. Adicione o Terceiro Arquivo (MOVIES-LISTS)

1. No Apps Script, clique novamente no **+** ao lado de "Arquivos"
2. Selecione **Script**
3. Um novo arquivo será criado
4. **Renomeie** o arquivo para `MoviesLists`
5. Abra o arquivo **apps-script-3-MOVIES-LISTS.gs** no seu editor
6. **Copie TODO o conteúdo** do arquivo
7. **Cole** no novo arquivo do Apps Script
8. Clique em **Salvar**

### 5. Verifique a Estrutura Final

No painel esquerdo do Apps Script, você deve ver:

```
📁 Arquivos
  📄 Code.gs (contém o código do CORE)
  📄 Users (contém o código de USERS)
  📄 MoviesLists (contém o código de MOVIES-LISTS)
```

## 🚀 Deploy do Web App

Depois de adicionar os 3 arquivos:

1. Clique em **Implantar** → **Nova implantação**
2. Clique no ícone de engrenagem ⚙️ → Selecione **Aplicativo da Web**
3. Configure:
   - **Descrição**: "Letterboxd Manager API v1"
   - **Executar como**: Eu (seu email)
   - **Quem tem acesso**: **Qualquer pessoa**
4. Clique em **Implantar**
5. **Copie a URL** que aparece (ela termina com `/exec`)
6. Cole essa URL no arquivo `config.js` do seu projeto

## ⚠️ Importante

- **Sempre faça "Nova implantação"** quando atualizar o código
- **Não use "Gerenciar implantações"** para atualizar - isso não funciona corretamente
- Os 3 arquivos trabalham juntos - você precisa dos 3 para funcionar
- O arquivo CORE chama as funções dos outros 2 arquivos

## 🔄 Para Atualizar o Código

Se precisar fazer mudanças:

1. Edite o arquivo apropriado no Apps Script
2. Clique em **Salvar**
3. Clique em **Implantar** → **Nova implantação**
4. Configure novamente (mesmas configurações)
5. **Copie a NOVA URL** e atualize no `config.js`

## 📋 Estrutura da Planilha

Certifique-se de que sua planilha tem 3 abas com estes nomes EXATOS:

1. **Usuarios** (sem acento)
2. **Listas**
3. **Filmes**

### Aba "Usuarios"
Cabeçalhos na linha 1:
```
id_usuario | nome | email | senha_hash | is_admin | criado_em
```

### Aba "Listas"
Cabeçalhos na linha 1:
```
id_lista | id_usuario_dono | titulo | descricao | criada_em
```

### Aba "Filmes"
Cabeçalhos na linha 1:
```
id_filme | id_lista | id_usuario | titulo_filme | ano | nota | assistido_em | review
```

## ✅ Testando

Depois de fazer o deploy:

1. Abra seu site (GitHub Pages)
2. Faça login com: `admin@example.com` / `admin`
3. Se conseguir logar, está funcionando!

## 🆘 Problemas Comuns

### "Ocorreu um erro desconhecido"
- Você tentou colar código muito grande de uma vez
- **Solução**: Use os 3 arquivos separados como descrito acima

### "Cannot read properties of undefined"
- Você não copiou todos os 3 arquivos
- **Solução**: Verifique se os 3 arquivos estão presentes

### "CORS Missing Allow Origin"
- O deploy não está configurado como "Qualquer pessoa"
- **Solução**: Refaça o deploy com acesso "Qualquer pessoa"

### "Unknown action"
- A URL no `config.js` está errada ou antiga
- **Solução**: Copie a URL mais recente do deploy

## 📞 Dúvidas?

Se tiver problemas:
1. Verifique se os 3 arquivos estão salvos
2. Verifique se fez "Nova implantação" (não "Gerenciar")
3. Verifique se a URL no `config.js` está atualizada
4. Verifique se as 3 abas da planilha existem com os nomes corretos
