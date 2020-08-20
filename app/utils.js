function timeNumber(number) {
    let str = '' + number
    str = str.length > 1 ? str : '0' + str;
    return str
}

function prettyDate(dateString) {
    if (!dateString) {
        return '-'
    }
    //if it's already a date object and not a string you don't need this line:
    var date = new Date(dateString);
    var d = date.getDate();
    var y = date.getFullYear();
    return y + '-' + timeNumber(date.getMonth()) + '-' + timeNumber(d) + ' ' + timeNumber(date.getHours()) + ':' + timeNumber(date.getMinutes());
}

function formatDuration(seconds) {
    if (!seconds) {
        return '';
    }
    const hours = Math.floor(seconds / (60 * 60))
    let leftSec = seconds % (60 * 60)
    const minutes = Math.floor(leftSec / 60)
    leftSec = leftSec % 60
    let formatted = hours ? hours + ' h ' : '';
    formatted += minutes ? minutes + ' m ' : '';
    formatted += leftSec + ' s';
    return formatted
}

exports.prettyDate = prettyDate;
exports.formatDuration = formatDuration;
