const fs = require('fs');
const readline = require('linebyline');

const getFiles = logFolder => {
    const thePromise = new Promise( (resolve, reject )=>{
        fs.readdir(logFolder, (err, files) => {
            if(err) reject( err );
            resolve( files );
        });
    });
    return thePromise;
};

const getFileLines = (filename, archiveName, thisArray) => {
    const rl = readline(filename);
    rl.on('line', function(line, lineCount, byteCount) {
        thisArray.push( JSON.parse(line) );
    })
    .on('error', e => {
        console.log(e);
    })
    .on('close', e => {
        fs.rename(filename, archiveName, err =>{
            if( err) console.log( err);
        });
    });
};

module.exports = {
    getFiles,
    getFileLines
};
