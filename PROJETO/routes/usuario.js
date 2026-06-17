const express = require('express');
const router = express.Router();
const db = require('../db');


router.post('/cadastrar', (req, res) => {
    const { nome, email, senha, perfil } = req.body;

    if (!nome || !email || !senha || !perfil) {
        return res.status(400).json({ erro: 'Todos os campos são obrigatórios' });
    }
    if (!['bibliotecario', 'leitor'].includes(perfil)) {
        return res.status(400).json({ erro: 'Perfil inválido' });
    }

    db.query('SELECT id_usuario FROM usuario WHERE email = ?', [email], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length > 0) return res.status(409).json({ erro: 'Email já cadastrado' });

        db.query(
            'INSERT INTO usuario (nome, email, senha, perfil) VALUES (?, ?, ?, ?)',
            [nome, email, senha, perfil],
            (err, result) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.status(201).json({ id_usuario: result.insertId, nome, email, perfil });
            }
        );
    });
});


router.post('/login', (req, res) => {
    const { email, senha } = req.body;

    if (!email || !senha) {
        return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
    }

    db.query('SELECT * FROM usuario WHERE email = ? AND senha = ?', [email, senha], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(401).json({ erro: 'Email ou senha inválidos' });

        const usuario = results[0];
        res.json({
            id_usuario: usuario.id_usuario,
            nome: usuario.nome,
            email: usuario.email,
            perfil: usuario.perfil
        });
    });
});


router.get('/listar', (req, res) => {
    db.query('SELECT id_usuario, nome, email, perfil FROM usuario', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});

router.get('/:id', (req, res) => {
    const { id } = req.params;
    db.query('SELECT id_usuario, nome, email, perfil FROM usuario WHERE id_usuario = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(404).json({ erro: 'Usuário não encontrado' });
        res.json(results[0]);
    });
});

router.delete('/:id', (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM usuario WHERE id_usuario = ?', [id], (err) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.sendStatus(204);
    });
});

module.exports = router;