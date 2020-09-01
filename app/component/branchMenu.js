const branchDb = require('../db/branchesDb')
const cache = require('./cache')
const configReader = require('yml-config-reader')

const config = configReader.getByEnv(process.env.STAGE)
const BRANCHES_BY_PATTERN_KEY = 'menu'

function setBranchesToCache(branches) {
    console.log('caching menu')
    cache.set(BRANCHES_BY_PATTERN_KEY, branches, 60)
    return branches
}

function getCachedBranches() {
    let branches = cache.get(BRANCHES_BY_PATTERN_KEY)
    if (branches === null || branches === undefined) {
        return branchDb.getDistinctBranchesByPattern('release%', config.branches.last)
            .then(setBranchesToCache)
    } else {
        console.log('got menu cache')
        return Promise.resolve(branches)
    }
}

function getMenu() {


    return getCachedBranches()

    // select branches by pattern
    // last N
    // cache

}

exports.getMenu = getMenu
