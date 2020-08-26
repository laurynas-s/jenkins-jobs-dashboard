const jobs = require('./jobs')
const buildsDb = require('../db/buildsDb')
const branches = require('./branches')
const utils = require('../utils')

const statusMap = { 'ok': 1, 'building': 2, 'error': 3}
function map(statusText) { return statusText && statusMap[statusText] ?  statusMap[statusText] : 4}

function validateBuildPost(build) {

    if (!build.name) {
        throw {message: "Missing job name"}
    }

    if (!build.branch) {
        throw {message: "Missing branch name"}
    }

    if (!build.status) {
        throw {message: "Missing status"}
    }

    if (!build.buildJenkinsId) {
        throw {message: "Missing buildJenkinsId"}
    }

    if (!build.note) {
        build.note = null
    }

    if (!build.version) {
        build.version = null
    }
    if (!build.duration) {
        build.duration = null
    }

    return build
}

function processBuildPost(buildPost) {

    buildPost = validateBuildPost(buildPost)
    const jobName = buildPost.name
    const branchName = buildPost.branch
    let jobId = null
    let branchId = null

    return jobs.getOrCreateJob(jobName)
        .then(job => {
            jobId = job.id
            return branches.getOrCreateBranch(branchName, jobId)
        })
        .then(branch => {
            branchId = branch.id
            return buildsDb.getLastNotFinishedBuild(branchId)
        })
        .then(build => {

            let lastOk = buildPost.status == 'ok' ? 1 : 0;

            const saveBuild = (build, buildPost) => {
                if (!build) {
                    const newBuild = {
                        jobId: jobId,
                        branchId: branchId,
                        status: buildPost.status,
                        version: buildPost.version,
                        duration: buildPost.duration,
                        note: buildPost.note,
                        lastOk: lastOk,
                        buildJenkinsId: buildPost.buildJenkinsId
                    }
                    console.log(`New build ${jobName}.${branchName}`)
                    return buildsDb.insertBuild(newBuild)
                } else {
                    build.status = buildPost.status
                    build.note = buildPost.note
                    build.version = buildPost.version
                    build.duration = buildPost.duration
                    build.lastOk = lastOk

                    return buildsDb.updateBuild(build)
                }
            }

            if (lastOk) {
                return buildsDb.markBuildsNotLastOk(branchId)
                    .then(() => saveBuild(build, buildPost))
            } else {
                return saveBuild(build, buildPost)
            }
        })
}

function getBuilds() {
    return buildsDb.getBuilds()
        .then( builds => {
            return builds.map( build => {
                build.rawStatus = build.status
                build.rawTime = build.time
                build.rawDuration = build.duration
                build.rawLastGodBuildTime = build.lastGodBuildTime

                build.status = map(build.rawStatus)
                build.time = utils.prettyDate(build.rawTime)
                build.lastGodBuildTime = utils.prettyDate(build.lastGodBuildTime)
                return build
            })
        })
}

exports.processBuildPost = processBuildPost
exports.getBuilds = getBuilds
