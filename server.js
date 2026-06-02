const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const apiRoute = require('./routes/api');


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
})

app.use(express.json()); 
app.use('/api/livro', apiRoute);

app.listen(port, () => {
  console.log(`Servidor funcionando ${port}`)
})