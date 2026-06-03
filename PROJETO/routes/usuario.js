const express = require('express');
const router = express.Router();
const db = require('../db');

// Cadastrar usuario
router.post('/cadastrar', (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    db.query(
        'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
        [nome, email, senha, perfil],
        (err, result) => {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id: result.insertId, nome, email, perfil });
        }
    );
});

// Listar usuarios
router.get('/listar', (req, res) => {
    db.query('SELECT * FROM usuario', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});

// Buscar usuario por id
router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT * FROM usuario WHERE id_usuario = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
        res.json(results[0]);
    });
});

// Deletar usuario
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.sendStatus(204);
    });
});

module.exports = router;