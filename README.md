# Sistema de Gestão de Biblioteca

Projeto da disciplina de Programação para Web. Sistema web para gerenciamento de
empréstimos de livros, com dois perfis de usuário (**bibliotecário** e **leitor**),
cada um com permissões distintas sobre o catálogo de livros e os empréstimos.

## Tecnologias utilizadas

- **Back-end:** Node.js + Express
- **Banco de dados:** MySQL (driver `mysql2`)
- **Front-end:** HTML, CSS e JavaScript puro (sem frameworks)

## Funcionalidades

### Bibliotecário
- Cadastrar, editar e excluir livros do catálogo.
- Visualizar todos os empréstimos registrados no sistema.
- Aprovar ou rejeitar solicitações de devolução enviadas pelos leitores.
- Excluir um empréstimo (devolve o exemplar ao estoque automaticamente, caso ainda não tenha sido devolvido).

### Leitor
- Visualizar o catálogo de livros disponíveis.
- Solicitar empréstimo de um livro (somente se houver exemplares disponíveis).
- Acompanhar o status dos próprios empréstimos (`ativo`, `atrasado`, `devolução solicitada`, `devolvido`).
- Solicitar a devolução de um livro emprestado.

### Regras de negócio
- Apenas usuários com perfil **bibliotecário** podem cadastrar, atualizar ou remover livros.
- Apenas usuários com perfil **leitor** podem solicitar empréstimos.
- A quantidade disponível de um livro é reduzida ao criar um empréstimo e devolvida ao aprovar a devolução (ou ao excluir um empréstimo ainda não devolvido).
- Um empréstimo é criado com status `ativo`; passa para `atrasado` automaticamente se a data prevista de devolução for ultrapassada; passa para `devolução solicitada` quando o leitor pede a devolução; e para `devolvido` quando o bibliotecário aprova.

## Estrutura do projeto

```
PROJETO-PW-BIBLIOTECA/
├── README.md
└── PROJETO/
    ├── server.js              # Configuração do servidor Express
    ├── db.js                  # Conexão com o MySQL
    ├── biblioteca.sql          # Script de criação do banco de dados
    ├── package.json
    ├── middlewares/
    │   └── auth.js             # Validação de perfil (bibliotecário/leitor)
    ├── routes/
    │   ├── usuario.js          # Cadastro, login e gestão de usuários
    │   ├── livro.js             # CRUD de livros
    │   └── emprestimo.js        # Criação, listagem e devolução de empréstimos
    └── public/
        ├── index.html           # Login e registro
        ├── bibliotecario.html    # Painel do bibliotecário
        ├── leitor.html           # Painel do leitor
        ├── css/
        │   └── style.css
        └── js/
            ├── config.js         # Funções utilitárias e wrapper de requisições
            ├── auth.js           # Lógica da tela de login/registro
            ├── bibliotecario.js  # Lógica do painel do bibliotecário
            └── leitor.js         # Lógica do painel do leitor
```

## Banco de dados

O banco é composto por três tabelas: `usuario`, `livro` e `emprestimo`.

| Tabela | Principais campos |
|---|---|
| `usuario` | `id_usuario`, `nome`, `email`, `senha`, `perfil` (`bibliotecario` ou `leitor`) |
| `livro` | `id_livro`, `titulo`, `autor`, `ano_publicacao`, `quantidade_disponivel` |
| `emprestimo` | `id_emprestimo`, `id_livro`, `id_usuario`, `data_emprestimo`, `data_devolucao_prevista`, `data_devolucao_real`, `status` (`ativo`, `devolucao_solicitada`, `devolvido`, `atrasado`) |

O script completo de criação está em `PROJETO/biblioteca.sql`.

## Como executar o projeto

1. **Criar o banco de dados**, executando o script `PROJETO/biblioteca.sql` no MySQL.
2. **Configurar a conexão**, ajustando usuário/senha do MySQL em `PROJETO/db.js`, se necessário.
3. **Instalar as dependências:**
   ```
   cd PROJETO
   npm install
   ```
4. **Iniciar o servidor:**
   ```
   npm start
   ```
5. Acessar **http://localhost:3000** no navegador.

## Principais rotas da API

| Método | Rota | Quem pode acessar | Descrição |
|---|---|---|---|
| POST | `/usuario/cadastrar` | Público | Registra um novo usuário |
| POST | `/usuario/login` | Público | Autentica um usuário |
| GET | `/livro/listar` | Qualquer usuário logado | Lista todos os livros |
| POST | `/livro/cadastrar` | Bibliotecário | Cadastra um novo livro |
| PUT | `/livro/:id` | Bibliotecário | Atualiza um livro |
| DELETE | `/livro/:id` | Bibliotecário | Remove um livro |
| POST | `/emprestimo/cadastrar` | Leitor | Solicita um novo empréstimo |
| GET | `/emprestimo/listar` | Bibliotecário | Lista todos os empréstimos |
| GET | `/emprestimo/usuario/:id` | Leitor | Lista os empréstimos do leitor |
| PUT | `/emprestimo/solicitar-devolucao/:id` | Leitor | Solicita a devolução de um livro |
| PUT | `/emprestimo/devolver/:id` | Bibliotecário | Aprova a devolução |
| PUT | `/emprestimo/desaprovar-devolucao/:id` | Bibliotecário | Rejeita a solicitação de devolução |
| DELETE | `/emprestimo/:id` | Bibliotecário | Exclui um empréstimo |
