# GitHub Actions Deployment Guide

Este guia explica como configurar o deploy automático do Letterboxd Manager usando GitHub Actions.

## 📋 Pré-requisitos

Antes de configurar o deploy, você precisa ter:

1. ✅ Conta no TMDB com API Key e Read Access Token
2. ✅ Google Sheets configurado com Apps Script (veja `.kiro/specs/google-sheets-integration/QUICK-START.md`)
3. ✅ Repositório no GitHub com o código do projeto

## 🔐 Passo 1: Configurar Secrets no GitHub

Os secrets são variáveis de ambiente criptografadas que armazenam suas credenciais de forma segura.

### Como Adicionar Secrets

1. Acesse seu repositório no GitHub
2. Clique em **Settings** (Configurações)
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**

### Secrets Necessários

Você precisa adicionar **3 secrets**:

#### 1. TMDB_API_KEY

- **Nome do Secret**: `TMDB_API_KEY`
- **Valor**: Sua API Key do TMDB (v3 auth)
- **Onde obter**: 
  1. Acesse https://www.themoviedb.org/settings/api
  2. Copie o valor de "API Key (v3 auth)"
  3. Cole no campo Secret

#### 2. TMDB_READ_ACCESS_TOKEN

- **Nome do Secret**: `TMDB_READ_ACCESS_TOKEN`
- **Valor**: Seu Read Access Token do TMDB (v4 auth)
- **Onde obter**:
  1. Acesse https://www.themoviedb.org/settings/api
  2. Copie o valor de "API Read Access Token (v4 auth)"
  3. Cole no campo Secret

#### 3. GOOGLE_SHEETS_SCRIPT_ID

- **Nome do Secret**: `GOOGLE_SHEETS_SCRIPT_ID`
- **Valor**: Apenas o ID do seu Apps Script (não a URL completa)
- **Onde obter**:
  1. Sua URL do Apps Script é algo como: `https://script.google.com/macros/s/ABC123XYZ456/exec`
  2. Copie apenas a parte entre `/s/` e `/exec`: `ABC123XYZ456`
  3. Cole no campo Secret

### ✅ Verificar Secrets Configurados

Após adicionar os 3 secrets, você deve ver:

```
TMDB_API_KEY                    Updated X minutes ago
TMDB_READ_ACCESS_TOKEN          Updated X minutes ago
GOOGLE_SHEETS_SCRIPT_ID         Updated X minutes ago
```

## 🚀 Passo 2: Habilitar GitHub Pages

1. Vá em **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Salve as configurações

## 🧪 Passo 3: Testar o Deploy

### Opção 1: Push para Branch Main (Produção)

```bash
# Faça uma pequena alteração
echo "# Test deploy" >> test.txt

# Commit e push
git add test.txt
git commit -m "test: verificar deploy automático"
git push origin main
```

**Nota**: O deploy automático só é acionado quando você faz push para a branch `main`. Você pode desenvolver e testar em outras branches (como `develop`) sem acionar o deploy.

### Opção 2: Trigger Manual

1. Vá para a aba **Actions** no GitHub
2. Selecione o workflow "Deploy to GitHub Pages"
3. Clique em **Run workflow**
4. Selecione a branch `main`
5. Clique em **Run workflow**

## 📊 Passo 4: Monitorar o Deploy

1. Vá para a aba **Actions** no seu repositório
2. Você verá o workflow "Deploy to GitHub Pages" em execução
3. Clique no workflow para ver os detalhes
4. Aguarde a conclusão (ícone verde ✓)

### Etapas do Workflow

O workflow executa as seguintes etapas:

1. ✅ **Checkout**: Baixa o código do repositório
2. ✅ **Setup Node**: Configura Node.js v20
3. ✅ **Install dependencies**: Instala dependências do npm
4. ✅ **Run tests**: Executa todos os testes
5. ✅ **Create config.js**: Gera o arquivo de configuração com os secrets
6. ✅ **Setup Pages**: Configura GitHub Pages
7. ✅ **Upload artifact**: Prepara os arquivos para deploy
8. ✅ **Deploy**: Faz o deploy no GitHub Pages

### Tempo Estimado

- ⏱️ Tempo total: 2-5 minutos
- Se os testes falharem, o deploy não será realizado

## 🌐 Passo 5: Acessar a Aplicação

Após o deploy bem-sucedido:

1. Acesse: `https://seu-usuario.github.io/letterboxd-manager/`
2. Faça login com suas credenciais
3. Verifique se a integração com TMDB e Google Sheets está funcionando

## 🔧 Troubleshooting

### Erro: "Secret not found"

**Problema**: Um ou mais secrets não foram configurados.

**Solução**:
1. Verifique se os 3 secrets foram adicionados corretamente
2. Verifique se os nomes estão exatamente como especificado (case-sensitive)
3. Tente remover e adicionar novamente o secret problemático

### Erro: "Tests failed"

**Problema**: Os testes estão falando e o deploy foi bloqueado.

**Solução**:
1. Execute os testes localmente: `npm test`
2. Corrija os erros encontrados
3. Commit e push novamente

### Erro: "TMDB API error"

**Problema**: A API Key do TMDB está incorreta ou inválida.

**Solução**:
1. Verifique se copiou a API Key correta do TMDB
2. Certifique-se de que a API Key está ativa
3. Atualize o secret `TMDB_API_KEY` no GitHub

### Erro: "Google Sheets API error"

**Problema**: O Script ID do Google Sheets está incorreto.

**Solução**:
1. Verifique se copiou apenas o ID (não a URL completa)
2. Certifique-se de que o Apps Script está publicado como Web App
3. Verifique as permissões do Apps Script ("Qualquer pessoa")
4. Atualize o secret `GOOGLE_SHEETS_SCRIPT_ID` no GitHub

### Deploy não atualiza o site

**Problema**: O workflow executou com sucesso mas o site não atualizou.

**Solução**:
1. Aguarde 5-10 minutos (cache do GitHub Pages)
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Tente acessar em modo anônimo
4. Verifique se GitHub Pages está habilitado nas configurações

## 🔄 Workflow Automático

O deploy acontece automaticamente quando você:

- ✅ Faz push para a branch `main`
- ✅ Executa manualmente via Actions tab

**Nota**: Outras branches (como `develop`) não acionam o deploy automático. Isso permite que você desenvolva e teste sem fazer deploy a cada commit.

## 📝 Arquivo de Configuração Gerado

Durante o deploy, o GitHub Actions cria automaticamente o arquivo `config.js`:

```javascript
const CONFIG = {
    tmdb: {
        apiKey: 'sua-api-key-do-secret',
        readAccessToken: 'seu-token-do-secret',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
    },
    googleSheets: {
        apiUrl: 'https://script.google.com/macros/s/seu-script-id-do-secret/exec'
    },
    app: {
        sessionTimeout: 3600000,
        maxLoginAttempts: 5,
        cacheExpiration: 300000
    }
};
```

**Importante**: Este arquivo é gerado apenas durante o deploy e nunca é commitado no repositório.

## 🔒 Segurança

### ✅ Boas Práticas Implementadas

- Secrets são criptografados pelo GitHub
- Secrets nunca aparecem nos logs
- `config.js` não é commitado no repositório (está no `.gitignore`)
- Apenas o dono do repositório tem acesso aos secrets
- API Keys são injetadas apenas durante o build

### ⚠️ Nunca Faça Isso

- ❌ Não commite o arquivo `config.js` com credenciais reais
- ❌ Não compartilhe seus secrets publicamente
- ❌ Não coloque credenciais diretamente no código
- ❌ Não desabilite a verificação de secrets

## 📚 Recursos Adicionais

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [TMDB API Documentation](https://developers.themoviedb.org/3)

## 🆘 Suporte

Se você encontrar problemas:

1. Verifique os logs do workflow na aba Actions
2. Consulte a seção Troubleshooting acima
3. Abra uma issue no repositório com os detalhes do erro

---

**Última atualização**: 2026-03-03
