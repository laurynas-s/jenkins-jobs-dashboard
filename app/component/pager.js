function getPager(page) {
    return {
        start: page == 0 ? null : '0',
        prev: page > 0 ? page-1 : null,
        page: page,
        next: page + 1
    }
}

exports.getPager = getPager