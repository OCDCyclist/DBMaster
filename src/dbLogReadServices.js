const fs = require("fs");
const readline = require('readline');
const {getPacketID} = require('./lastPacketUtil');
const {getFiles} = require("./getLines");
const {findFilesFromArchive} = require("./utils");

const SendThisFile = async( filename, lastPacketID, replica, sendToHere)=>{
  const thePromise = new Promise( (resolve, reject)=>{
    const fileStream = fs.createReadStream( filename );
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    rl.on('line', (line)=>{
      const thisPacket = JSON.parse(line);
      const thisPacketID = getPacketID(thisPacket);
      if( thisPacketID > lastPacketID){
        sendToHere(replica, thisPacket);
      }
    });
    rl.on('close', (err)=>{
      resolve(true);
    });
    rl.on('error', (err)=>{
      reject(false);
    });

  });
  return thePromise;
};

const DBLogReadServices = (() => {
  const sendPacketFromArchive = async (logFolderArchive, replica, lastPacketID, sendToHere)=>{
    // Read the files in the log folder
    getFiles( logFolderArchive)
      .then( async allFiles =>{
        const filesWithDataToSend = findFilesFromArchive(allFiles, lastPacketID);

        for( let i = 0; i < filesWithDataToSend.length; i++ ){
          const fqfn = `${logFolderArchive}${filesWithDataToSend[i]}`;
          const result = await SendThisFile( fqfn, lastPacketID, replica, sendToHere );
          if( result === false){
            console.log(`Stopping because ${fqfn} returned false`);
            //let = filesWithDataToSend.length;
          }
          else{
            console.log(`${fqfn} sent`);
          }
        }
      });
  };

  return {
    sendPacketFromArchive: sendPacketFromArchive
  };
})();

module.exports = DBLogReadServices;
