const configReader = require('yml-config-reader')
const config = configReader.getByEnv(process.env.STAGE)

const express = require('express')
const bodyParser = require('body-parser');
const exitHook = require('exit-hook');
const mysql = require('./app/db/pool')
const builds = require('./app/model/builds')
const jobs = require('./app/model/jobs')
const cache = require('./app/component/cache')
const branchMenu = require('./app/component/branchMenu')

const app = express()
const port = config.server.port

app.set('view engine', 'pug')
app.use(express.static('public'))
app.use(bodyParser.json());



exitHook(() => {
    // ToDo - not working - exiting before connections are closed
    console.log('Exiting');
    return mysql.closePool()
        .then(() => {
            process.exit(0)
        })
});

app.get('/', (req, res) => {

    let menu = null;
    branchMenu.getMenu()
        .then(result => menu=result)
        .then(builds.getBuilds)
        .then(result => {
            res.render('index', {data: result, menu: menu})
        })
        .catch(err => {
            res.render('index', {data: [], menu:[], message: JSON.stringify(err)})
        })
})

app.get('/flush', (req, res) => {
    cache.flush()
    res.redirect('/')
})

app.get('/branch', (req, res) => {
    let menu = null
    branchMenu.getMenu()
        .then(result => menu=result)
        .then(() => builds.getBranchBuilds(req.query.branch))
        .then(result => {
            res.render('index', {data: result, menu: menu})
        })
        .catch(err => {
            res.render('index', {data: [], menu:[], message: JSON.stringify(err)})
        })
})

app.post('/job', (req, res) => {
    console.log(req.body)
    builds.processBuildPost(req.body)
        .then(() => res.sendStatus(200))
        .catch(err => {
            console.error(err)
            res.status(500).json(err.message)
        })

});

app.get('/test', (req, res) => {
    branchMenu.getMenu()
        .then(result => {
        res.json(result)
    }).catch(err => res.json(err))
})

jobs.initiateDefaultJobs(config.jobs ? config.jobs : [])
    .then(() => {
        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        })

    })

