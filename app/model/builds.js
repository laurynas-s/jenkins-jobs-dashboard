const jobs = require('./jobs')
const buildsDb = require('../db/buildsDb')
const branches = require('./branches')
const utils = require('../utils')
const cache = require('../component/cache')
const config = require('../component/config').get()

const statusMap = {'ok': 1, 'building': 2, 'error': 3, 'missing': 4, 'timeout': 5}

const cacheKeys = {
    BUILDS: "builds",
    BRANCHES: "branches",
    JOBS: "jobs",
    JOB_BRANCH: "jobsBranch"
}

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

function processMultibranchLink(link) {
    let url = link
    let parts = url.split("/")

    parts.pop()
    const buildNr = parts.pop()
    const branchName = parts.pop()
    parts.pop()
    const jobName = parts.pop()
    const jobUrl = "/job/" + jobName
    const buildUrl = "/job/" + jobName + "/job/" + branchName + "/" + buildNr

    const data = {}
    data.buildUrl = config.environment.jenkins + buildUrl
    data.buildNr = buildNr
    data.jobName = jobName
    data.jobUrl = config.environment.jenkins + jobUrl

    return data
}

function processSimpleLink(link) {
    let url = link
    let parts = url.split("/")

    const buildNr = parts.pop()
    const jobName = parts.pop()
    const position = url.lastIndexOf("/")
    const jobUrl = url.substr(0, position)

    const data = {}
    data.buildUrl = config.environment.jenkins + '/job/' + jobName + '/' + buildNr
    data.buildNr = buildNr
    data.jobName = jobName
    data.jobUrl = config.environment.jenkins + jobUrl

    return data
}

function processJenkinsId(jenkinsId) {

    try {

        if (jenkinsId.indexOf("http") != -1) {
            return processMultibranchLink(jenkinsId)
        }

        if (jenkinsId.indexOf("/") == -1) {
            return null
        }

        return processSimpleLink(jenkinsId)

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
            return buildsDb.getLastNotFinishedBuild(branchId, buildPost.buildJenkinsId)
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

function formatBuilds(builds) {
    return builds.map(build => {
        build.rawStatus = build.status
        build.rawTime = build.time
        build.rawDuration = build.duration
        build.duration = msToTime(build.rawDuration)
        build.rawLastGodBuildTime = build.lastGodBuildTime
        build.jobLink = encodeURIComponent(build.name)
        build.encodedBranch = encodeURIComponent(build.branch)

        if (build.buildJenkinsId) {
            const jenkinsData = processJenkinsId(build.buildJenkinsId)
            if (jenkinsData) {
                build.hasJenkinsData = true
                build.jenkinsData = jenkinsData
            } else {
                build.hasJenkinsData = false
            }
        }

        if (build.rawStatus == 'building' && build.rawTime) {
            const difference = (new Date().getTime() - build.rawTime.getTime())/1000
            if (difference > 60*60*2) {
                build.rawStatus = 'timeout'
            }
        }

        build.status = map(build.rawStatus)
        build.time = utils.prettyDate(build.rawTime)
        build.lastGodBuildTime = utils.prettyDate(build.lastGodBuildTime)
        return build
    })
}

function getBuilds() {

    const cached = cache.get(cacheKeys.BUILDS);
    if (cached) {
        return Promise.resolve(formatBuilds(cached))
    } else {
        return buildsDb.getBuilds()
            .then(builds => {
                cache.set(cacheKeys.BUILDS, builds, config.caching[cacheKeys.BUILDS])
                return builds
            })
            .then(formatBuilds)
    }
}


function getBranchBuilds(branch) {
    const key = cacheKeys.BRANCHES + '.' + branch;
    const cached = cache.get(key);
    if (cached) {
        return Promise.resolve(formatBuilds(cached))
    } else {
        return buildsDb.getBranchBuilds(branch)
            .then(result => {
                cache.set(key, result, config.caching[cacheKeys.BUILDS])
                return result
            })
            .then(formatBuilds)
    }
}

function getJobBranchesBuilds(job, page) {

    const key = cacheKeys.JOBS + '.' + job + '/' + page;
    const cached = cache.get(key);
    const limit = config.table.branches.paging

    if (cached) {
        return Promise.resolve(formatBuilds(cached))
    } else {
        return buildsDb.getJobBranchesBuilds(job, page, limit)
            .then(result => {
                cache.set(key, result, config.caching[cacheKeys.BUILDS])
                return result
            })
            .then(formatBuilds)
    }
}

function getJobBranchBuilds(branchId, page) {
    const key = cacheKeys.JOB_BRANCH + '.' + branchId + '/' + page;
    const cached = cache.get(key);
    const limit = config.table.branches.paging

    if (cached) {
        return Promise.resolve(formatBuilds(cached))
    } else {
        return buildsDb.getJobBranchBuilds(branchId, page, limit)
            .then(result => {
                cache.set(key, result, config.caching[cacheKeys.BUILDS])
                return result
            })
            .then(formatBuilds)
    }

}

exports.processBuildPost = processBuildPost
exports.getBuilds = getBuilds
exports.getBranchBuilds = getBranchBuilds
exports.getJobBranchesBuilds = getJobBranchesBuilds
exports.getJobBranchBuilds = getJobBranchBuilds
