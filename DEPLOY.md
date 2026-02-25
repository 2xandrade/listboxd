# 🚀 Guia Rápido de Deploy no GitHub Pages

## Resumo

Este guia mostra como fazer deploy seguro da aplicação no GitHub Pages usando GitHub Actions para proteger sua API key do TMDB.

## 📋 Checklist Rápido

- [ ] Conta no GitHub
- [ ] API Key do TMDB
- [ ] Repositório criado no GitHub

## 🔑 Passo 1: Obter API Key do TMDB

1. Acesse: https://www.themoviedb.org/settings/api
2. Faça login ou crie uma conta
3. Clique em "Create" ou "Request an API Key"
4. Escolha "Developer"
5. Preencha o formulário
6. Copie sua **API Key (v3 auth)**

## 📦 Passo 2: Preparar o Repositório

```bash
# Clone ou crie seu repositório
git clone https://github.com/seu-usuario/letterboxd-manager.git
cd letterboxd-manager

# Certifique-se de que o workflow está presente
ls .github/workflows/deploy.yml

# Faça commit de tudo (exceto config.js que está no .gitignore)
git add .
git commit -m "Setup for GitHub Pages deploy"
git push origin main
```

## 🔐 Passo 3: Configurar Secret no GitHub

1. Vá para: `https://github.com/seu-usuario/letterboxd-manager/settings/secrets/actions`
2. Clique em **"New repository secret"**
3. Preencha:
   - **Name**: `TMDB_API_KEY`
   - **Secret**: Cole sua API key do TMDB
4. Clique em **"Add secret"**

## 🌐 Passo 4: Habilitar GitHub Pages

1. Vá para: `https://github.com/seu-usuario/letterboxd-manager/settings/pages`
2. Em **"Source"**, selecione: **"GitHub Actions"**
3. Salve

## ✅ Passo 5: Verificar Deploy

1. Vá para a aba **"Actions"** do seu repositório
2. Você verá o workflow "Deploy to GitHub Pages" rodando
3. Aguarde até aparecer um ✅ verde
4. Acesse: `https://seu-usuario.github.io/letterboxd-manager/`

## 🎉 Pronto!

Sua aplicação está no ar! Agora você pode:

1. Fazer login com as credenciais padrão:
   - **Username**: `admin`
   - **Password**: `admin`

2. **IMPORTANTE**: Altere a senha imediatamente após o primeiro login!

## 🔄 Atualizações Futuras

Sempre que você fizer push para `main`, o deploy será automático:

```bash
git add .
git commit -m "Sua mensagem"
git push origin main
```

O GitHub Actions irá:
- ✅ Executar os testes
- ✅ Injetar a API key de forma segura
- ✅ Fazer deploy automaticamente

## ❓ Troubleshooting

### Deploy falhou?

1. Verifique se o Secret `TMDB_API_KEY` está configurado corretamente
2. Vá em **Actions** e clique no workflow que falhou para ver os logs
3. Certifique-se de que todos os testes passam localmente: `npm test`

### API key não funciona?

1. Verifique se copiou a **API Key (v3 auth)** correta
2. Teste a key localmente primeiro
3. Verifique se a key está ativa no TMDB

### Página não carrega?

1. Aguarde alguns minutos após o deploy
2. Limpe o cache do navegador (Ctrl+Shift+R)
3. Verifique se o GitHub Pages está habilitado nas configurações

## 🔒 Segurança

✅ **O que está seguro:**
- API key armazenada como Secret (criptografada)
- Código-fonte não expõe a key
- Key injetada apenas durante o build

❌ **Nunca faça:**
- Commit do arquivo `config.js`
- Compartilhe sua API key publicamente
- Desabilite o `.gitignore` para `config.js`

## 📚 Mais Informações

- [Documentação do GitHub Actions](https://docs.github.com/en/actions)
- [Documentação do GitHub Pages](https://docs.github.com/en/pages)
- [API do TMDB](https://developers.themoviedb.org/3)

---

**Dúvidas?** Abra uma issue no repositório!
