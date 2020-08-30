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
        .catch( err => {
            console.error(err);
            return null
        })
}

function getDistinctBranchesByPattern(pattern, last) {
    return pool.query(`
        SELECT
        DISTINCT branch
        FROM branches
        WHERE branch like ?
        ORDER BY branch+1
    `, [pattern])
        .then(data => {
            const menu = [];
            while(data.length > 0 && menu.length < last) {
                menu.push(data.pop().branch)
            }
            return menu
        })
        .catch( err => {
            console.error(err);
            return []
        })
}

exports.getBranches = getBranches
exports.getBranchByNameAndJob = getBranchByNameAndJob
exports.insertBranch = insertBranch
exports.getDistinctBranchesByPattern = getDistinctBranchesByPattern
