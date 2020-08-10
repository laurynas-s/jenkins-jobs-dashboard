const pool = require('./pool')

function getBranches() {
    return pool.query(`SELECT * FROM branches`)
}

function getBranchByNameAndJob(name, jobId) {
    return pool.query(`SELECT * FROM branches WHERE  jobId = ? and branch like ? `, [jobId, name])
        .then(results => {
            if (results.length > 0) {
                return results[0]
            } else {
                return null;
            }
        })
}

function insertBranch(branch) {
    return pool.query(`INSERT INTO branches SET jobId=?, branch=?, main=?, created=now()`, [branch.jobId, branch.branch, branch.main])
        .then((results) => {
            return {insertId: results.insertId}
        })
}

exports.getBranches = getBranches
exports.getBranchByNameAndJob = getBranchByNameAndJob
exports.insertBranch = insertBranch
