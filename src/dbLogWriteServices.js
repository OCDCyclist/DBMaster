const fs = require('fs');
const {getPacketKey} = require('./lastPacketUtil');

const DBLogWriteServices = ( () => {
  // Private Methods and properties follow
  const state = {
    logFolder: '',
    logFolderArchive: '',
    name: '',
    openArchiveFilename: '',
    openArchiveWriteStream: null
  };
  setBumpArchiveID = 0

  const logIt = async packet => {
    if( state.openArchiveWriteStream === null ){
      createWriteStream( getPacketKey(packet) );
    }
    state.openArchiveWriteStream.write(`${JSON.stringify(packet)}\n`);
    return true;
  };

  const start = (thisLogFolder, thisLogFolderArchive, thisName) => {
    state.logFolder       = thisLogFolder;
    state.logFolderArchive= thisLogFolderArchive;
    state.name            = thisName;

    setBumpArchiveID = setInterval(() => {
      bumpToArchive();
    }, 1000 * 60 * 5);
  };

  const stop = () => {
    clearInterval(setBumpArchiveID);
    bumpToArchive();
  };

  const createWriteStream = packetKey =>{
    state.openArchiveFilename = `Archive_${packetKey}.json`;
    state.openArchiveWriteStream = fs.createWriteStream(`${state.logFolder}${state.openArchiveFilename}`, { flags: "a" });
    state.openArchiveWriteStream.on("error", err => {
      console.log(`Error: ${err}`);
    });
  };

  const closeWriteStream = () => {
    try {
      if (state.openArchiveWriteStream != null) {
        state.openArchiveWriteStream.close();
        state.openArchiveWriteStream = null;
        return true;
      }
    } catch (err) {
      state.openArchiveWriteStream = null;
    }
    return false;
  };

  const bumpToArchive=()=>{
    closeWriteStream();
    renameArchiveFile();
  };

  const renameArchiveFile = () => {
    if( state.openArchiveFilename.length > 1 ){
      const filename = `${state.logFolder}${state.openArchiveFilename}`;
      const newFileName = `${state.logFolderArchive}${state.openArchiveFilename}`;
      fs.exists(filename, (exists)=>{
        if( exists ){
          fs.rename( filename, newFileName, err =>{
            if( err ) { console.log(err); }
          });
        }
      })
    }
  };

  return {
    bumpToArchive: bumpToArchive,
    logIt: logIt,
    start: start,
    stop: stop
  };
})();

module.exports = DBLogWriteServices;
