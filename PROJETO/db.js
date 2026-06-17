const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost', 
    user: 'root',
    password: '', // coloque aqui a senha do seu MySQL, se houver
    database: 'biblioteca',
});

db.connect(err => {
    if (err) throw err;
    console.log('conectado ao banco de dados');
});

module.exports = db;
