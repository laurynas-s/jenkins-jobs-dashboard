const jobsDB = require('../db/jobsDb')
const branches = require('./branches')

function getOrCreateJob(name) {
    return jobsDB.getJobByName(name)
        .then(job => {
            if (!job) {
                const newJob = {
                    name: name,
                    pos: 999
                }
                console.log(`Creating new job ${name}`)
                return jobsDB.insertJob(newJob)
                    .then(result => {
                        newJob.id = result.insertId
                        return newJob
                    })
            }
            return job
        })
}

function initiateDefaultJobs(jobs) {
    console.log("Starting job data initiation")
    const promises = []
    for (const jobConfig of jobs) {
        promises.push(getOrCreateJob(jobConfig.name)
            .then(job => branches.getOrCreateBranch(jobConfig.branch, job.id, true))
        )
    }

    return Promise.all(promises)
        .then(() => console.log("Job data Initiation finished"))
}

exports.getOrCreateJob = getOrCreateJob
exports.initiateDefaultJobs = initiateDefaultJobs
