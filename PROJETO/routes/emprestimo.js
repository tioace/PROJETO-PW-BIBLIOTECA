const express = require('express');
const router = express.Router();
const db = require('../db');
const { exigirPerfil } = require('../middlewares/auth');

function dataHoje() {
    return new Date().toISOString().split('T')[0];
}

function calcularDataPrevista(dias = 14) {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split('T')[0];
}

//Marca como 'atrasado' qualquer empréstimo ativo cuja data prevista já tenha passado
function marcarAtrasados(callback) {
    db.query(
        `UPDATE emprestimo SET status = 'atrasado'
         WHERE status = 'ativo' AND data_devolucao_prevista < CURDATE() AND data_devolucao_real IS NULL`,
        callback
    );
}

//Registra os empréstimo 
router.post('/cadastrar', exigirPerfil('leitor'), (req, res) => {
    const { id_livro, id_usuario } = req.body;

    if (!id_livro || !id_usuario)
        return res.status(400).json({ erro: 'id_livro e id_usuario são obrigatórios' });

    db.query('SELECT * FROM livro WHERE id_livro = ?', [id_livro], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!results.length) return res.status(404).json({ erro: 'Livro não encontrado' });

        const livro = results[0];
        if (livro.quantidade_disponivel <= 0)
            return res.status(400).json({ erro: 'Não há exemplares disponíveis para este livro' });

        const emprestimoData = dataHoje();
        const previstaData   = calcularDataPrevista();

        db.query(
            `INSERT INTO emprestimo (id_livro, id_usuario, data_emprestimo, data_devolucao_prevista, data_devolucao_real, status)
             VALUES (?, ?, ?, ?, NULL, 'ativo')`,
            [id_livro, id_usuario, emprestimoData, previstaData],
            (err, result) => {
                if (err) return res.status(500).json({ erro: err.message });

                db.query(
                    'UPDATE livro SET quantidade_disponivel = quantidade_disponivel - 1 WHERE id_livro = ?',
                    [id_livro],
                    (err) => {
                        if (err) return res.status(500).json({ erro: err.message });
                        res.status(201).json({ id_emprestimo: result.insertId, mensagem: 'Empréstimo registrado com sucesso' });
                    }
                );
            }
        );
    });
});

//Lista todos os empréstimos 
router.get('/listar', (req, res) => {
    marcarAtrasados((err) => {
        if (err) return res.status(500).json({ erro: err.message });

        db.query(
            `SELECT e.*, u.nome AS nome_usuario, l.titulo AS titulo_livro, l.autor AS autor_livro
             FROM emprestimo e
             JOIN usuario u ON e.id_usuario = u.id_usuario
             JOIN livro    l ON e.id_livro   = l.id_livro
             ORDER BY e.id_emprestimo DESC`,
            (err, results) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.json(results);
            }
        );
    });
});

//Lista os empréstimos de um usuário 
router.get('/usuario/:id', (req, res) => {
    const { id } = req.params;
    marcarAtrasados((err) => {
        if (err) return res.status(500).json({ erro: err.message });

        db.query(
            `SELECT e.*, l.titulo AS titulo_livro, l.autor AS autor_livro
             FROM emprestimo e
             JOIN livro l ON e.id_livro = l.id_livro
             WHERE e.id_usuario = ?
             ORDER BY e.id_emprestimo DESC`,
            [id],
            (err, results) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.json(results);
            }
        );
    });
});

// Solicita a devolução 
router.put('/solicitar-devolucao/:id', exigirPerfil('leitor'), (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM emprestimo WHERE id_emprestimo = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!results.length) return res.status(404).json({ erro: 'Empréstimo não encontrado' });

        const emp = results[0];

        if (emp.status === 'devolvido')
            return res.status(400).json({ erro: 'Este livro já foi devolvido' });
        if (emp.status === 'devolucao_solicitada')
            return res.status(400).json({ erro: 'A devolução já foi solicitada' });

        db.query(
            `UPDATE emprestimo SET status = 'devolucao_solicitada' WHERE id_emprestimo = ?`,
            [id],
            (err) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({ mensagem: 'Solicitação de devolução enviada com sucesso' });
            }
        );
    });
});

//Desaprova a devolução 
router.put('/desaprovar-devolucao/:id', exigirPerfil('bibliotecario'), (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM emprestimo WHERE id_emprestimo = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!results.length) return res.status(404).json({ erro: 'Empréstimo não encontrado' });

        if (results[0].status !== 'devolucao_solicitada')
            return res.status(400).json({ erro: 'Este empréstimo não está com devolução solicitada' });

        db.query(
            `UPDATE emprestimo SET status = 'ativo' WHERE id_emprestimo = ?`,
            [id],
            (err) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.json({ mensagem: 'Solicitação de devolução rejeitada. Empréstimo voltou para Ativo.' });
            }
        );
    });
});

//Aprova a devolução 
router.put('/devolver/:id', exigirPerfil('bibliotecario'), (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM emprestimo WHERE id_emprestimo = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!results.length) return res.status(404).json({ erro: 'Empréstimo não encontrado' });
        if (results[0].status === 'devolvido') return res.status(400).json({ erro: 'Livro já devolvido' });

        const emp = results[0];

        db.query(
            `UPDATE emprestimo SET data_devolucao_real = ?, status = 'devolvido' WHERE id_emprestimo = ?`,
            [dataHoje(), id],
            (err) => {
                if (err) return res.status(500).json({ erro: err.message });

                db.query(
                    'UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?',
                    [emp.id_livro],
                    (err) => {
                        if (err) return res.status(500).json({ erro: err.message });
                        res.json({ mensagem: 'Devolução aprovada com sucesso' });
                    }
                );
            }
        );
    });
});

//Exclui o empréstimo 
router.delete('/:id', exigirPerfil('bibliotecario'), (req, res) => {
    const { id } = req.params;

    db.query('SELECT * FROM emprestimo WHERE id_emprestimo = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (!results.length) return res.status(404).json({ erro: 'Empréstimo não encontrado' });

        const emp = results[0];

        const deletar = () => {
            db.query('DELETE FROM emprestimo WHERE id_emprestimo = ?', [id], (err) => {
                if (err) return res.status(500).json({ erro: err.message });
                res.sendStatus(204);
            });
        };

        if (emp.status !== 'devolvido') {
            db.query(
                'UPDATE livro SET quantidade_disponivel = quantidade_disponivel + 1 WHERE id_livro = ?',
                [emp.id_livro],
                (err) => {
                    if (err) return res.status(500).json({ erro: err.message });
                    deletar();
                }
            );
        } else {
            deletar();
        }
    });
});

module.exports = router;