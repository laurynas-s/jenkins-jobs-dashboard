const pool = require('./pool')

function getJobs() {
    return pool.query(`SELECT * FROM jobs`)
}

function getJobByName(name) {
    return pool.query("SELECT * FROM jobs WHERE name like ?", [name])
        .then(results => {
            if (results.length > 0) {
                return results[0]
            } else {
                return null;
            }
        })
}

function insertJob(job) {
    return pool.query(`INSERT INTO jobs SET name=?, pos=999`, [job.name])
        .then((results) => {
            return {insertId: results.insertId}
        })
}

function updateJob(job) {
    return pool.query(`UPDATE jobs SET name=? WHERE id=?`, [job.name, job.id])
}

exports.getJobs = getJobs
exports.getJobByName = getJobByName
exports.insertJob = insertJob
