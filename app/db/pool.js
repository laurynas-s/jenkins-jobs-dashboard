const mysql      = require('mysql');
const configReader = require('yml-config-reader')
const config = configReader.getByEnv(process.env.STAGE)

const pool  = mysql.createPool({
    connectionLimit : 2,
    host     : config.mysql.host,
    user     : config.mysql.user,
    password : '' + config.mysql.pass,
    database : config.mysql.database
});

console.log("Database pool initiated")

function query(sql, params=[]) {
    return new Promise((suc, fail) => {
        try {
            pool.query(sql, params, function (err, result, fields) {
                if (err) {
                    fail(err)
                }

                suc(result, fields)

            });
        } catch (err) {
            console.error(err)
            fail(err)
        }
    })
}

function closePool() {
    console.log("Closing DB pool")
    return new Promise(suc => {
        pool.end(function (err) {
            if (err) {
                console.error("DB pool close throw error: ")
                console.error(err)
            } else {
                console.log("DB pool closed")
            }
            suc()
        });

    })
}

function escape(value) {
    return pool.escape(value)
}

exports.escape = escape
exports.query = query
exports.closePool = closePool
