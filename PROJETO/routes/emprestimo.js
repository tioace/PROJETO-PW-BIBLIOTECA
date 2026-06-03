const express = require('express');
const router = express.Router();

const db = require('../db');

// Registrar emprestimo
router.post('/cadastrar', (req, res) => {
    const { id_livro, id_usuario, data_emprestimo, data_devolucao_prevista } = req.body;

    db.query(
        `insert into emprestimo 
         (id_livro, id_usuario, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status) 
         values (?, ?, ?, ?, NULL, 'ativo')`,
        [id_livro, id_usuario, data_emprestimo, data_devolucao_prevista],
        (err, result) => {
            if (err) return res.status(500).json({ erro: err.message });
            res.status(201).json({ id: result.insertId, mensagem: 'Empréstimo registrado com sucesso' });
        }
    );
});

// Listar emprestimos
router.get('/listar', (req, res) => {
    db.query(
        `select e.*, u.nome AS nome_usuario, l.titulo AS titulo_livro
         FROM emprestimo e
         join usuario u ON e.id_usuario = u.id_usuario
         join livro l ON e.id_livro = l.id_livro`,
        (err, results) => {
            if (err) return res.status(500).json({ erro: err.message });
            res.json(results);
        }
    );
});

// Devolver livro
router.put('/devolver/:id', (req, res) => {
    const { id } = req.params;
    const data_devolucao_real = new Date().toISOString().split('T')[0];

    db.query('select * from emprestimo where id_emprestimo = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (results.length === 0) return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        if (results[0].status === 'devolvido') return res.status(400).json({ erro: 'Livro já devolvido' });

        db.query(
            `update emprestimo set data_devolucao_real = ?, status = 'devolvido' WHERE id_emprestimo = ?`,
            [data_devolucao_real, id],
            (err) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({ mensagem: 'Livro devolvido com sucesso' });
            }
        );
    });
});

module.exports = router;