const fs = require("fs");
const { getFiles } = require("./getLines");

const DBFileWriteServices = (() => {

  const saveDB = async (database, dbPath) => {
    const date = new Date();
    const filename = `${dbPath}DB_${date.getTime()}.json`;
    const wstream = fs.createWriteStream(filename, { flags: "w" });
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
      const getTicTime = filename => Number(filename.split("_")[1].split(".")[0]);
      const sortByTicTimeDesc = (a, b) => getTicTime(b) - getTicTime(a);
      const addPath = file => `${dbPath}\\${file}`;

      const theFiles = await getFiles(dbPath);
      const fileNamesSorted = theFiles.sort(sortByTicTimeDesc).map(addPath);
      if (fileNamesSorted.length ) {
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

  return {
    retrieveDB: retrieveDB,
    saveDB: saveDB
  };
})();

module.exports = DBFileWriteServices;
