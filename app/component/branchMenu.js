const branchDb = require('../db/branchesDb')
const cache = require('./cache')
const config = require('../component/config').get()
const BRANCHES_BY_PATTERN_KEY = 'menu'

function setBranchesToCache(branches) {
    cache.set(BRANCHES_BY_PATTERN_KEY, branches, 60)
    return branches
}

function mapBranchesToMenuStructure(branch) {
    if (!branch) {
        return ''
    }

    return {
        name: branch,
        link: encodeURIComponent(branch)
    }
}

function getCachedBranches() {
    let branches = cache.get(BRANCHES_BY_PATTERN_KEY)
    if (branches === null || branches === undefined) {
        return branchDb.getDistinctBranchesByPattern('release%', config.branches.last)
            .then(setBranchesToCache)
    } else {
        return Promise.resolve(branches)
    }
}

function getMenu() {
    return getCachedBranches()
        .then(branches => branches.map(mapBranchesToMenuStructure))
}

exports.getMenu = getMenu
