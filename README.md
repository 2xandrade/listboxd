# Letterboxd Manager

Um sistema web simplificado para gerenciamento de lista compartilhada de filmes, integrado com a API do TMDB (The Movie Database).

## 📋 Índice

- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação e Configuração](#instalação-e-configuração)
- [Configuração da API do TMDB](#configuração-da-api-do-tmdb)
- [Primeiro Acesso - Criando Usuário Admin](#primeiro-acesso---criando-usuário-admin)
- [Deploy no GitHub Pages](#deploy-no-github-pages)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Uso](#uso)
- [Desenvolvimento](#desenvolvimento)

## 🎬 Sobre o Projeto

O Letterboxd Manager é uma aplicação web single-page (SPA) construída com JavaScript vanilla que permite:
- Gerenciar usuários com autenticação segura
- Visualizar filmes populares e em alta através da API do TMDB
- Adicionar filmes a uma lista compartilhada
- Visualizar quem adicionou cada filme e quando

A aplicação é leve, sem frameworks pesados, e pode ser hospedada gratuitamente no GitHub Pages.

## ✨ Funcionalidades

### Para Administradores
- Criar, editar e remover usuários
- Gerenciar privilégios de administrador
- Acesso completo a todas as funcionalidades

### Para Usuários
- Login seguro com autenticação
- **Navegação por Abas**: Interface organizada em três abas principais
  - **Explorar Filmes**: Visualizar filmes populares e em alta com paginação
  - **Lista Compartilhada**: Ver filmes adicionados pelo grupo com sistema de filtros
  - **Filmes Assistidos**: Histórico de filmes assistidos com avaliações
- Visualizar filmes populares e em alta com paginação
- Buscar filmes por título
- Ver detalhes completos dos filmes incluindo sinopse
- Adicionar filmes à lista compartilhada
- **Sistema de Filtros**: Filtrar lista compartilhada por gênero, nome ou ordem aleatória
- **Marcar como Assistido**: Registrar filmes assistidos com avaliações e notas
- Ver lista compartilhada com informações de quem adicionou cada filme
- Remover filmes da lista

## 🛠 Tecnologias

- **Frontend**: JavaScript Vanilla (ES6+)
- **Estilização**: CSS3
- **Armazenamento**: LocalStorage
- **API Externa**: TMDB API
- **Segurança**: bcrypt.js para hashing de senhas
- **Testes**: Jest + fast-check (property-based testing)
- **Hospedagem**: GitHub Pages

### 🌐 Compatibilidade de Navegadores

A aplicação é totalmente compatível com os principais navegadores modernos:

- ✅ **Chrome** 90+ (Recomendado)
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+ (Chromium)
- ✅ **iOS Safari** 14+
- ✅ **Chrome Android** 90+

Para mais detalhes sobre compatibilidade e testes, consulte:
- 📖 [Guia de Testes Cross-Browser](browser-testing-guide.md)
- 📋 [Suporte de Navegadores](BROWSER-SUPPORT.md)
- 🧪 [Relatório de Testes](/.kiro/specs/google-sheets-integration/task-33-browser-testing-report.md)

## 🏗 Arquitetura

A aplicação segue uma arquitetura em camadas:

```
┌─────────────────────────────────────┐
│     Presentation Layer (UI)         │
│  (HTML, CSS, app.js, admin.js)      │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    Business Logic Layer              │
│  (auth.js, users.js, films.js,      │
│   list.js, notifications.js)        │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│       Data Layer                     │
│  (storage.js, TMDB API)              │
└─────────────────────────────────────┘
```

### Módulos Principais

- **AuthService**: Gerenciamento de autenticação e sessões
- **UserService**: CRUD de usuários
- **FilmService**: Integração com TMDB API
- **ListService**: Gerenciamento da lista compartilhada e filmes assistidos
- **StorageManager**: Abstração do localStorage
- **NotificationService**: Sistema de notificações visuais
- **TabsService**: Gerenciamento de navegação entre abas
- **FiltersService**: Sistema de filtros para lista compartilhada

## 📦 Instalação e Configuração

### Pré-requisitos

- Node.js (versão 14 ou superior) - apenas para desenvolvimento e testes
- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Conta no TMDB para obter API key
- Conta Google para configurar Google Sheets API (backend)

### Passo 1: Clone o Repositório

```bash
git clone https://github.com/seu-usuario/letterboxd-manager.git
cd letterboxd-manager
```

### Passo 2: Instale as Dependências (Opcional - apenas para desenvolvimento)

```bash
npm install
```

**Nota**: As dependências são necessárias apenas para executar testes. A aplicação funciona sem Node.js em produção.

### Passo 3: Configure o Google Sheets API (Backend)

**IMPORTANTE**: Este projeto usa Google Sheets como backend para armazenamento de dados.

Siga o guia completo de configuração:

📖 **[Ver Guia Completo: .kiro/specs/google-sheets-integration/QUICK-START.md](.kiro/specs/google-sheets-integration/QUICK-START.md)**

Resumo rápido:
1. Crie uma planilha Google Sheets com 3 abas: `Usuarios`, `Listas`, `Filmes`
2. Configure Apps Script com o código fornecido
3. Faça deploy como Web App
4. Copie a URL do Web App

Arquivos de referência:
- 📋 **QUICK-START.md** - Checklist rápido
- 📖 **google-sheets-setup.md** - Instruções detalhadas
- 💻 **apps-script-code.gs** - Código completo do Apps Script
- 🧪 **api-testing-guide.md** - Exemplos de teste dos endpoints

#### Como Obter a URL do Google Sheets Web App

1. **Criar a Planilha**:
   - Acesse [Google Sheets](https://sheets.google.com)
   - Crie uma nova planilha
   - Renomeie as abas para: `Usuarios`, `Listas`, `Filmes`

2. **Configurar Apps Script**:
   - Na planilha, vá em **Extensões** → **Apps Script**
   - Copie o código de `.kiro/specs/google-sheets-integration/apps-script-code.gs`
   - Cole no editor do Apps Script
   - Salve o projeto (Ctrl+S)

3. **Fazer Deploy**:
   - Clique em **Implantar** → **Nova implantação**
   - Selecione tipo: **Aplicativo da Web**
   - Configure:
     - **Descrição**: "Letterboxd Manager API"
     - **Executar como**: "Eu"
     - **Quem tem acesso**: "Qualquer pessoa"
   - Clique em **Implantar**
   - **COPIE A URL** que aparece (formato: `https://script.google.com/macros/s/SCRIPT_ID/exec`)

4. **Testar a API**:
   - Use os exemplos em `api-testing-guide.md` para testar os endpoints
   - Verifique se os dados estão sendo salvos na planilha

### Passo 4: Configure o Arquivo de Configuração

Copie o arquivo de exemplo e configure suas credenciais:

```bash
cp config.example.js config.js
```

Edite o arquivo `config.js` e adicione:
1. Sua API key do TMDB (veja próxima seção)
2. A URL do Google Sheets Web App (do passo anterior)

## 🔑 Configuração da API do TMDB

### Obtendo sua API Key

1. Acesse [https://www.themoviedb.org/](https://www.themoviedb.org/)
2. Crie uma conta gratuita ou faça login
3. Vá para **Settings** → **API** ([https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api))
4. Clique em **Create** ou **Request an API Key**
5. Escolha **Developer** como tipo de uso
6. Preencha o formulário com informações básicas do projeto
7. Aceite os termos de uso
8. Copie sua **API Key (v3 auth)** e **API Read Access Token (v4 auth)**

### Configurando no Projeto

Abra o arquivo `config.js` e substitua os valores:

```javascript
const CONFIG = {
    tmdb: {
        apiKey: 'sua_api_key_aqui',
        readAccessToken: 'seu_read_access_token_aqui',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p/w500'
    },
    googleSheets: {
        apiUrl: 'https://script.google.com/macros/s/SEU_SCRIPT_ID_AQUI/exec'
    },
    app: {
        sessionTimeout: 3600000,
        maxLoginAttempts: 5,
        cacheExpiration: 300000
    }
};
```

**Onde encontrar cada valor:**
- `apiKey` e `readAccessToken`: Obtidos no TMDB (veja seção anterior)
- `apiUrl`: URL do Google Sheets Web App (veja Passo 3)

**⚠️ IMPORTANTE**: Nunca commite o arquivo `config.js` no repositório. Ele já está no `.gitignore`.

## 👤 Primeiro Acesso - Criando Usuário Admin

No primeiro acesso, você precisa criar um usuário administrador manualmente através do console do navegador.

### Método 1: Usando o Console do Navegador

1. Abra a aplicação no navegador
2. Abra o Console do Desenvolvedor (F12 ou Ctrl+Shift+I)
3. Execute o seguinte código:

```javascript
// Importar o UserService
const userService = new UserService();

// Criar usuário admin
const passwordHash = authService.hashPassword('admin');
const adminUser = userService.createUser('admin', passwordHash, true);

console.log('Usuário admin criado:', adminUser);
```

4. Agora você pode fazer login com:
   - **Username**: `admin`
   - **Password**: `admin`

5. **IMPORTANTE**: Após o primeiro login, vá para a página de administração e altere a senha padrão!

### Método 2: Script de Inicialização

Você também pode criar um arquivo HTML temporário para inicialização:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Setup Admin</title>
</head>
<body>
    <h1>Criar Usuário Admin</h1>
    <button onclick="createAdmin()">Criar Admin</button>
    <div id="result"></div>

    <script src="js/storage.js"></script>
    <script src="js/users.js"></script>
    <script src="js/auth.js"></script>
    <script>
        function createAdmin() {
            const storageManager = new StorageManager();
            const userService = new UserService(storageManager);
            const authService = new AuthService(storageManager, userService);
            try {
                const passwordHash = authService.hashPassword('admin');
                const admin = userService.createUser('admin', passwordHash, true);
                document.getElementById('result').innerHTML = 
                    '<p style="color: green;">Admin criado com sucesso!</p>' +
                    '<p>Username: admin</p>' +
                    '<p>Password: admin</p>' +
                    '<p><strong>Altere a senha após o primeiro login!</strong></p>';
            } catch (error) {
                document.getElementById('result').innerHTML = 
                    '<p style="color: red;">Erro: ' + error.message + '</p>';
            }
        }
    </script>
</body>
</html>
```

Salve como `setup-admin.html`, abra no navegador, clique no botão e depois delete o arquivo.

## 🚀 Deploy no GitHub Pages

### 📖 Guia Completo de Deploy

Para instruções detalhadas sobre como configurar o deploy automático com GitHub Actions, consulte:

**[📘 Guia de Deploy com GitHub Actions](.github/DEPLOYMENT.md)**

Este guia inclui:
- Passo a passo para configurar secrets
- Como testar o deploy
- Troubleshooting de problemas comuns
- Boas práticas de segurança

### ⚠️ Importante: Segurança da API Key

A API key do TMDB **NÃO DEVE** ser exposta publicamente no código. Para hospedar no GitHub Pages com segurança, usamos **GitHub Actions** com **Secrets**.

### Passo 1: Obter API Key do TMDB

1. Acesse [https://www.themoviedb.org/settings/api](https://www.themoviedb.org/settings/api)
2. Crie uma conta se ainda não tiver
3. Solicite uma API Key (escolha a opção "Developer")
4. Copie sua **API Key (v3 auth)**

### Passo 2: Configurar Secrets no GitHub

Para fazer deploy seguro no GitHub Pages, você precisa configurar secrets para suas credenciais:

1. Vá no seu repositório no GitHub
2. Clique em **Settings** → **Secrets and variables** → **Actions**
3. Adicione os seguintes secrets:

#### Secret 1: TMDB_API_KEY
- Clique em **New repository secret**
- **Name**: `TMDB_API_KEY`
- **Secret**: Cole sua API key do TMDB
- Clique em **Add secret**

#### Secret 2: TMDB_READ_ACCESS_TOKEN
- Clique em **New repository secret**
- **Name**: `TMDB_READ_ACCESS_TOKEN`
- **Secret**: Cole seu Read Access Token do TMDB (também chamado de "API Read Access Token (v4 auth)")
- Clique em **Add secret**

#### Secret 3: GOOGLE_SHEETS_SCRIPT_ID
- Clique em **New repository secret**
- **Name**: `GOOGLE_SHEETS_SCRIPT_ID`
- **Secret**: Cole apenas o ID do script (a parte entre `/s/` e `/exec` da URL)
  - Exemplo: Se sua URL é `https://script.google.com/macros/s/ABC123XYZ/exec`
  - Cole apenas: `ABC123XYZ`
- Clique em **Add secret**

### Passo 3: Habilitar GitHub Pages

1. Vá em **Settings** → **Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Salve as configurações

### Passo 4: Deploy Automático

O arquivo `.github/workflows/deploy.yml` já está configurado. Quando você fizer push para a branch `main`:

1. O GitHub Actions irá automaticamente:
   - ✅ Instalar dependências
   - ✅ Executar todos os testes
   - ✅ Criar o arquivo `config.js` com suas credenciais (de forma segura):
     - API key do TMDB
     - Read Access Token do TMDB
     - URL do Google Sheets Web App
   - ✅ Fazer deploy no GitHub Pages

2. Aguarde alguns minutos e acesse: `https://seu-usuario.github.io/letterboxd-manager/`

### Passo 5: Testar o Deploy

Para testar se o deploy automático está funcionando:

1. Faça uma pequena alteração no código (ex: adicione um comentário no README)
2. Commit e push para a branch `main`:
   ```bash
   git add .
   git commit -m "test: verificar deploy automático"
   git push origin main
   ```
3. Vá para a aba **Actions** no seu repositório GitHub
4. Você verá o workflow "Deploy to GitHub Pages" em execução
5. Aguarde a conclusão (ícone verde ✓)
6. Acesse sua URL do GitHub Pages para verificar as mudanças

**Nota**: Você também pode testar em uma branch separada (como `develop`) antes de fazer merge para `main`. O deploy só acontece quando você faz push para `main`.

Se houver erros:
- Verifique se todos os secrets foram configurados corretamente
- Verifique os logs do workflow na aba Actions
- Certifique-se de que o GitHub Pages está habilitado nas configurações

### Como Funciona a Segurança

- ✅ Todas as credenciais ficam armazenadas como **Secrets** no GitHub (criptografadas)
- ✅ O código-fonte no repositório **nunca** contém credenciais reais
- ✅ O GitHub Actions injeta as credenciais apenas durante o build
- ✅ Apenas você (dono do repositório) tem acesso aos Secrets
- ✅ O arquivo `config.js` é gerado automaticamente no deploy

### Opção Alternativa: Deploy Manual (Não Recomendado)

Se preferir não usar GitHub Actions, você pode fazer deploy manual, mas **NUNCA** commite o arquivo `config.js` com sua API key:

1. Crie uma branch `gh-pages`
2. Adicione o `config.js` manualmente após o deploy
3. Configure GitHub Pages para usar a branch `gh-pages`

⚠️ **Esta opção é menos segura e não recomendada!**

## 📁 Estrutura do Projeto

```
letterboxd-manager/
│
├── index.html              # Página principal (login e listagem de filmes)
├── admin.html              # Página de administração de usuários
├── test-admin.html         # Página de teste para admin
├── test-notifications.html # Página de teste para notificações
│
├── css/
│   └── styles.css          # Estilos da aplicação
│
├── js/
│   ├── app.js              # Lógica principal da aplicação
│   ├── app.test.js         # Testes do app.js
│   ├── admin.js            # Lógica da página de administração
│   ├── auth.js             # Serviço de autenticação
│   ├── auth.test.js        # Testes de autenticação
│   ├── users.js            # Serviço de gerenciamento de usuários
│   ├── users.test.js       # Testes de usuários
│   ├── films.js            # Serviço de integração com TMDB
│   ├── films.test.js       # Testes de filmes
│   ├── list.js             # Serviço de lista compartilhada e filmes assistidos
│   ├── list.test.js        # Testes de lista
│   ├── tabs.js             # Serviço de navegação entre abas
│   ├── tabs.test.js        # Testes de abas
│   ├── filters.js          # Serviço de filtros
│   ├── filters.test.js     # Testes de filtros
│   ├── modal.test.js       # Testes de modal de detalhes
│   ├── storage.js          # Gerenciador de localStorage
│   ├── storage.test.js     # Testes de storage
│   └── notifications.js    # Sistema de notificações
│
├── config.example.js       # Template de configuração
├── config.js               # Configuração (não commitado)
├── .gitignore              # Arquivos ignorados pelo Git
├── package.json            # Dependências e scripts
└── README.md               # Este arquivo
```

### Descrição dos Módulos

#### Frontend (UI)
- **index.html**: Interface principal com login, listagem de filmes e lista compartilhada
- **admin.html**: Interface de administração para gerenciar usuários
- **css/styles.css**: Estilos responsivos e modernos

#### Business Logic
- **auth.js**: Autenticação, hashing de senhas, gerenciamento de sessões
- **users.js**: CRUD de usuários, validação de dados
- **films.js**: Integração com TMDB API, busca e listagem de filmes, mapeamento de gêneros
- **list.js**: Gerenciamento da lista compartilhada, filmes assistidos, prevenção de duplicatas
- **tabs.js**: Navegação entre abas (Explorar, Lista Compartilhada, Assistidos)
- **filters.js**: Sistema de filtros por gênero, nome e ordenação aleatória
- **notifications.js**: Sistema de feedback visual (toast notifications)

#### Data Layer
- **storage.js**: Abstração do localStorage com serialização/deserialização

#### Application Controllers
- **app.js**: Controlador principal, gerencia navegação e interações
- **admin.js**: Controlador da página de administração

## 🧪 Testes

A aplicação possui cobertura de testes com Jest e fast-check (property-based testing).

### Executar Todos os Testes

```bash
npm test
```

### Executar Testes em Modo Watch

```bash
npm run test:watch
```

### Tipos de Testes

1. **Testes Unitários**: Verificam funcionalidades específicas
2. **Testes de Propriedade (PBT)**: Verificam propriedades universais com dados aleatórios

Exemplo de propriedade testada:
- **Property 1**: Para qualquer usuário criado, ele deve existir no storage e ser recuperável
- **Property 13**: Para qualquer filme, quando adicionado duas vezes, apenas uma entrada deve existir

## 💻 Uso

### Login

1. Acesse `index.html`
2. Digite suas credenciais
3. Clique em **Login**

### Sistema de Abas

A interface principal está organizada em três abas para facilitar a navegação:

#### 1. Aba "Explorar Filmes"
- Visualize filmes populares e em alta do TMDB
- Navegue entre páginas usando os controles de paginação
- Clique em qualquer filme para ver detalhes completos
- Adicione filmes à lista compartilhada diretamente da listagem ou do modal de detalhes

#### 2. Aba "Lista Compartilhada"
- Veja todos os filmes adicionados pelo grupo
- Cada entrada mostra quem adicionou e quando
- Use o sistema de filtros para encontrar filmes específicos
- Marque filmes como assistidos quando o grupo assistir

#### 3. Aba "Filmes Assistidos"
- Histórico completo de filmes assistidos pelo grupo
- Veja as avaliações dadas durante a noite de filme
- Consulte quem avaliou e quando foi assistido
- Adicione notas opcionais sobre a experiência

### Visualizar Filmes

1. Após o login, você verá filmes populares na aba "Explorar Filmes"
2. Use as abas **Popular** e **Trending** para alternar entre categorias
3. Use a busca para encontrar filmes específicos
4. Navegue entre páginas usando os botões "Anterior" e "Próximo"
5. Clique em qualquer filme para ver detalhes completos incluindo sinopse

### Modal de Detalhes do Filme

Ao clicar em um filme, você verá:
- Pôster em tamanho maior
- Título e ano de lançamento
- Sinopse completa
- Gêneros (nomes legíveis)
- Avaliação do TMDB
- Botão para adicionar à lista compartilhada
- Botão para fechar o modal

### Adicionar à Lista

1. Clique em **Adicionar à Lista** em qualquer filme (na listagem ou no modal)
2. O filme será adicionado com seu nome de usuário e timestamp
3. Você verá uma notificação de sucesso
4. O sistema previne duplicatas automaticamente

### Sistema de Filtros na Lista Compartilhada

A aba "Lista Compartilhada" possui um sistema completo de filtros:

#### Filtro por Gênero
- Selecione um gênero no dropdown
- Apenas filmes daquele gênero serão exibidos
- Combine com outros filtros para refinar a busca

#### Filtro por Nome
- Digite parte do título do filme no campo de busca
- A lista é filtrada em tempo real
- Busca case-insensitive

#### Ordenação Aleatória
- Clique no botão "Aleatório" para embaralhar a lista
- Útil para escolher o próximo filme para assistir
- Pode ser combinado com outros filtros

#### Filtros Combinados
- Todos os filtros podem ser usados simultaneamente
- Exemplo: Filtre por gênero "Ação" e busque por "Matrix"
- Os resultados atendem a todos os critérios selecionados

#### Limpar Filtros
- Clique em "Limpar Filtros" para remover todos os filtros
- A lista completa será exibida novamente

### Marcar Filmes como Assistidos

Quando o grupo assistir a um filme da lista:

1. Na aba "Lista Compartilhada", clique em **Marcar como Assistido** no filme
2. Um prompt aparecerá solicitando uma avaliação (ex: 1-5 estrelas ou 1-10)
3. Opcionalmente, adicione notas sobre a experiência
4. O filme será movido para a aba "Filmes Assistidos"
5. O filme será removido da lista compartilhada automaticamente

### Visualizar Filmes Assistidos

Na aba "Filmes Assistidos":
- Veja o histórico completo de filmes assistidos
- Cada entrada mostra:
  - Informações do filme (pôster, título, gêneros)
  - Avaliação dada pelo grupo
  - Quem registrou a avaliação
  - Data em que foi assistido
  - Notas opcionais sobre a experiência

### Visualizar Lista Compartilhada

1. Acesse a aba **Lista Compartilhada**
2. Veja todos os filmes adicionados por todos os usuários
3. Veja quem adicionou e quando
4. Use os filtros para encontrar filmes específicos

### Atalhos de Teclado

A aplicação oferece atalhos de teclado para facilitar a navegação:

| Tecla | Ação | Descrição |
|-------|------|-----------|
| **ESC** | Fechar modais | Fecha qualquer modal aberto (detalhes do filme ou avaliação) |
| **/** | Focar busca | Move o foco para o campo de busca de filmes |

**Dicas:**
- Os atalhos funcionam em qualquer momento durante o uso da aplicação
- O atalho **ESC** funciona mesmo quando você está digitando em campos de texto
- O atalho **/** seleciona automaticamente o texto no campo de busca para facilitar a substituição
- Indicadores visuais dos atalhos estão presentes na interface (ex: placeholder do campo de busca)

### Administração (apenas Admin)

1. Clique em **Admin** no menu (apenas visível para admins)
2. Adicione novos usuários com o formulário
3. Edite ou remova usuários existentes
4. Defina privilégios de administrador

## 🔧 Desenvolvimento

### Adicionar Novas Funcionalidades

1. Crie ou modifique arquivos na pasta `js/`
2. Adicione testes correspondentes em `js/*.test.js`
3. Execute os testes: `npm test`
4. Atualize a documentação se necessário

### Boas Práticas

- Sempre teste suas alterações
- Mantenha o código modular e separado por responsabilidade
- Use o sistema de notificações para feedback ao usuário
- Valide inputs do usuário
- Trate erros de API adequadamente

### Debugging

Use o console do navegador para debug:

```javascript
// Ver todos os usuários
const userService = new UserService();
console.log(userService.getAllUsers());

// Ver lista compartilhada
const listService = new ListService();
console.log(listService.getSharedList());

// Limpar dados (cuidado!)
const storage = new StorageManager();
storage.clear();
```

## 📝 Licença

Este projeto é de uso privado e educacional.

## 🤝 Contribuindo

Como este é um projeto privado, contribuições são limitadas aos membros autorizados.

## 📧 Suporte

Para questões ou problemas, abra uma issue no repositório do GitHub.

---

**Desenvolvido com ❤️ para gerenciar listas de filmes com amigos**
