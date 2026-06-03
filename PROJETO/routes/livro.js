const express = require('express');
const router = express.Router();

const db = require('../db');

// Cadastrar livro
router.post('/cadastrar', (req, res) => {
    const { titulo, autor, ano_publicacao, quantidade_disponivel } = req.body;

    db.query(
        'insert into livro (titulo, autor, ano_publicacao, quantidade_disponivel) VALUES (?, ?, ?, ?)',
        [titulo, autor, ano_publicacao, quantidade_disponivel],
        (err, result) => {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id: result.insertId, titulo, autor, ano_publicacao, quantidade_disponivel });
        }
    );
});

// Listar livros
router.get('/listar', (req, res) => {
    db.query('select * from livro', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});

// Buscar livro por id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('select * from livro where id_livro = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(404).json({ erro: 'Livro não encontrado' });
        res.json(results[0]);
    });
});

// Deletar livro
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM livro WHERE id_livro = ?', [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.sendStatus(204);
    });
});

module.exports = router;