const jobs = require('./jobs')
const buildsDb = require('../db/buildsDb')
const branches = require('./branches')
const utils = require('../utils')

const statusMap = {'ok': 1, 'building': 2, 'error': 3}

function map(statusText) {
    return statusText && statusMap[statusText] ? statusMap[statusText] : 4
}

function msToTime(duration) {
    if (!duration) {
        return '';
    }
    let milliseconds = parseInt((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    let hasHours = hours > 0;
    let hasMinutes = minutes > 0;
    let hasSeconds = seconds > 0;

    let timeString = '';
    if (hasHours) {
        timeString = hours + "h " + minutes + "m " + seconds + "s " + milliseconds + ' ms';
    } else if (hasMinutes) {
        timeString = minutes + "m " + seconds + "s " + milliseconds + ' ms';
    } else if (hasSeconds) {
        timeString = seconds + "s " + milliseconds + ' ms';
    } else {
        timeString = milliseconds + ' ms';
    }

    return timeString;
}

function validateBuildPost(build) {

    return new Promise((suc, fail) => {
        const errors = [];
        if (!build.name) {
            errors.push("Missing job name")
        }

        if (!build.branch) {
            errors.push("Missing branch name")
        }

        if (!build.status) {
            errors.push("Missing status")
        }

        if (!build.buildJenkinsId) {
            errors.push("Missing buildJenkinsId")
        }

        if (errors.length > 0) {
            fail({message: errors.join("; ")});
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

        suc(build);
    })

}

function processJenkinsId(jenkinsId) {

    const data = {
        jobUrl: null,
        buildUrl: null,
        buildNr: null,
        jobName: null
    }

    try {

        if (jenkinsId.indexOf("http") == -1) {
            return null
        }
        let url = jenkinsId
        url = url.substr(0, url.length - 1)
        let string = url.replace("//", "/")
        let data = string.split("/")

        const buildNr = data.pop()
        const jobName = data.pop()
        const position = url.lastIndexOf("/")
        const jobUrl = url.substr(0, position)

        data.buildUrl = jenkinsId
        data.buildNr = buildNr
        data.jobName = jobName
        data.jobUrl = jobUrl

        return data

    } catch (e) {
        console.error(e)
        return null
    }
}

function processBuildPost(buildPost) {
    let jobName = null
    let branchName = null
    let jobId = null
    let branchId = null

    return validateBuildPost(buildPost)
        .then(buildPost => {
            jobName = buildPost.name
            branchName = buildPost.branch
            return jobName
        })
        .then(jobs.getOrCreateJob)
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
        .then(builds => {
            return builds.map(build => {
                build.rawStatus = build.status
                build.rawTime = build.time
                build.rawDuration = build.duration
                build.duration = msToTime(build.rawDuration)
                build.rawLastGodBuildTime = build.lastGodBuildTime

                if (build.buildJenkinsId) {
                    const jenkinsData = processJenkinsId(build.buildJenkinsId)
                    if (jenkinsData) {
                        build.hasJenkinsData = true
                        build.jenkinsData = jenkinsData
                    } else {
                        build.hasJenkinsData = false
                    }
                }

                build.status = map(build.rawStatus)
                build.time = utils.prettyDate(build.rawTime)
                build.lastGodBuildTime = utils.prettyDate(build.lastGodBuildTime)
                return build
            })
        })
}

exports.processBuildPost = processBuildPost
exports.getBuilds = getBuilds
