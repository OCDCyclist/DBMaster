const fs = require("fs");
const { getFiles, getFileLines } = require("./getLines");
const readline = require("linebyline");

const DBFileWriteServices = (() => {
  const logIt = async (dataPacket, packetPath) => {
    const thePromise = new Promise((resolve, reject) => {
      const filename = `${packetPath}Packet_${dataPacket.id}.json`;
      wstream = fs.createWriteStream(filename, { flags: "w" });
      wstream.on("error", err => {
        console.log(`Error: ${err}`);
        wstream.close();
        reject(err);
        return;
      });
      wstream.write(JSON.stringify(dataPacket), err => {
        if (err) {
          reject(err);
        }
        processQueue.push(dataPacket);
        wstream.close();
        resolve(true);
        return;
      });
      resolve(true);
      return;
    });
    return thePromise;
  };

  const saveDB = async (database, dbPath) => {
    const date = new Date();
    const filename = `${dbPath}DB_${date.getTime()}.json`;
    wstream = fs.createWriteStream(filename, { flags: "w" });
    wstream.on("error", err => {
      console.log(`Error: ${err}`);
      wstream.close();
      return false;
    });
    wstream.write(JSON.stringify(database), err => {
      if (err) {
        console.log(err);
      }
      wstream.close();
    });
    return true;
  };

  const retrieveDB = async dbPath => {
    const thePromise = new Promise(async (resolve, reject) => {
      const getTicTime = filename =>
        Number(filename.split("_")[1].split(".")[0]);
      const sortByTicTimeDesc = (a, b) => getTicTime(b) - getTicTime(a);
      const addPath = file => `${dbPath}\\${file}`;

      const theFiles = await getFiles(dbPath);
      const fileNamesSorted = theFiles.sort(sortByTicTimeDesc).map(addPath);
      if (fileNamesSorted.length !== 0) {
        fs.readFile(fileNamesSorted[0], "utf8", function(err, contents) {
          if (err) {
            reject(err);
          } else {
            resolve(JSON.parse(contents));
          }
        });
      } else {
        resolve({});
      }
    });
    return thePromise;
  };

  const startArchiveProcessing = (logFolder, logFolderArchive) => {
    if (processArchiveHandle !== 0) {
      closeArchiveWriteStream(writeStream);
      clearInterval(processArchiveHandle);
    }
    writeStream = createWriteStream(`${logFolderArchive}Archive.json`);

    processArchiveHandle = setInterval(() => {
      ProcessArchive(logFolder, writeStream);
    }, 5000);
  };

  const stopArchiveProcessing = () => {
    if (processArchiveHandle !== 0) {
      closeArchiveWriteStream(writeStream);
      clearInterval(processArchiveHandle);
    }
  };

  // Private Methods and properties follow
  const processQueue = [];
  let processArchiveHandle = 0;
  let writeStream = null;

  const ProcessArchive = (logFolder, thisWriteStream) => {
    getFiles(logFolder).then(files => {
      const sortFilesWithPath = files.sort().map(file => `${logFolder}${file}`);

      for (let i = 0; i < sortFilesWithPath.length; i++) {
        const rl = readline(sortFilesWithPath[i]);
        rl.on("line", function(line, lineCount, byteCount) {
          thisWriteStream.write(`${line}\n`);
        }).on("end", e => {
          fs.unlink(sortFilesWithPath[i], err => {
            if( err){
              console.log(`${sortFilesWithPath[i]} NOT deleted.`);
            }
          });
        }).on("error", e => {
          console.log(sortFilesWithPath[i], e);
        });
      }
    });
  };

  const closeArchiveWriteStream = thisWriteStream => {
    try {
      if (thisWriteStream != null) {
        thisWriteStream.close();
        thisWriteStream = null;
      }
    } catch (err) {
      thisWriteStream = null;
    }
  };

  const createWriteStream = filename => {
    closeArchiveWriteStream(writeStream);
    wstream = fs.createWriteStream(filename, { flags: "a" });
    wstream.on("error", err => {
      console.log(`Error: ${err}`);
      return false;
    });
    return wstream;
  };

  const logItem = (id, dataObject) => {
    return {
      id: id,
      data: [...dataObject]
    };
  };

  const logMessages = async (messagesToLog, filename) => {
    const wstream = createWriteStream(filename);

    for (let i = 0; i < messagesToLog.length; i++) {
      wstream.write(`${JSON.stringify(messagesToLog[i])}\n`);
    }
    wstream.end();
    return true;
  };

  return {
    logIt: logIt,
    retrieveDB: retrieveDB,
    saveDB: saveDB,
    startArchiveProcessing: startArchiveProcessing,
    stopArchiveProcessing: stopArchiveProcessing
  };
})();

module.exports = DBFileWriteServices;
