# 📋 Setup da Planilha Google Sheets - Passo a Passo

## 🎯 O Que Você Vai Criar

Uma planilha com 3 abas para armazenar:
1. Usuários do sistema
2. Listas de filmes
3. Filmes (para assistir e assistidos)

---

## 📝 PASSO 1: Criar a Planilha

1. Acesse [Google Sheets](https://sheets.google.com)
2. Clique em **+ Novo** (ou **Blank**)
3. Renomeie a planilha para: **Letterboxd Manager Database**

---

## 📊 PASSO 2: Criar as 3 Abas

### Aba 1: Usuarios

1. **Renomeie a primeira aba** (Sheet1) para: `Usuarios`
2. **Na linha 1**, adicione os cabeçalhos (copie e cole):

```
id_usuario	nome	email	senha_hash	is_admin	criado_em
```

**Ou digite célula por célula:**
- A1: `id_usuario`
- B1: `nome`
- C1: `email`
- D1: `senha_hash`
- E1: `is_admin`
- F1: `criado_em`

3. **Formate os cabeçalhos** (opcional mas recomendado):
   - Selecione a linha 1
   - Clique em **Negrito**
   - Clique em **Cor de preenchimento** → Escolha cinza claro

4. **Adicione o usuário admin** na linha 2 (copie e cole):

```
admin-001	Admin	admin@example.com	8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918	TRUE	2024-01-01T00:00:00.000Z
```

**Resultado esperado:**

| id_usuario | nome | email | senha_hash | is_admin | criado_em |
|------------|------|-------|------------|----------|-----------|
| admin-001 | Admin | admin@example.com | 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918 | TRUE | 2024-01-01T00:00:00.000Z |

---

### Aba 2: Listas

1. **Clique no +** no canto inferior esquerdo para criar nova aba
2. **Renomeie** para: `Listas`
3. **Na linha 1**, adicione os cabeçalhos:

```
id_lista	id_usuario_dono	titulo	descricao	criada_em
```

**Ou digite célula por célula:**
- A1: `id_lista`
- B1: `id_usuario_dono`
- C1: `titulo`
- D1: `descricao`
- E1: `criada_em`

4. **Formate os cabeçalhos** (negrito + cor de fundo)

5. **Adicione uma lista de exemplo** na linha 2 (opcional):

```
list-001	admin-001	Filmes para Assistir	Lista compartilhada do grupo	2024-01-01T00:00:00.000Z
```

**Resultado esperado:**

| id_lista | id_usuario_dono | titulo | descricao | criada_em |
|----------|-----------------|--------|-----------|-----------|
| list-001 | admin-001 | Filmes para Assistir | Lista compartilhada do grupo | 2024-01-01T00:00:00.000Z |

---

### Aba 3: Filmes

1. **Clique no +** novamente para criar terceira aba
2. **Renomeie** para: `Filmes`
3. **Na linha 1**, adicione os cabeçalhos:

```
id_filme	id_lista	id_usuario	titulo_filme	ano	nota	assistido_em	review	status
```

**Ou digite célula por célula:**
- A1: `id_filme`
- B1: `id_lista`
- C1: `id_usuario`
- D1: `titulo_filme`
- E1: `ano`
- F1: `nota`
- G1: `assistido_em`
- H1: `review`
- I1: `status`

4. **Formate os cabeçalhos** (negrito + cor de fundo)

5. **Deixe vazia** (os filmes serão adicionados pela aplicação)

**Resultado esperado:**

| id_filme | id_lista | id_usuario | titulo_filme | ano | nota | assistido_em | review | status |
|----------|----------|------------|--------------|-----|------|--------------|--------|--------|
| _(vazio)_ | _(vazio)_ | _(vazio)_ | _(vazio)_ | _(vazio)_ | _(vazio)_ | _(vazio)_ | _(vazio)_ | _(vazio)_ |

---

## ✅ PASSO 3: Verificar a Estrutura

Sua planilha deve ter **3 abas** no rodapé:

```
┌─────────────┬─────────────┬─────────────┐
│  Usuarios   │   Listas    │   Filmes    │
└─────────────┴─────────────┴─────────────┘
```

Cada aba deve ter:
- ✅ Linha 1 com cabeçalhos
- ✅ Cabeçalhos formatados (negrito)
- ✅ Aba `Usuarios` com 1 usuário admin
- ✅ Aba `Listas` pode estar vazia ou com 1 lista exemplo
- ✅ Aba `Filmes` vazia (só cabeçalhos)

---

## 🔧 PASSO 4: Adicionar o Código Apps Script

1. Na planilha, clique em **Extensões** → **Apps Script**
2. Uma nova aba será aberta
3. **DELETE TODO** o código de exemplo
4. Copie o código do arquivo: `.kiro/specs/google-sheets-integration/apps-script-code.gs`
5. Cole no editor
6. Clique em **Salvar** (Ctrl+S)
7. Dê um nome ao projeto: **Letterboxd Manager API**

---

## 🚀 PASSO 5: Fazer Deploy

1. No editor do Apps Script, clique em **Implantar** → **Nova implantação**
2. Clique no ícone de **engrenagem** ⚙️
3. Selecione **Aplicativo da Web**
4. Configure:
   - **Descrição**: `Letterboxd Manager API v1`
   - **Executar como**: `Eu (seu-email@gmail.com)`
   - **Quem tem acesso**: `Qualquer pessoa`
5. Clique em **Implantar**
6. **Autorize o acesso** quando solicitado:
   - Clique em **Autorizar acesso**
   - Escolha sua conta
   - Clique em **Avançado**
   - Clique em **Ir para Letterboxd Manager API (não seguro)**
   - Clique em **Permitir**
7. **COPIE A URL** que aparece (formato: `https://script.google.com/macros/s/...`)

---

## ⚙️ PASSO 6: Configurar no Projeto

1. Abra o arquivo `config.js` no seu projeto
2. Cole a URL na seção `googleSheets`:

```javascript
const CONFIG = {
    tmdb: {
        apiKey: 'sua_api_key_do_tmdb',
        readAccessToken: 'seu_token_do_tmdb',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
    },
    googleSheets: {
        apiUrl: 'COLE_A_URL_AQUI'  // ← Cole a URL do deploy
    },
    app: {
        sessionTimeout: 3600000,
        maxLoginAttempts: 5,
        cacheExpiration: 300000
    }
};
```

3. Salve o arquivo

---

## 🧪 PASSO 7: Testar

1. Abra sua aplicação no navegador
2. Faça login com:
   - **Email**: `admin@example.com`
   - **Senha**: `admin`
3. Se funcionar, você verá a tela principal! 🎉

---

## 📋 Checklist Final

Antes de testar, verifique:

- [ ] Planilha criada com nome "Letterboxd Manager Database"
- [ ] Aba `Usuarios` criada com 6 colunas
- [ ] Aba `Listas` criada com 5 colunas
- [ ] Aba `Filmes` criada com 9 colunas (incluindo `status`)
- [ ] Usuário admin adicionado na aba `Usuarios`
- [ ] Código Apps Script colado e salvo
- [ ] Deploy feito como "Aplicativo da Web"
- [ ] Acesso configurado como "Qualquer pessoa"
- [ ] URL copiada e colada no `config.js`
- [ ] Arquivo `config.js` salvo

---

## 🆘 Problemas Comuns

### Erro: "Sheet not found"
- Verifique se os nomes das abas estão EXATAMENTE: `Usuarios`, `Listas`, `Filmes`
- Cuidado com espaços extras!

### Erro: "Missing action parameter"
- Verifique se salvou o código no Apps Script
- Verifique se fez o deploy

### Erro de CORS
- Certifique-se de usar o código atualizado com suporte a CORS
- Faça um novo deploy (Nova versão)

### Login não funciona
- Verifique se o usuário admin foi adicionado corretamente
- Verifique se o hash da senha está correto
- Tente limpar o cache do navegador

---

## 📸 Exemplo Visual

Sua planilha deve ficar assim:

```
┌─────────────────────────────────────────────────────────┐
│ Letterboxd Manager Database                             │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Aba: Usuarios                                          │
│  ┌──────────┬──────┬──────────────┬────────────┬───┐   │
│  │id_usuario│ nome │    email     │senha_hash  │...│   │
│  ├──────────┼──────┼──────────────┼────────────┼───┤   │
│  │admin-001 │Admin │admin@exam... │8c6976e5... │...│   │
│  └──────────┴──────┴──────────────┴────────────┴───┘   │
│                                                          │
│  Aba: Listas                                            │
│  ┌─────────┬────────────────┬────────────┬──────┬───┐  │
│  │id_lista │id_usuario_dono │   titulo   │ ...  │...│  │
│  ├─────────┼────────────────┼────────────┼──────┼───┤  │
│  │list-001 │admin-001       │Filmes p... │ ...  │...│  │
│  └─────────┴────────────────┴────────────┴──────┴───┘  │
│                                                          │
│  Aba: Filmes                                            │
│  ┌─────────┬─────────┬──────────┬────────┬───┬────┐   │
│  │id_filme │id_lista │titulo... │  ano   │...│sta │   │
│  ├─────────┼─────────┼──────────┼────────┼───┼────┤   │
│  │ (vazio - será preenchido pela aplicação)      │   │
│  └─────────┴─────────┴──────────┴────────┴───┴────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

**Pronto! Sua planilha está configurada e pronta para uso!** 🚀

**Credenciais de login:**
- Email: `admin@example.com`
- Senha: `admin`

**⚠️ Lembre-se de alterar a senha após o primeiro login!**
