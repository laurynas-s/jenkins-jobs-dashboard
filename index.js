const configReader = require('yml-config-reader')
const config = configReader.getByEnv(process.env.STAGE)
require('./app/component/config').set(config)

const express = require('express')
const bodyParser = require('body-parser');
const exitHook = require('exit-hook');
const mysql = require('./app/db/pool')
const builds = require('./app/model/builds')
const jobs = require('./app/model/jobs')
const cache = require('./app/component/cache')
const branchMenu = require('./app/component/branchMenu')
const pager = require('./app/component/pager')

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

function defaultErrorHandler(err, res) {
    res.render('index', {data: [], menu:[], message: err.message ? err.message : JSON.stringify(err)})
}

app.get('/main', (req, res) => {

    let menu = null;
    branchMenu.getMenu()
        .then(result => menu=result)
        .then(builds.getBuilds)
        .then(result => {
            res.render('index', {data: result, menu: menu})
        })
        .catch(err => {
            defaultErrorHandler(err, res)
        })
})

app.get('/', (req, res) => {
    res.redirect('main')
})
app.get('/flush', (req, res) => {
    cache.flush()
    res.redirect('main')
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
            defaultErrorHandler(err, res)
        })
})

app.get('/job', (req, res) => {
    let menu = null
    const pageUrl = 'job?job='+ encodeURIComponent(req.query.job) + '&page=';
    const page = req.query.page*1;
    branchMenu.getMenu()
        .then(result => menu=result)
        .then(() => builds.getJobBranchesBuilds(req.query.job, page))
        .then(result => {
            let pager1 = pager.getPager(page);
            res.render('index', {data: result, menu: menu, pager: pager1, pageUrl:pageUrl, showPages: true})
        })
        .catch(err => {
            defaultErrorHandler(err, res)
        })
})

app.get('/jobBranch', (req, res) => {
    let menu = null
    const pageUrl = 'jobBranch?branchId='+ encodeURIComponent(req.query.branchId) + '&page=';
    const page = req.query.page*1;
    branchMenu.getMenu()
        .then(result => menu=result)
        .then(() => builds.getJobBranchBuilds(req.query.branchId, page))
        .then(result => {
            res.render('index', {data: result, menu: menu, pager: pager.getPager(page), pageUrl:pageUrl, showPages: true})
        })
        .catch(err => {
            defaultErrorHandler(err, res)
        })
})

app.post('/job', (req, res) => {
    builds.processBuildPost(req.body)
        .then(() => res.sendStatus(200))
        .catch(err => {
            console.log(req.body)
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
            console.log(`Example app listening at http://localhost:${port}/main`)
        })

    })

