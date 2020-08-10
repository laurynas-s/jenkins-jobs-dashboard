const jobs = require('./jobs')
const buildsDb = require('../db/buildsDb')
const branches = require('./branches')

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
                        last_ok: lastOk
                    }
                    console.log(`New build ${jobName}.${branchName}`)
                    return buildsDb.insertBuild(newBuild)
                } else {
                    build.status = buildPost.status
                    build.note = buildPost.note
                    build.version = buildPost.version
                    build.duration = buildPost.duration
                    build.last_ok = lastOk

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

exports.processBuildPost = processBuildPost
