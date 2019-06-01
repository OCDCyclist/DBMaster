
const getIntegerArrayForCSVList = list => {
    return list.split(',')
        .filter( obj => Number.isSafeInteger(Number(obj)) && Number(obj) > 0)
        .map( obj => Number(obj));
};

const getFilename = date => {
    if( Object.prototype.toString.call(date) !== '[object Date]'){ return '';}
    const array = [];
    array.push( date.getFullYear().toString() );
    array.push( (1 + date.getMonth()).toString().padStart(2,'0') );
    array.push( date.getDate().toString().padStart(2,'0') );
    array.push( date.getHours().toString().padStart(2,'0') );
    array.push( date.getMinutes().toString().padStart(2,'0') );
   return `FN-${array.join('-')}.json`;
};

const findFilesFromArchive = (files, lastPacketID) =>{
      //Filenames look like: Archive_4000-19002.json
      // Find all the files with a starting id GTE provided lastPacketID
      // but also include the previous file if there is one if starting id > provided lastPacketID

      const filesToCheck = [];
      if( !Array.isArray(files) || files.length === 0 || typeof lastPacketID !== 'number') return filesToCheck;
      if( files.length === 1 ){
        filesToCheck.push( files[0]);
        return filesToCheck;
      } 
      const getTheLowerLimit = filename => Number(filename.split('-')[1].split('.')[0]);

      const sortedFiles = files.sort( (a,b)=>{
        return getTheLowerLimit(a) - getTheLowerLimit(b);
      });
      sortedFiles.forEach( (filename, index, array) => {
        try{
          const theLowerLimit =getTheLowerLimit(filename);
          if( theLowerLimit >= lastPacketID ){
            if( index > 0 && filesToCheck.length === 0 && theLowerLimit > lastPacketID){
              filesToCheck.push( array[index-1] );
            };
            filesToCheck.push( array[index] );
          }
        }
        catch( err ){ console.log(err);}
      });
      if( filesToCheck.length === 0 && files.length > 0){
        filesToCheck.push( files[files.length-1]);
      }
      return filesToCheck
};

module.exports = {
    findFilesFromArchive,
    getFilename,
    getIntegerArrayForCSVList
};
