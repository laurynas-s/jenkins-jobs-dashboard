const pool = require('./pool')

function getBuilds() {
    return pool.query(`WITH latestBuildStatus AS (
                              SELECT 
                                j.name,
                                j.pos,
                                br.branch,
                                br.id as branchId2,
                                b.*,
                                ROW_NUMBER() OVER (PARTITION BY br.id ORDER BY b.time DESC) AS rn
                                FROM jobs j JOIN branches br ON j.id = br.jobId 
                                LEFT JOIN builds b ON br.id = b.branchId 
                                WHERE br.main = 1
                            )
                            SELECT latestBuildStatus.*,
                            lb.id as lastGodBuildId,
                            lb.version as lastGodBuildVersion,
                            lb.time as lastGodBuildTime
                            FROM latestBuildStatus LEFT JOIN 
                            builds as lb ON latestBuildStatus.branchId2 = lb.branchId and lb.lastOk = 1
                            WHERE rn = 1 
                            ORDER BY pos`)
}

function getBranchBuilds(branch) {
    return pool.query(`WITH latestBuildStatus AS (
            SELECT
                j.name,
                j.pos,
                br.branch,
                br.id as branchId2,
                b.*,
                ROW_NUMBER() OVER (PARTITION BY br.id ORDER BY b.time DESC) AS rn
            FROM jobs j JOIN branches br ON j.id = br.jobId
                        LEFT JOIN builds b ON br.id = b.branchId
            WHERE br.branch like ?
        )
        SELECT latestBuildStatus.*,
               lb.id as lastGodBuildId,
               lb.version as lastGodBuildVersion,
               lb.time as lastGodBuildTime
        FROM latestBuildStatus LEFT JOIN
             builds as lb ON latestBuildStatus.branchId2 = lb.branchId and lb.lastOk = 1
        WHERE rn = 1
        ORDER BY pos`,
            [branch])
}

function getLastSuccessfulBuild(branchId) {
    return pool.query(`SELECT * FROM builds b where b.status = 'ok' and b.branchId = ? ORDER BY b.time DESC LIMIT 1`, [branchId])
        .then(results => {
            if (results.length > 0) {
                return results[0]
            } else {
                return null;
            }
        })
}

function getLastBuild(branchId) {
    return pool.query(`SELECT * FROM builds b where b.branchId = ? ORDER BY b.time DESC LIMIT 1`, [branchId])
        .then(results => {
            if (results.length > 0) {
                return results[0]
            } else {
                return null;
            }
        })
}
function getLastNotFinishedBuild(branchId) {
    return pool.query(`SELECT * FROM builds b where b.branchId = ? and status != 'ok' ORDER BY b.time DESC LIMIT 1`, [branchId])
        .then(results => {
            if (results.length > 0) {
                return results[0]
            } else {
                return null;
            }
        })
}


function updateBuild(build) {
    return pool.query(`UPDATE builds SET status=?, version=?, duration=?, time=now(), note=?, lastOk=? WHERE id=?`,
        [
            build.status,
            build.version,
            build.duration,
            build.note,
            build.lastOk,
            build.id
        ])
}

function insertBuild(build) {
    return pool.query(`INSERT INTO builds SET buildJenkinsId=?, jobId=?, branchId=?, status=?, version=?, duration=?, time=now(), note=?, lastOk=?`,
            [
                build.buildJenkinsId,
                build.jobId,
                build.branchId,
                build.status,
                build.version,
                build.duration,
                build.note,
                build.lastOk
            ]
        )
        .then((results) => {
            return {insertId: results.insertId}
        })
        .catch( err => {
            console.error(err);
            return null
        })
}

function markBuildsNotLastOk(branchId) {
    return pool.query(`UPDATE builds SET lastOk = 0 WHERE branchId = ? and lastOk = 1`, [branchId])
}

exports.getBuilds = getBuilds
exports.getBranchBuilds = getBranchBuilds
exports.getLastBuild = getLastBuild
exports.getLastNotFinishedBuild = getLastNotFinishedBuild
exports.updateBuild = updateBuild
exports.insertBuild = insertBuild
exports.getLastSuccessfulBuild = getLastSuccessfulBuild
exports.markBuildsNotLastOk = markBuildsNotLastOk
