# Requirements Document

## Introduction

O Letterboxd Manager é um sistema web simplificado para uso privativo que permite gerenciar usuários, visualizar filmes através da API do TMDB (The Movie Database) e adicionar filmes a uma lista compartilhada. O sistema será hospedado no GitHub e focará em uma experiência leve e funcional.

## Glossary

- **System**: O Letterboxd Manager
- **Admin**: Usuário com privilégios administrativos que pode gerenciar outros usuários
- **User**: Usuário regular que pode visualizar filmes e adicionar à lista
- **TMDB API**: API externa do The Movie Database para buscar informações de filmes
- **Film**: Filme com informações como pôster, título, nota e gênero
- **Shared List**: Lista única compartilhada entre todos os usuários onde filmes são adicionados
- **Film Entry**: Registro de um filme na lista compartilhada contendo informações do filme e metadados de adição

## Requirements

### Requirement 1

**User Story:** Como administrador, eu quero gerenciar usuários do sistema, para que eu possa controlar quem tem acesso ao site.

#### Acceptance Criteria

1. WHEN the Admin accesses the admin screen THEN the System SHALL display a user management interface
2. WHEN the Admin adds a new user THEN the System SHALL create a user account with username and password
3. WHEN the Admin removes a user THEN the System SHALL delete the user account and revoke access
4. WHEN the Admin updates a user THEN the System SHALL modify the user credentials
5. THE System SHALL store user credentials securely with password hashing

### Requirement 2

**User Story:** Como usuário, eu quero fazer login no sistema, para que eu possa acessar as funcionalidades de forma segura.

#### Acceptance Criteria

1. WHEN a User provides valid credentials THEN the System SHALL authenticate the user and grant access
2. WHEN a User provides invalid credentials THEN the System SHALL reject the login attempt and display an error message
3. WHEN a User is authenticated THEN the System SHALL maintain the session until logout
4. THE System SHALL require authentication for all protected routes

### Requirement 3

**User Story:** Como usuário, eu quero visualizar uma listagem de filmes, para que eu possa explorar e escolher filmes para adicionar à lista.

#### Acceptance Criteria

1. WHEN a User accesses the film listing page THEN the System SHALL fetch films from the TMDB API
2. WHEN displaying films THEN the System SHALL show poster, title, rating, and genre for each film
3. WHEN rendering the film listing THEN the System SHALL use a clean and organized layout
4. WHEN the TMDB API returns film data THEN the System SHALL parse and display all required fields correctly including overview
5. WHEN the TMDB API is unavailable THEN the System SHALL display an appropriate error message
6. WHEN fetching film details THEN the System SHALL include the overview field in the API request

### Requirement 4

**User Story:** Como usuário, eu quero adicionar filmes à lista compartilhada, para que eu possa contribuir com sugestões de filmes para o grupo.

#### Acceptance Criteria

1. WHEN a User selects a film THEN the System SHALL provide an option to add it to the Shared List
2. WHEN a User adds a film to the Shared List THEN the System SHALL record the username of who added it
3. WHEN a User adds a film to the Shared List THEN the System SHALL record the timestamp of when it was added
4. WHEN a film is added to the Shared List THEN the System SHALL store the film information including poster, title, rating, and genre
5. WHEN a film already exists in the Shared List THEN the System SHALL prevent duplicate additions

### Requirement 5

**User Story:** Como usuário, eu quero visualizar a lista compartilhada de filmes, para que eu possa ver quais filmes foram adicionados e por quem.

#### Acceptance Criteria

1. WHEN a User accesses the Shared List THEN the System SHALL display all Film Entries
2. WHEN displaying a Film Entry THEN the System SHALL show the username of who added it
3. WHEN displaying a Film Entry THEN the System SHALL show the timestamp of when it was added
4. WHEN displaying a Film Entry THEN the System SHALL show the film poster, title, rating, and genre
5. WHEN the Shared List is empty THEN the System SHALL display an appropriate message

### Requirement 6

**User Story:** Como desenvolvedor, eu quero que o site seja leve e hospedável no GitHub, para que seja fácil de manter e acessar.

#### Acceptance Criteria

1. THE System SHALL use JavaScript as the primary programming language
2. THE System SHALL be deployable to GitHub Pages or similar static hosting
3. WHEN the System is deployed THEN it SHALL load quickly with minimal dependencies
4. THE System SHALL minimize external dependencies to reduce bundle size
5. THE System SHALL use efficient data storage appropriate for a private use application

### Requirement 7

**User Story:** Como usuário, eu quero visualizar a lista compartilhada em uma aba separada, para que eu possa navegar entre explorar filmes e ver a lista de forma organizada.

#### Acceptance Criteria

1. WHEN a User accesses the main interface THEN the System SHALL display separate tabs for film exploration and shared list
2. WHEN a User clicks on the shared list tab THEN the System SHALL display the shared list view
3. WHEN a User clicks on the explore films tab THEN the System SHALL display the film exploration view
4. THE System SHALL maintain the active tab state during navigation
5. THE System SHALL provide visual feedback indicating which tab is currently active

### Requirement 8

**User Story:** Como usuário, eu quero ver detalhes completos de um filme incluindo sinopse, para que eu possa tomar decisões informadas sobre quais filmes adicionar à lista.

#### Acceptance Criteria

1. WHEN a User clicks on a film THEN the System SHALL display a detailed view with film information
2. WHEN displaying film details THEN the System SHALL show the film synopsis from the overview field
3. WHEN displaying film details THEN the System SHALL show poster, title, rating, genres, and release year
4. WHEN a User views film details THEN the System SHALL provide an option to close the detail view
5. WHEN a User views film details THEN the System SHALL provide an option to add the film to the shared list
6. WHEN the overview field is empty THEN the System SHALL display a message indicating no synopsis is available

### Requirement 9

**User Story:** Como usuário, eu quero ver os gêneros dos filmes como nomes legíveis, para que eu possa entender facilmente as categorias dos filmes.

#### Acceptance Criteria

1. WHEN the System receives genre data from TMDB API THEN it SHALL map genre IDs to genre names
2. WHEN displaying a film THEN the System SHALL show genre names instead of numeric IDs
3. WHEN multiple genres are present THEN the System SHALL display all genre names in a readable format
4. THE System SHALL maintain a mapping of TMDB genre IDs to genre names

### Requirement 10

**User Story:** Como usuário, eu quero navegar pelos filmes usando paginação, para que eu possa explorar uma grande quantidade de filmes de forma organizada.

#### Acceptance Criteria

1. WHEN displaying films THEN the System SHALL show a limited number of films per page
2. WHEN films are paginated THEN the System SHALL provide navigation controls to move between pages
3. WHEN a User navigates to a different page THEN the System SHALL load and display films for that page
4. WHEN on the first page THEN the System SHALL disable or hide the previous page control
5. WHEN on the last page THEN the System SHALL disable or hide the next page control
6. THE System SHALL display the current page number and total pages available

### Requirement 11

**User Story:** Como usuário, eu quero filtrar a lista compartilhada por diferentes critérios, para que eu possa encontrar filmes específicos de forma eficiente.

#### Acceptance Criteria

1. WHEN a User accesses the shared list tab THEN the System SHALL display filter options
2. WHEN a User selects a genre filter THEN the System SHALL display only films matching that genre
3. WHEN a User enters a name filter THEN the System SHALL display only films whose titles contain the search text
4. WHEN a User selects random filter THEN the System SHALL display films in random order
5. WHEN a User applies multiple filters THEN the System SHALL display films matching all selected criteria
6. WHEN a User clears filters THEN the System SHALL display all films in the shared list
7. THE System SHALL update the displayed list immediately when filters are changed

### Requirement 12

**User Story:** Como usuário, eu quero registrar filmes que já assistimos com nossas avaliações, para que possamos manter um histórico das noites de filme.

#### Acceptance Criteria

1. WHEN a User accesses the main interface THEN the System SHALL display a tab for watched films
2. WHEN the Admin marks a film as watched THEN the System SHALL move it to the watched films list
3. WHEN the Admin marks a film as watched THEN the System SHALL prompt for a rating and review
4. WHEN displaying a watched film THEN the System SHALL show the rating and review given during movie night
5. WHEN displaying a watched film THEN the System SHALL show who added the rating and when
6. WHEN a film is marked as watched THEN the System SHALL remove it from the shared list
7. THE System SHALL allow ratings on a scale from 1 to 5 stars
8. WHEN a User is not an Admin THEN the System SHALL prevent marking films as watched from the shared list

### Requirement 13

**User Story:** Como administrador, eu quero gerenciar filmes assistidos, para que eu possa corrigir avaliações ou remover filmes da lista de assistidos.

#### Acceptance Criteria

1. WHEN the Admin views a watched film THEN the System SHALL provide an option to edit the rating
2. WHEN the Admin views a watched film THEN the System SHALL provide an option to edit the review
3. WHEN the Admin edits a rating THEN the System SHALL update the stored rating value
4. WHEN the Admin edits a review THEN the System SHALL update the stored review text
5. WHEN the Admin views a watched film THEN the System SHALL provide an option to remove it from watched list
6. WHEN the Admin removes a film from watched list THEN the System SHALL delete the watched entry
7. WHEN a User is not an Admin THEN the System SHALL prevent editing or removing watched films

### Requirement 14

**User Story:** Como usuário, eu quero que os filtros funcionem corretamente na lista compartilhada, para que eu possa encontrar filmes de forma eficiente.

#### Acceptance Criteria

1. WHEN a User applies a genre filter THEN the System SHALL immediately update the displayed films
2. WHEN a User clicks random order multiple times THEN the System SHALL generate a different random order each time
3. WHEN a User applies a filter THEN the System SHALL persist the filter state until changed or cleared
4. WHEN filters are applied THEN the System SHALL update the film count to reflect filtered results

### Requirement 15

**User Story:** Como usuário, eu quero que a aba de filmes assistidos tenha os mesmos filtros da lista compartilhada, para que eu possa navegar facilmente pelos filmes assistidos.

#### Acceptance Criteria

1. WHEN a User accesses the watched films tab THEN the System SHALL display filter options
2. WHEN a User applies a genre filter in watched films THEN the System SHALL display only watched films matching that genre
3. WHEN a User applies a name filter in watched films THEN the System SHALL display only watched films whose titles contain the search text
4. WHEN a User applies random order in watched films THEN the System SHALL display watched films in random order
5. WHEN a User applies multiple filters in watched films THEN the System SHALL display watched films matching all criteria
6. WHEN a User clears filters in watched films THEN the System SHALL display all watched films

### Requirement 16

**User Story:** Como usuário, eu quero feedback visual claro sobre quais filmes já estão na lista, para que eu não tente adicionar filmes duplicados.

#### Acceptance Criteria

1. WHEN a film is already in the shared list THEN the System SHALL change the add button to a remove button
2. WHEN a User clicks the remove button THEN the System SHALL remove the film from the shared list
3. WHEN a film is removed from the shared list THEN the System SHALL change the remove button back to an add button
4. WHEN displaying films in explore tab THEN the System SHALL indicate which films are already in the shared list
5. THE System SHALL update button states immediately after adding or removing films
