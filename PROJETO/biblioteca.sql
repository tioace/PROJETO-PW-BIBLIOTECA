create database biblioteca; 

use biblioteca; 

create table usuario(
	id_usuario int primary key auto_increment, 
    nome varchar(80) not null, 
    email varchar(80) not null, 
    senha varchar(80) not null, 
    perfil enum('bibliotecario', 'leitor') not null
);

create table livro(
	id_livro int primary key auto_increment, 
    titulo varchar(80) not null, 
    autor varchar(80) not null, 
    ano_publicacao int, 
    quantidade_disponivel int not null
); 

create table emprestimo(
	id_emprestimo int primary key auto_increment, 
    id_livro int not null, 
    id_usuario int not null, 
    data_emprestimo date not null, 
    data_devolucao_prevista date not null, 
    data_devolucao_real date not null, 
    status enum('ativo', 'devolvido') not null,
    foreign key (id_livro) references livro(id_livro), 
    foreign key (id_usuario) references usuario(id_usuario)
); 

-- Listar emprestimo --
SELECT e.*, u.nome AS nome_usuario, l.titulo AS titulo_livro FROM emprestimo e
JOIN usuario u ON e.id_usuario = u.id_usuario JOIN livro l ON e.id_livro = l.id_livro`

