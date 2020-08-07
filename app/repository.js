const low = require('lowdb')
const FileAsync = require('lowdb/adapters/FileAsync')
const d3 = require('d3-array')
const adapter = new FileAsync('db.json')

function addDefaultDate(job) {
    job.time = new Date()
    return job;
}

function initDBSampleData(db) {
    if (db.get('jobs').value().length===0) {
        console.log('Loading default values')
        const sampleData = require('./sample.json');
        db.get('jobs')
            .push(addDefaultDate(sampleData[0]))
            .push(addDefaultDate(sampleData[1]))
            .push(addDefaultDate(sampleData[2]))
            .push(addDefaultDate(sampleData[3]))
            .write(() => {
                console.log('default saved')
            })
    }
}

function sortJobs(a, b) {

}

low(adapter)
    .then(db => {

        function getJobs(project='', branch='', status='') {

            initDBSampleData(db);

            return new Promise((success, failure) => {
                success(db.get('jobs').value());
            })
        }

        function getJob(project='', branch='') {
            return new Promise(success => {
                const jobs = db.get('jobs').value();
                if (jobs.length > 1) {

                }
            })
        }

        function putJob(job) {

        }

        exports.getJobs = getJobs

        return db.defaults({
            jobs: []
        }).write()
    })


