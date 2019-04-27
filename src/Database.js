const PromiseBB = require("bluebird");
const dbFileWriteServices = require("./dbFileWriteServices");
const { getIntegerArrayForCSVList } = require("./utils");
const { pumpDataToReplica, pingReplica } = require("./pumpDataToReplica");

class Database {
  constructor(props) {
    this.state = {
      role: props.role,
      logFolder: props.logFolder,
      logFolderArchive: props.logFolderArchive,
      dbPath: props.dbPath,
      status: "stopped",
      count: 0,
      lastID: 0,
      replicas: []
    };
    this.gcQueue = [];
    this.errorLog = [];
    this.replicationErrorLog = [];
    this.log = [];
    this.setProcessQueueHandle = 0;
    this.setProcessSaveDBHandle = 0;
    this.database = {};
  }

  getState() {
    return Object.assign({}, this.state);
  }

  setState(obj) {
    const stateKeys = Object.keys(this.state);
    Object.keys(obj).forEach(thisKey => {
      if (stateKeys.includes(thisKey)) {
        if (this.state[thisKey] !== obj[thisKey]) {
          this.state[thisKey] = obj[thisKey];
        }
      }
    });
    return this.getState();
  }

  async Start() {
    dbFileWriteServices.startArchiveProcessing( this.state.logFolder, this.state.logFolderArchive )
    this.database = await dbFileWriteServices.retrieveDB(this.state.dbPath);

    if (this.setRefreshQueueHandle !== 0) {
      clearInterval(this.setRefreshQueueHandle);
    }

    this.setProcessQueueHandle = setInterval(() => {
      this.ProcessGCQueue(this.gcQueue, this.database);
    }, 5000);

    this.setProcessSaveDBHandle = setInterval(() => {
      this.ProcessSaveDB(this.database);
    }, 60000 * 20);

    this.setState({ status: "running" });
    return await this.getState();
  };

  Stop() {
    clearInterval(this.setProcessQueueHandle);
    clearInterval(this.setProcessSaveDBHandle);

    this.setProcessQueueHandle = 0;
    this.setProcessSaveDBHandle = 0;

    this.CleanUpBeforeStop();
    return this.setState({ status: "stopped" });
  }

  Report() {
    const now = new Date();
    return {
      timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      keyCount: Object.keys(this.database).length,
      logCount: this.log.length,
      errorCount: this.errorLog.length
    };
  }

  ErrorLog() {
    const now = new Date();
    return {
      timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      errorCount: this.errorLog.length,
      errorLog: this.errorLog
    };
  }

  async Commit(thisData) {
    const createPacket = (data, lastID) =>{
      return Object.assign( {}, { id: lastID, data: data});
    };

    const thisPacket = createPacket( thisData, this.state.lastID + 1);
    const status = await dbFileWriteServices.logIt( thisPacket, this.state.logFolder)
    .then( result=>{
      return this.DistributeToReplicas(1, thisPacket);
    })
    .then( result =>{
      if( result ){
        this.gcQueue.push(thisPacket.data);
        this.state.count++;
        this.state.lastID++;
        return true;
      }
      return false;
    })
    .catch( error =>{
        console.log(error);
        return false;
    });
    return status;
  }

  async ProcessGCQueue(gcQueue, database) {
    let aCopy = [...gcQueue];
    if (aCopy.length > 0) {
      const maxIndex = aCopy.length - 1;
      gcQueue.splice(0, maxIndex + 1);
      for (let i = 0; i < aCopy.length; i++) {
        const thisObj = aCopy[i];
        for (let j = 0; j < thisObj.length; j++) {
          const thisRecord = thisObj[j];
          this.crudIt(thisRecord, database);
        }
      }
    }
  }

  ProcessSaveDB(database) {
    const dbFolder = this.state.dbPath;
    dbFileWriteServices.saveDB(database, dbFolder);
  }

  crudIt(thisRecord, database) {
    const logSuccessAction = thisRecord => {
      const theDate = new Date();
      this.log.push({
        Action: `${thisRecord.crud}`,
        key: thisRecord.key,
        time: theDate.getTime()
      });
    };

    if (thisRecord.key.trim().length === 0) {
      const theDate = new Date();
      this.errorLog.push({
        Error: `Cannot ${thisRecord.crud}, key is blank.`,
        Record: thisRecord,
        time: theDate.getTime()
      });
      return;
    }

    switch (thisRecord.crud) {
      case "insert": {
        if (database.hasOwnProperty(thisRecord.key)) {
          const theDate = new Date();
          this.errorLog.push({
            Error: `Cannot ${thisRecord.crud}, key ${
              thisRecord.key
            } already exists.`,
            Record: thisRecord,
            time: theDate.getTime()
          });
          return;
        }
        database[thisRecord.key] = thisRecord;
        logSuccessAction(thisRecord);
        break;
      }
      case "delete": {
        if (!database.hasOwnProperty(thisRecord.key)) {
          const theDate = new Date();
          this.errorLog.push({
            Error: `Cannot ${thisRecord.crud}, key ${
              thisRecord.key
            } does not exist.`,
            Record: thisRecord,
            time: theDate.getTime()
          });
          return;
        }
        delete database[thisRecord.key];
        logSuccessAction(thisRecord);
        break;
      }
      case "update": {
        if (!database.hasOwnProperty(thisRecord.key)) {
          const theDate = new Date();
          this.errorLog.push({
            Error: `Cannot ${thisRecord.crud}, key ${
              thisRecord.key
            } does not exist.`,
            Record: thisRecord,
            time: theDate.getTime()
          });
          return;
        }
        database[thisRecord.key] = thisRecord;
        logSuccessAction(thisRecord);
        break;
      }
    }
  }

  CleanUpBeforeStop() {
    this.ProcessGCQueue(this.gcQueue, this.database);
    this.ProcessSaveDB(this.database);
  }

  // Replicas do not have these
  setReplicas(list) {
    const replicas = getIntegerArrayForCSVList(list);
    this.setState({ replicas: [...replicas] });
    return this.getState();
  }

  async PingReplicas() {
    const promiseArray = [];
    for (let i = 0; i < this.state.replicas.length; i++) {
      const thePromise = pingReplica(this.state.replicas[i]);
      promiseArray.push(thePromise);
    }
    const results = await Promise.all(promiseArray).then(pingResults => {
      return pingResults;
    });
    return results;
  }

  async DistributeToReplicas(countRequiredToConfirm, thisRecord) {
    const promiseArray = [];
    for (let i = 0; i < this.state.replicas.length; i++) {
      const thePromise = pumpDataToReplica(this.state.replicas[i], thisRecord);
      promiseArray.push(thePromise);
    }
    if( promiseArray.length === 0 ){
      // If no replicas exist then treat that as success.
      return true;
    }
    const result = await PromiseBB.some(promiseArray, countRequiredToConfirm)
      .then(results => {
        if( countRequiredToConfirm <= results.filter(obj => obj.status).length ) {
          return true;
        }
        else{
          this.replicationErrorLog.push({ id: thisRecord.id });
          return false;
        }
      })
      .catch(PromiseBB.AggregateError, function(err) {
        err.forEach(function(e) {
          console.error(e.stack);
        });
        this.replicationErrorLog.push({ id: thisRecord.id });
        return false;
      });
    return result;
  }

  ReplicationErrorLog() {
    const now = new Date();
    return {
      timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      errorCount: this.replicationErrorLog.length,
      errorLog: this.replicationErrorLog
    };
  }
}

module.exports = { Database: Database };
