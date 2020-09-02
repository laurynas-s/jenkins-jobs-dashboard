const config = {config: null}

function set(conf) {
    config.config = conf
}

function get() {
    return config.config
}

exports.set = set
exports.get = get