const express = require('express')
const bodyParser = require('body-parser');
const exitHook = require('exit-hook');
const configReader = require('yml-config-reader')
const mysql = require('./app/db/pool')
const buildsDb = require('./app/db/buildsDb')
const builds = require('./app/model/builds')
const jobs = require('./app/model/jobs')

const config = configReader.getByEnv(process.env.STAGE)

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

    buildsDb.getBuilds()
        .then(result => {
            res.render('index', {data: result})
        })
        .catch(err => {
            res.render('index', {data: [], message: JSON.stringify(err)})
        })
})

app.post('/job', (req, res) => {
    console.log(req.body)
    builds.processBuildPost(req.body)
        .then(() => res.sendStatus(200))
        .catch(err => res.status(500).json(err))

});

app.get('/test', (req, res) => {
    buildsDb.getBuilds().then(result => {
        res.json(result)
    }).catch(err => res.json(err))
})

jobs.initiateDefaultJobs(config.jobs)
    .then(() => {
        app.listen(port, () => {
            console.log(`Example app listening at http://localhost:${port}`)
        })

    })

