const NodeCache = require('node-cache')

const myCache = new NodeCache();

function flush() {
    console.log('clearing cache')
    myCache.flushAll()
}

function get(key) {
    return myCache.get(key)
}

function set(key, value, ttl) {
    return myCache.set(key, value, ttl)
}

exports.flush = flush
exports.set = set
exports.get = get
