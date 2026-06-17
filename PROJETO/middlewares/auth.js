const db = require('../db');

//Middleware que controla as permissões dos usuários, permitindo que apenas bibliotecários gerenciem livros e apenas leitores solicitem empréstimos
function exigirPerfil(perfilExigido) {
    return (req, res, next) => {
        const idUsuario = req.header('x-usuario-id');

        if (!idUsuario) {
            return res.status(401).json({ erro: 'Usuário não autenticado.' });
        }

        db.query('SELECT perfil FROM usuario WHERE id_usuario = ?', [idUsuario], (err, results) => {
            if (err) return res.status(500).json({ erro: err.message });
            if (!results.length) return res.status(401).json({ erro: 'Usuário não encontrado.' });

            if (results[0].perfil !== perfilExigido) {
                return res.status(403).json({
                    erro: `Acesso restrito a usuários com perfil '${perfilExigido}'.`
                });
            }

            next();
        });
    };
}

module.exports = { exigirPerfil };
