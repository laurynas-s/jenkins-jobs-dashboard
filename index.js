const express = require('express')
const repository = require('./app/repository')
const app = express()
const port = 3000

app.set('view engine', 'pug')
app.use(express.static('public'))

app.get('/', (req, res) => {
    repository.getJobs().then(jobs => {
        res.render('index', { title: 'Hey', message: 'Hello there!', data: jobs })
    })
})

app.post('/job', (req, res) => {
  
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
