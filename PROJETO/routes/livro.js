const express = require('express');
const router = express.Router();

const db = require('../db');
const { exigirPerfil } = require('../middlewares/auth');

//Cadastra o livro apenas bibliotecário
router.post('/cadastrar', exigirPerfil('bibliotecario'), (req, res) => {
    const { titulo, autor, ano_publicacao, quantidade_disponivel } = req.body;

    if (!titulo || !autor || quantidade_disponivel === undefined) {
        return res.status(400).json({ erro: 'Título, autor e quantidade disponível são obrigatórios' });
    }

    const ano = ano_publicacao ? Number(ano_publicacao) : null;
    if (ano !== null && (isNaN(ano) || ano < 0 || ano > 2100)) {
        return res.status(400).json({ erro: 'Ano de publicação inválido' });
    }

    db.query(
        'insert into livro (titulo, autor, ano_publicacao, quantidade_disponivel) VALUES (?, ?, ?, ?)',
        [titulo, autor, ano, quantidade_disponivel],
        (err, result) => {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id_livro: result.insertId, titulo, autor, ano_publicacao: ano, quantidade_disponivel });
        }
    );
});

//Lista os livros
router.get('/listar', (req, res) => {
    db.query('select * from livro order by id_livro desc', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});

//Busca o livro por id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('select * from livro where id_livro = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
        res.json(results[0]);
    });
});

//Atualiza o livro apenas bibliotecário
router.put('/:id', exigirPerfil('bibliotecario'), (req, res) => {
    const { id } = req.params;
    const { titulo, autor, ano_publicacao, quantidade_disponivel } = req.body;

    if (!titulo || !autor || quantidade_disponivel === undefined) {
        return res.status(400).json({ erro: 'Título, autor e quantidade disponível são obrigatórios' });
    }

    const ano = ano_publicacao ? Number(ano_publicacao) : null;
    if (ano !== null && (isNaN(ano) || ano < 0 || ano > 2100)) {
        return res.status(400).json({ erro: 'Ano de publicação inválido' });
    }

    db.query(
        'update livro set titulo = ?, autor = ?, ano_publicacao = ?, quantidade_disponivel = ? where id_livro = ?',
        [titulo, autor, ano, quantidade_disponivel, id],
        (err, result) => {
            if (err) return res.status(500).json({ erro: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
            res.json({ mensagem: 'Livro atualizado com sucesso' });
        }
    );
});

//Deleta o livro apenas bibliotecário
router.delete('/:id', exigirPerfil('bibliotecario'), (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM livro WHERE id_livro = ?', [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.sendStatus(204);
    });
});

module.exports = router;
