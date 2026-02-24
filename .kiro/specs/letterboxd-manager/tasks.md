# Implementation Plan - Letterboxd Manager

- [x] 1. Configurar estrutura básica do projeto
  - Criar estrutura de diretórios (css/, js/)
  - Criar arquivos HTML base (index.html, admin.html)
  - Criar arquivo de configuração de exemplo (config.example.js)
  - Configurar .gitignore para excluir config.js
  - _Requirements: 7.1, 7.2_

- [x] 2. Implementar módulo de Storage
  - Criar StorageManager para abstrair operações de localStorage
  - Implementar métodos save, load, remove, clear
  - Adicionar serialização/deserialização de dados
  - _Requirements: 7.5_

- [x] 2.1 Escrever testes unitários para StorageManager
  - Testar operações básicas de CRUD
  - Testar serialização de objetos complexos
  - _Requirements: 7.5_

- [x] 3. Implementar sistema de autenticação
  - Criar AuthService com métodos de login/logout
  - Implementar hashing de senhas com bcrypt.js
  - Implementar verificação de sessão
  - Implementar verificação de privilégios de admin
  - _Requirements: 1.5, 2.1, 2.2, 2.3, 2.4_

- [x] 3.1 Escrever teste de propriedade para hashing de senhas
  - **Property 4: Password hashing security**
  - **Validates: Requirements 1.5**

- [x] 3.2 Escrever teste de propriedade para autenticação válida
  - **Property 5: Valid authentication success**
  - **Validates: Requirements 2.1**

- [x] 3.3 Escrever teste de propriedade para rejeição de credenciais inválidas
  - **Property 6: Invalid authentication rejection**
  - **Validates: Requirements 2.2**

- [x] 3.4 Escrever teste de propriedade para persistência de sessão
  - **Property 7: Session persistence**
  - **Validates: Requirements 2.3**

- [x] 3.5 Escrever teste de propriedade para proteção de rotas
  - **Property 8: Protected route authentication**
  - **Validates: Requirements 2.4**

- [x] 3.6 Escrever testes unitários para AuthService
  - Testar casos específicos de login/logout
  - Testar timeout de sessão
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implementar gerenciamento de usuários
  - Criar UserService com operações CRUD
  - Implementar createUser, updateUser, deleteUser, getAllUsers
  - Adicionar validação de dados de usuário
  - Integrar com StorageManager
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 4.1 Escrever teste de propriedade para criação de usuários
  - **Property 1: User creation persistence**
  - **Validates: Requirements 1.2**

- [x] 4.2 Escrever teste de propriedade para deleção de usuários
  - **Property 2: User deletion completeness**
  - **Validates: Requirements 1.3**

- [x] 4.3 Escrever teste de propriedade para atualização de usuários
  - **Property 3: User update correctness**
  - **Validates: Requirements 1.4**

- [x] 4.4 Escrever testes unitários para UserService
  - Testar validação de username duplicado
  - Testar validação de campos vazios
  - _Requirements: 1.2, 1.3, 1.4_

- [x] 5. Implementar interface de administração
  - Implementar admin.js para gerenciar a interface de admin
  - Conectar formulário de adicionar usuário ao UserService
  - Implementar listagem dinâmica de usuários na tabela
  - Implementar funcionalidade de editar usuário (modal ou inline)
  - Implementar funcionalidade de remover usuário com confirmação
  - Adicionar proteção de rota para verificar privilégios de admin
  - Adicionar feedback visual para operações (sucesso/erro)
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 5.1 Escrever teste de exemplo para exibição da interface de admin
  - Verificar que elementos de gerenciamento estão presentes
  - _Requirements: 1.1_

- [x] 6. Implementar integração com TMDB API
  - Criar FilmService para comunicação com TMDB API
  - Implementar método searchFilms para buscar filmes por título
  - Implementar método getFilmDetails para detalhes de um filme
  - Implementar método getPopularFilms para listagem de filmes populares
  - Implementar método getTrendingFilms para filmes em alta
  - Implementar tratamento de erros de API (network, 404, 500, etc)
  - Carregar configuração de API key do TMDB do config.js
  - Adicionar headers de autenticação nas requisições (Bearer token)
  - Implementar parsing de respostas da API para o modelo Film
  - _Requirements: 3.1, 3.4, 3.5_

- [x] 6.1 Escrever teste de propriedade para parsing de dados de filmes
  - **Property 9: Film data parsing completeness**
  - **Validates: Requirements 3.4**

- [x] 6.2 Escrever teste de exemplo para tratamento de erro de API
  - Verificar mensagem de erro quando API está indisponível
  - _Requirements: 3.5_

- [x] 6.3 Escrever testes unitários para FilmService
  - Testar parsing de respostas da API
  - Testar tratamento de respostas malformadas
  - _Requirements: 3.4_

- [x] 7. Criar interface de listagem de filmes
  - Adicionar seção de listagem de filmes no index.html
  - Implementar renderização de cards de filmes no app.js
  - Exibir pôster, título, nota e gênero em cada card
  - Adicionar botão "Adicionar à Lista" em cada filme
  - Implementar busca de filmes por título
  - Adicionar tabs ou botões para alternar entre Popular e Trending
  - Adicionar estilos CSS para os cards de filmes
  - _Requirements: 3.2, 3.3, 4.1_

- [x] 7.1 Escrever teste de propriedade para exibição completa de filmes
  - **Property 10: Film display completeness**
  - **Validates: Requirements 3.2**

- [x] 7.2 Escrever teste de propriedade para disponibilidade de opção de adicionar
  - **Property 11: Add option availability**
  - **Validates: Requirements 4.1**

- [x] 7.3 Escrever teste de exemplo para acesso à página de listagem
  - Verificar que API é chamada ao acessar página
  - _Requirements: 3.1_

- [x] 8. Implementar gerenciamento da lista compartilhada
  - Criar ListService para gerenciar lista compartilhada
  - Implementar addFilmToList com registro de userId, username e timestamp
  - Implementar getSharedList para recuperar todas as entradas
  - Implementar removeFilmFromList para remover entradas
  - Implementar isFilmInList para verificar duplicatas
  - Implementar prevenção de duplicatas (verificar por filmId)
  - Integrar com StorageManager para persistência
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 8.1 Escrever teste de propriedade para armazenamento completo de entradas
  - **Property 12: Film entry storage completeness**
  - **Validates: Requirements 4.2, 4.3, 4.4**

- [x] 8.2 Escrever teste de propriedade para prevenção de duplicatas
  - **Property 13: Duplicate prevention**
  - **Validates: Requirements 4.5**

- [x] 8.3 Escrever testes unitários para ListService
  - Testar adição de filme com dados completos
  - Testar comportamento com lista vazia
  - _Requirements: 4.2, 4.3, 4.4, 4.5_

- [x] 9. Criar interface de visualização da lista compartilhada
  - Adicionar seção de lista compartilhada no index.html
  - Implementar renderização de entradas da lista no app.js
  - Exibir informações do filme (pôster, título, nota, gênero)
  - Exibir metadados (usuário que adicionou, timestamp formatado)
  - Adicionar botão para remover filme da lista (opcional)
  - Adicionar estilos CSS para lista compartilhada
  - Implementar mensagem para lista vazia
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 9.1 Escrever teste de propriedade para exibição completa da lista
  - **Property 14: List display completeness**
  - **Validates: Requirements 5.1**

- [x] 9.2 Escrever teste de propriedade para exibição completa de entradas
  - **Property 15: Entry display completeness**
  - **Validates: Requirements 5.2, 5.3, 5.4**

- [x] 9.3 Escrever teste de exemplo para lista vazia
  - Verificar mensagem apropriada quando lista está vazia
  - _Requirements: 5.5_

- [x] 10. Implementar tela de login
  - Adicionar formulário de login no index.html (exibido quando não autenticado)
  - Implementar lógica de login no app.js
  - Implementar validação de credenciais via AuthService
  - Implementar redirecionamento após login bem-sucedido
  - Adicionar mensagens de erro para credenciais inválidas
  - Adicionar estilos CSS para tela de login
  - _Requirements: 2.1, 2.2_

- [x] 11. Integrar proteção de rotas
  - Implementar verificação de autenticação no app.js ao carregar páginas
  - Redirecionar usuários não autenticados para tela de login
  - Proteger admin.html para apenas usuários com isAdmin=true
  - Adicionar botão de logout no header
  - Implementar lógica de logout que limpa sessão e redireciona
  - _Requirements: 2.4_

- [x] 12. Adicionar tratamento de erros e feedback visual
  - Implementar sistema de notificações (toast/alert) para feedback
  - Adicionar mensagens de erro para falhas de API do TMDB
  - Adicionar loading states (spinners) durante operações assíncronas
  - Implementar notificações de sucesso para ações do usuário (adicionar filme, criar usuário, etc)
  - Adicionar estilos CSS para notificações e loading states
  - _Requirements: 3.5_

- [x] 13. Otimizar performance e finalizar estilos
  - Implementar lazy loading para imagens de pôsteres de filmes
  - Adicionar cache simples para respostas da API do TMDB (em memória ou localStorage)
  - Otimizar leituras/escritas no localStorage (batch operations se necessário)
  - Finalizar estilos CSS (cores, tipografia, layout)
  - Adicionar responsividade para mobile
  - _Requirements: 6.3_

- [x] 14. Checkpoint final - Garantir que todos os testes passam
  - Executar todos os testes com `npm test`
  - Verificar que não há erros de console no browser
  - Testar fluxo completo: login → visualizar filmes → adicionar à lista → visualizar lista → admin
  - Perguntar ao usuário se há dúvidas ou problemas

- [x] 15. Criar documentação e setup inicial
  - Escrever README.md com instruções de setup
  - Documentar como obter e configurar API key do TMDB (https://www.themoviedb.org/settings/api)
  - Adicionar instruções de como copiar config.example.js para config.js
  - Adicionar instruções de deploy no GitHub Pages
  - Criar script ou instruções para criar usuário admin padrão no primeiro acesso
  - Documentar estrutura do projeto e arquitetura
  - _Requirements: 6.2_

- [x] 16. Implementar sistema de abas na interface principal
  - Criar módulo tabs.js para gerenciar navegação entre abas
  - Adicionar três abas no index.html: Explorar Filmes, Lista Compartilhada, Filmes Assistidos
  - Implementar lógica de alternância entre abas
  - Adicionar estilos CSS para abas (ativa/inativa)
  - Implementar persistência do estado da aba ativa
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 16.1 Escrever teste de propriedade para alternância de aba de lista compartilhada
  - **Property 16: Tab switching to shared list**
  - **Validates: Requirements 7.2**

- [x] 16.2 Escrever teste de propriedade para alternância de aba de explorar filmes
  - **Property 17: Tab switching to explore films**
  - **Validates: Requirements 7.3**

- [x] 16.3 Escrever teste de propriedade para persistência de estado da aba
  - **Property 18: Active tab state persistence**
  - **Validates: Requirements 7.4**

- [x] 16.4 Escrever teste de exemplo para exibição de abas
  - Verificar que as três abas estão presentes na interface
  - _Requirements: 7.1_

- [x] 17. Implementar modal de detalhes do filme
  - Adicionar estrutura HTML para modal de detalhes no index.html
  - Implementar função para exibir modal ao clicar em um filme
  - Exibir sinopse completa do filme no modal
  - Exibir pôster, título, nota, gêneros e ano no modal
  - Adicionar botão de fechar modal
  - Adicionar botão de adicionar à lista no modal
  - Adicionar estilos CSS para o modal (overlay, animações)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 17.1 Escrever teste de propriedade para exibição de modal de detalhes
  - **Property 19: Film detail view display**
  - **Validates: Requirements 8.1**

- [x] 17.2 Escrever teste de propriedade para exibição de sinopse
  - **Property 20: Synopsis display in details**
  - **Validates: Requirements 8.2**

- [x] 17.3 Escrever teste de propriedade para exibição completa de detalhes
  - **Property 21: Complete film details display**
  - **Validates: Requirements 8.3**

- [x] 17.4 Escrever testes de exemplo para botões do modal
  - Verificar que botão de fechar está presente
  - Verificar que botão de adicionar está presente
  - _Requirements: 8.4, 8.5_

- [x] 18. Implementar mapeamento de gêneros
  - Adicionar mapeamento de IDs de gênero do TMDB para nomes em films.js
  - Implementar método getGenreName no FilmService
  - Implementar método getGenreNames para múltiplos gêneros
  - Atualizar renderização de filmes para exibir nomes de gêneros
  - Atualizar modal de detalhes para exibir nomes de gêneros
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 18.1 Escrever teste de propriedade para mapeamento de ID para nome
  - **Property 22: Genre ID to name mapping**
  - **Validates: Requirements 9.1**

- [x] 18.2 Escrever teste de propriedade para exibição de nomes de gêneros
  - **Property 23: Genre names display**
  - **Validates: Requirements 9.2**

- [x] 18.3 Escrever teste de propriedade para exibição de múltiplos gêneros
  - **Property 24: Multiple genres display**
  - **Validates: Requirements 9.3**

- [x] 19. Implementar paginação na aba de explorar filmes
  - Atualizar FilmService para suportar parâmetro de página
  - Adicionar controles de navegação (anterior/próximo) no HTML
  - Implementar lógica de navegação entre páginas
  - Exibir número da página atual e total de páginas
  - Desabilitar botão "anterior" na primeira página
  - Desabilitar botão "próximo" na última página
  - Adicionar estilos CSS para controles de paginação
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

- [x] 19.1 Escrever teste de propriedade para limite de filmes por página
  - **Property 25: Page size limit**
  - **Validates: Requirements 10.1**

- [x] 19.2 Escrever teste de propriedade para navegação entre páginas
  - **Property 26: Page navigation**
  - **Validates: Requirements 10.3**

- [x] 19.3 Escrever teste de propriedade para exibição de informações de paginação
  - **Property 27: Pagination info display**
  - **Validates: Requirements 10.6**

- [x] 19.4 Escrever testes de exemplo para controles de paginação
  - Verificar que controles de navegação estão presentes
  - Verificar desabilitação de botões nas extremidades
  - _Requirements: 10.2, 10.4, 10.5_

- [x] 20. Implementar sistema de filtros na lista compartilhada
  - Criar módulo filters.js para lógica de filtros
  - Adicionar controles de filtro no HTML da aba de lista compartilhada
  - Implementar filtro por gênero (dropdown ou tags)
  - Implementar filtro por nome (campo de busca)
  - Implementar ordenação aleatória
  - Implementar lógica de filtros combinados
  - Implementar botão para limpar todos os filtros
  - Atualizar ListService com métodos de filtro
  - Adicionar estilos CSS para controles de filtro
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [x] 20.1 Escrever teste de propriedade para filtro por gênero
  - **Property 28: Genre filter**
  - **Validates: Requirements 11.2**

- [x] 20.2 Escrever teste de propriedade para filtro por nome
  - **Property 29: Name filter**
  - **Validates: Requirements 11.3**

- [x] 20.3 Escrever teste de propriedade para ordenação aleatória
  - **Property 30: Random filter**
  - **Validates: Requirements 11.4**

- [x] 20.4 Escrever teste de propriedade para filtros combinados
  - **Property 31: Combined filters**
  - **Validates: Requirements 11.5**

- [x] 20.5 Escrever teste de propriedade para limpar filtros
  - **Property 32: Clear filters**
  - **Validates: Requirements 11.6**

- [x] 20.6 Escrever teste de exemplo para exibição de controles de filtro
  - Verificar que controles de filtro estão presentes na interface
  - _Requirements: 11.1_

- [x] 21. Implementar aba de filmes assistidos
  - Adicionar estrutura HTML para aba de filmes assistidos
  - Implementar funcionalidade de marcar filme como assistido
  - Implementar prompt para avaliação ao marcar como assistido
  - Adicionar campo de notas opcional
  - Implementar remoção do filme da lista compartilhada ao marcar como assistido
  - Implementar renderização de filmes assistidos com avaliações
  - Exibir quem avaliou e quando foi assistido
  - Adicionar estilos CSS para lista de filmes assistidos
  - Atualizar ListService com métodos para filmes assistidos
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 21.1 Escrever teste de propriedade para transição de filme para assistido
  - **Property 33: Mark as watched transition**
  - **Validates: Requirements 12.2, 12.6**

- [x] 21.2 Escrever teste de propriedade para prompt de avaliação
  - **Property 34: Rating prompt**
  - **Validates: Requirements 12.3**

- [x] 21.3 Escrever teste de propriedade para exibição de avaliação
  - **Property 35: Watched film rating display**
  - **Validates: Requirements 12.4**

- [x] 21.4 Escrever teste de propriedade para exibição de metadados de filme assistido
  - **Property 36: Watched film metadata display**
  - **Validates: Requirements 12.5**

- [x] 21.5 Escrever teste de exemplo para exibição da aba de filmes assistidos
  - Verificar que aba de filmes assistidos está presente
  - _Requirements: 12.1_

- [x] 22. Checkpoint - Garantir que todos os novos testes passam
  - Executar todos os testes com `npm test`
  - Verificar que não há erros de console no browser
  - Testar fluxo completo das novas funcionalidades
  - Perguntar ao usuário se há dúvidas ou problemas

- [x] 23. Atualizar documentação com novas funcionalidades
  - Atualizar README.md com descrição das novas abas
  - Documentar sistema de filtros
  - Documentar funcionalidade de filmes assistidos
  - Adicionar screenshots ou GIFs demonstrativos (opcional)
  - _Requirements: 7.1, 11.1, 12.1_

- [x] 24. Implementar controle de acesso para marcar filmes como assistidos
  - Atualizar ListService.markAsWatched para verificar privilégios de admin
  - Adicionar validação no UI para ocultar/desabilitar botão de marcar como assistido para não-admins
  - Adicionar mensagem de erro quando não-admin tenta marcar como assistido
  - _Requirements: 12.8_

- [x] 24.1 Escrever teste de propriedade para controle de acesso de marcar como assistido
  - **Property 37: Admin-only mark as watched**
  - **Validates: Requirements 12.8**

- [x] 25. Atualizar sistema de avaliação para usar escala de 1-5 estrelas
  - Atualizar prompt de avaliação para usar estrelas (1-5)
  - Criar componente visual de estrelas para exibição
  - Atualizar renderização de filmes assistidos para mostrar estrelas
  - Atualizar validação para aceitar apenas valores de 1 a 5
  - _Requirements: 12.7_

- [x] 26. Implementar sistema de reviews para filmes assistidos
  - Atualizar modelo WatchedFilm para usar "review" ao invés de "notes"
  - Atualizar prompt ao marcar como assistido para solicitar review
  - Atualizar renderização de filmes assistidos para exibir review
  - Adicionar campo de texto para review no modal/prompt
  - _Requirements: 12.3, 12.4_

- [x] 27. Implementar edição de avaliações e reviews pelo Admin
  - Adicionar botões de editar rating e review na interface de filmes assistidos (apenas para admin)
  - Implementar método updateWatchedRating no ListService
  - Implementar método updateWatchedReview no ListService
  - Criar modal/form para editar rating (com estrelas)
  - Criar modal/form para editar review (campo de texto)
  - Adicionar validação de privilégios de admin
  - _Requirements: 13.1, 13.2, 13.3, 13.4_

- [x] 27.1 Escrever teste de propriedade para opção de editar rating
  - **Property 38: Admin edit rating option availability**
  - **Validates: Requirements 13.1**

- [x] 27.2 Escrever teste de propriedade para opção de editar review
  - **Property 39: Admin edit review option availability**
  - **Validates: Requirements 13.2**

- [x] 27.3 Escrever teste de propriedade para persistência de atualização de rating
  - **Property 40: Rating update persistence**
  - **Validates: Requirements 13.3**

- [x] 27.4 Escrever teste de propriedade para persistência de atualização de review
  - **Property 41: Review update persistence**
  - **Validates: Requirements 13.4**

- [x] 28. Implementar remoção de filmes da lista de assistidos pelo Admin
  - Adicionar botão de remover na interface de filmes assistidos (apenas para admin)
  - Implementar método removeFromWatched no ListService
  - Adicionar confirmação antes de remover
  - Adicionar validação de privilégios de admin
  - Atualizar UI após remoção
  - _Requirements: 13.5, 13.6_

- [x] 28.1 Escrever teste de propriedade para opção de remover filme assistido
  - **Property 42: Admin remove option availability**
  - **Validates: Requirements 13.5**

- [x] 28.2 Escrever teste de propriedade para remoção completa de filme assistido
  - **Property 43: Watched film removal completeness**
  - **Validates: Requirements 13.6**

- [x] 28.3 Escrever teste de propriedade para prevenção de edição por não-admin
  - **Property 44: Non-admin edit prevention**
  - **Validates: Requirements 13.7**

- [x] 29. Corrigir funcionamento dos filtros na lista compartilhada
  - Corrigir filtro por gênero para atualizar imediatamente ao selecionar
  - Modificar ordenação aleatória para gerar nova ordem a cada clique (não toggle)
  - Adicionar contador de filmes filtrados
  - Garantir que filtros sejam aplicados corretamente em combinação
  - Adicionar persistência de estado dos filtros
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 29.1 Escrever teste de propriedade para atualização imediata de filtros
  - **Property 45: Filter immediate update**
  - **Validates: Requirements 14.1**

- [x] 29.2 Escrever teste de propriedade para variação de ordem aleatória
  - **Property 46: Random order variation**
  - **Validates: Requirements 14.2**

- [x] 29.3 Escrever teste de propriedade para persistência de estado de filtro
  - **Property 47: Filter state persistence**
  - **Validates: Requirements 14.3**

- [x] 29.4 Escrever teste de propriedade para precisão de contagem filtrada
  - **Property 48: Filtered count accuracy**
  - **Validates: Requirements 14.4**

- [x] 30. Implementar filtros na aba de filmes assistidos
  - Adicionar controles de filtro na aba de filmes assistidos (mesmos da lista compartilhada)
  - Atualizar métodos de filtro no ListService para aceitar lista como parâmetro
  - Implementar filtro por gênero para filmes assistidos
  - Implementar filtro por nome para filmes assistidos
  - Implementar ordenação aleatória para filmes assistidos
  - Implementar filtros combinados para filmes assistidos
  - Implementar botão de limpar filtros para filmes assistidos
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

- [x] 30.1 Escrever teste de exemplo para exibição de filtros em filmes assistidos
  - Verificar que controles de filtro estão presentes na aba de filmes assistidos
  - _Requirements: 15.1_

- [x] 30.2 Escrever teste de propriedade para filtro por gênero em filmes assistidos
  - **Property 49: Watched films genre filter**
  - **Validates: Requirements 15.2**

- [x] 30.3 Escrever teste de propriedade para filtro por nome em filmes assistidos
  - **Property 50: Watched films name filter**
  - **Validates: Requirements 15.3**

- [x] 30.4 Escrever teste de propriedade para ordem aleatória em filmes assistidos
  - **Property 51: Watched films random order**
  - **Validates: Requirements 15.4**

- [x] 30.5 Escrever teste de propriedade para filtros combinados em filmes assistidos
  - **Property 52: Watched films combined filters**
  - **Validates: Requirements 15.5**

- [x] 30.6 Escrever teste de propriedade para limpar filtros em filmes assistidos
  - **Property 53: Watched films clear filters**
  - **Validates: Requirements 15.6**

- [x] 31. Atualizar botão de adicionar para ser dinâmico (adicionar/remover)
  - Atualizar renderização de filmes para verificar se filme está na lista
  - Mudar texto do botão de "Adicionar à Lista" para "Retirar da Lista" quando filme já está na lista
  - Atualizar funcionalidade do botão para remover filme da lista quando já está adicionado
  - Atualizar estado do botão imediatamente após adicionar/remover
  - Adicionar indicação visual clara do estado (cor, ícone, etc)
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [x] 31.1 Escrever teste de propriedade para estado do botão de filmes na lista
  - **Property 54: Button state for listed films**
  - **Validates: Requirements 16.1**

- [x] 31.2 Escrever teste de propriedade para funcionalidade do botão remover
  - **Property 55: Remove button functionality**
  - **Validates: Requirements 16.2**

- [x] 31.3 Escrever teste de propriedade para estado do botão após remoção
  - **Property 56: Button state after removal**
  - **Validates: Requirements 16.3**

- [x] 31.4 Escrever teste de propriedade para indicação visual de filmes na lista
  - **Property 57: Visual indication of listed films**
  - **Validates: Requirements 16.4**

- [x] 31.5 Escrever teste de propriedade para atualização imediata do estado do botão
  - **Property 58: Immediate button state update**
  - **Validates: Requirements 16.5**

- [x] 32. Corrigir busca de sinopse (overview) da API do TMDB
  - Verificar se o campo "overview" está sendo incluído nas requisições à API
  - Atualizar parsing de filmes para garantir que overview seja extraído
  - Atualizar modelo Film para garantir que overview seja armazenado
  - Verificar exibição de overview no modal de detalhes
  - Adicionar tratamento para quando overview estiver vazio
  - _Requirements: 3.4, 3.6, 8.2, 8.6_

- [x] 32.1 Escrever teste unitário para verificar extração de overview
  - Testar que overview é extraído corretamente da resposta da API
  - Testar tratamento de overview vazio
  - _Requirements: 3.4, 3.6_

- [x] 33. Corrigir teste falhando em list.test.js
  - Corrigir Property 40 (Rating update persistence) que está falhando quando initialRating e newRating são iguais
  - O teste precisa garantir que initialRating e newRating sejam diferentes
  - Executar todos os testes com `npm test` para verificar que todos passam
  - _Requirements: 13.3_

- [x] 34. Checkpoint - Garantir que todos os testes passam
  - Executar todos os testes com `npm test`
  - Verificar que não há erros de console no browser
  - Testar fluxo completo das novas funcionalidades
  - Testar controles de admin vs usuário regular
  - Testar filtros em ambas as abas (lista compartilhada e filmes assistidos)
  - Testar botão dinâmico de adicionar/remover
  - Testar sistema de estrelas e reviews
  - Perguntar ao usuário se há dúvidas ou problemas

- [x] 35. Atualizar documentação final
  - Atualizar README.md com todas as novas funcionalidades
  - Documentar sistema de permissões (Admin vs User)
  - Documentar sistema de avaliação com estrelas
  - Documentar sistema de reviews
  - Documentar filtros em ambas as abas
  - Documentar botão dinâmico de adicionar/remover
  - _Requirements: 12.7, 13.1-13.7, 14.1-14.4, 15.1-15.6, 16.1-16.5_
