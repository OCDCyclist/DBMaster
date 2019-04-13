const dbFileWriteServices = require('./dbFileWriteServices');
const {getFiles, getFileLines} = require('./getLines');

class Database {
  constructor(role) {
    this.state = {
      role: role,
      status: 'stopped',
      count: 0,
      lastID: 0
    };
    this.gcQueue = [];
    this.errorLog = [];
    this.log = [];
    this.setRefreshGCQueueHandle = 0;
    this.setProcessGCQueueHandle = 0

    this.database = {};
  }

  getState() {
    return Object.assign( {}, this.state );
  };

  setState( obj ){
    const stateKeys = Object.keys( this.state);
    Object.keys( obj).forEach( thisKey =>{
      if( stateKeys.includes(thisKey) ){
        if( this.state[thisKey] !== obj[thisKey] ){
          this.state[thisKey] = obj[thisKey];
        }
      }
    });
    return this.getState();
  };

  Start() {
    dbFileWriteServices.startProcessing(1000);

    if( this.setRefreshGCQueueHandle !== 0 ){
      clearInterval(this.setRefreshGCQueueHandle);
    }

    this.setRefreshGCQueueHandle = setInterval( ()=>{
      this.RefreshGCQueue(this.gcQueue);
    }, 5000 );

    this.setProcessGCQueueHandle = setInterval( ()=>{
      this.ProcessGCQueue(this.gcQueue, this.database);
    }, 1000 );

    return this.setState ( { status: 'running'});
  };

  Stop() {
    dbFileWriteServices.stopProcessing();
    return this.setState ( { status: 'stopped'});
  };

  Report() {
    console.log( '========== Database ===========');
    Object.keys( this.database).forEach( key =>{
      console.log( `${key}`);
    });
    console.log( '========== Database ===========');
    console.log('');
    console.log( '========== Log ===========');
    this.log.forEach( log =>{
      console.log( `${log.Action} ${log.key}`);
    });
    console.log( '========== Log ===========');
    console.log('');
    console.log( '========== Errors ===========');
    this.errorLog.forEach( error =>{
      console.log( `${error.Error}`);
    });
    console.log( '========== Errors ===========');
    console.log('');
    console.log('');
  };

  Commit( thisData){
    this.state.count++;
    this.state.lastID++;
    return dbFileWriteServices.logIt(this.state.lastID, thisData);
  };

  async RefreshGCQueue (gcQueue){
    const logFolder = process.env.LOGDBPATH;
    const logArchive = process.env.LOGARCHIVEDBPATH;
    const theFiles = await getFiles(logFolder);

    const sortedFiles = theFiles.sort( (a,b)=>{
      const startA = Number(a.split('_')[1].split('-')[0]);
      const startB = Number(b.split('_')[1].split('-')[0]);
      return startA - startB;
    });
    for( let i = 0; i < sortedFiles.length; i++ ){
      getFileLines( `${logFolder}${theFiles[i]}`, `${logArchive}${theFiles[i]}`, gcQueue);
    }
  };

  async ProcessGCQueue (gcQueue, database){
    let aCopy = [...gcQueue];
    if( aCopy.length > 0){
      const maxIndex = aCopy.length - 1;
      gcQueue.splice(0, maxIndex+1);
      for( let i = 0; i < aCopy.length; i++ ){
        const thisObj = aCopy[i];
        for( let j = 0; j < thisObj.data.length; j++){
          const thisRecord = thisObj.data[j];
          this.crudIt( thisRecord, database );
        }
      }
    }
  };

  crudIt( thisRecord, database){
    const logSuccessAction = thisRecord =>{
      const theDate = new Date();
      this.log.push( { Action: `${thisRecord.crud}`, key: thisRecord.key, time: theDate.getTime() });
    }

    if( thisRecord.key.trim().length === 0){
      const theDate = new Date();
      this.errorLog.push( { Error: `Cannot ${thisRecord.crud}, key is blank.`, Record: thisRecord, time: theDate.getTime()})
      return;
    }

    switch( thisRecord.crud){
      case 'insert':{
        if( database.hasOwnProperty(thisRecord.key)){
          const theDate = new Date();
          this.errorLog.push( { Error: `Cannot ${thisRecord.crud}, key ${thisRecord.key} already exists.`, Record: thisRecord, time: theDate.getTime()})
          return;
        }
        database[thisRecord.key] = thisRecord;
        logSuccessAction(thisRecord);
        break;
      }
      case 'delete':{
        if( !database.hasOwnProperty(thisRecord.key)){
          const theDate = new Date();
          this.errorLog.push( { Error: `Cannot ${thisRecord.crud}, key ${thisRecord.key} does not exist.`, Record: thisRecord, time: theDate.getTime()})
          return;
        }
        delete database[thisRecord.key];
        logSuccessAction(thisRecord);
        break;
      }
      case 'update':{
        if( !database.hasOwnProperty(thisRecord.key)){
          const theDate = new Date();
          this.errorLog.push( { Error: `Cannot ${thisRecord.crud}, key ${thisRecord.key} does not exist.`, Record: thisRecord, time: theDate.getTime()})
          return;
        }
        database[thisRecord.key] = thisRecord;
        logSuccessAction(thisRecord);
        break;
      }
    }
  }
}

module.exports = { Database: Database };
