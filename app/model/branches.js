const branchesDb = require('../db/branchesDb')

function getOrCreateBranch(name, jobId, main=false) {
    return branchesDb.getBranchByNameAndJob(name, jobId)
        .then(branch => {
            if (!branch) {
                const newBranch = {
                    jobId: jobId,
                    branch: name,
                    main: main ? 1 : 0,
                    created: new Date(),
                }
                console.log(`New branch ${name} for jobId ${jobId}`)
                return branchesDb.insertBranch(newBranch)
                    .then(result => {
                        newBranch.id = result.insertId
                        return newBranch
                    })
            }
            return branch
        })
}

exports.getOrCreateBranch = getOrCreateBranch
