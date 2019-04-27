
const getIntegerArrayForCSVList = list => {
    return list.split(',')
        .filter( obj => Number.isSafeInteger(Number(obj)) && Number(obj) > 0)
        .map( obj => Number(obj));
};

module.exports = {
    getIntegerArrayForCSVList
};
