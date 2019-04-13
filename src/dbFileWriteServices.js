const fs = require('fs');

const DBFileWriteServices = ( ()=>{
    //Private properties.
    const processQueue = [];
    let setIntervalHandle = 0;
    
    const createWriteStream = (start, end) =>{
        wstream = fs.createWriteStream(`D:\\Playground\\DistributedDB\\DBMaster\\data\\logs\\DBLogFile_${start}-${end}.json`, {flags:'a'});
        wstream.on('error', err=>{
            console.log(`ERROR: ${err}`);
            return false;
        });
        return wstream;
    }

    // Public Methods follow
    const logIt = (id, dataObject )=>{
        processQueue.push( logItem( id, dataObject ) );
        return { status: true};
    };

    const startProcessing = intervalInMilliSeconds =>{
        if( setIntervalHandle !== 0 ){
            clearInterval(setIntervalHandle);
        }
        setIntervalHandle = setInterval( processLog, intervalInMilliSeconds );
    };

    const stopProcessing = ()=>{
        if( setIntervalHandle !== 0 ){
            processLog();
            clearInterval(setIntervalHandle);
            setIntervalHandle = 0;
        }
    };

    // Private Methods follow
    const logItem = (id, dataObject)=>{
        return {
            id: id,
            data: [...dataObject]
        };
    };

    const processLog = async ()=>{
        let aCopy = [...processQueue];
        const maxIndex = aCopy.length - 1;
        processQueue.splice(0, maxIndex+1);
        if( aCopy.length > 0){
            logMessages(aCopy);
        }
    };

    const logMessages = async messagesToLog =>{
        const firstID = messagesToLog[0].id
        const lastID = messagesToLog[messagesToLog.length-1].id
        const wstream = createWriteStream(firstID, lastID);
    
        for( let i = 0; i < messagesToLog.length; i++){
            wstream.write(`${JSON.stringify(messagesToLog[i])}\n`);
        }
        wstream.end();
        return true;
    };

    return{
        logIt: logIt,
        startProcessing: startProcessing,
        stopProcessing: stopProcessing
    };
})();

module.exports = DBFileWriteServices;