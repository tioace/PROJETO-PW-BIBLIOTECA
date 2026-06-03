const express = require('express')
const app = express()
const port = 3000
const path = require('path')

const usuarioRoute = require('./routes/usuario');
const livroRoute = require('./routes/livro');
const emprestimoRoute = require('./routes/emprestimo');


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.use(express.json()); 

app.use('/usuario', usuarioRoute);
app.use('/livro', livroRoute);
app.use('/emprestimo', emprestimoRoute);

app.listen(port, () => {
  console.log(`Servidor funcionando ${port}`)
})