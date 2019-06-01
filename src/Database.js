const PromiseBB = require("bluebird");
const dbDBWriteServices = require("./dbDBWriteServices");
const dbLogWriteServices = require("./dbLogWriteServices");
const dbLogReadServices = require("./dbLogReadServices");
const {getIntegerArrayForCSVList} = require("./utils");
const {pumpDataToReplica, pingReplica, startReplica, stopReplica} = require("./pumpDataToReplica");
const {createPacket, getLastPacketIDForName, getPacketID, getPacketName, updateLastPacketState} = require('./lastPacketUtil');

class Database {
  constructor(props) {
    this.state = {
      name: props.name,
      role: props.role,
      logFolder: props.logFolder,
      logFolderArchive: props.logFolderArchive,
      dbPath: props.dbPath,
      status: "stopped",
      lastPacketState: {},
      replicas: props.replicas,
    };
    this.gcQueue = [];
    this.errorLog = [];
    this.replicationErrorLog = [];
    this.log = [];
    this.setProcessQueueHandle = 0;
    this.setProcessSaveDBHandle = 0;
    this.setProcessHoldingPatternHandle = 0;
    this.database = {};
    this.holdingPattern = [];
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
    dbLogWriteServices.start( this.state.logFolder, this.state.logFolderArchive, this.state.name );
    this.database = await dbDBWriteServices.retrieveDB(this.state.dbPath);
    if( this.database.hasOwnProperty('lastPacketKey') ){
      const arr = this.database.lastPacketKey.split('-');
      this.state.lastPacketState[arr[0]] = Number(arr[1]);
    }

    if (this.setProcessQueueHandle !== 0) {
      clearInterval(this.setProcessQueueHandle);
    }

    if (this.setProcessSaveDBHandle !== 0) {
      clearInterval(this.setProcessSaveDBHandle);
    }

    if( this.setProcessHoldingPatternHandle !== 0){
      clearInterval(this.setProcessHoldingPatternHandle);
    }

    this.setProcessQueueHandle = setInterval(() => {
      this.ProcessGCQueue(this.gcQueue, this.database);
    }, 5000);

    this.setProcessSaveDBHandle = setInterval(() => {
      this.ProcessSaveDB(this.database);
    }, 60000 * 20);

    if( this.state.role === 'Replica'){
      // Processing the holding pattern only applies to Replicas.
      this.setProcessHoldingPatternHandle = setInterval(() => {
        this.ProcessHoldingPattern(this.holdingPattern);
      }, 100);
    }

    this.setState({ status: "running" });
    return await this.getState();
  };

  Stop() {
    clearInterval(this.setProcessQueueHandle);
    clearInterval(this.setProcessSaveDBHandle);

    this.setProcessQueueHandle = 0;
    this.setProcessSaveDBHandle = 0;

    dbLogWriteServices.stop();

    this.CleanUpBeforeStop();
    return this.setState({ status: "stopped" });
  }

  Report() {
    const now = new Date();
    return {
      timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      name: this.state.name,
      role: this.state.role,
      status: this.state.status,
      keyCount: Object.keys(this.database).length,
      logCount: this.log.length,
      holdingPattern: this.holdingPattern.length,
      errorCount: this.errorLog.length,
      lastPacketState: this.state.lastPacketState,
    };
  }

  SetReplicas(list) {
    const integerList = getIntegerArrayForCSVList(list);
    if( this.state.role !== 'Leader') return false;

    this.setState({ replicas: [...integerList] });
    return this.getState();
  }

  async DistributeToReplicas(packet) {
    const promiseArray = [];

    for (const replica of this.state.replicas) {
      promiseArray.push( pumpDataToReplica(replica, packet));
    }

    if( promiseArray.length === 0 ){
      // If no replicas exist then treat that as success.
      return true;
    }

    Promise.all(promiseArray)
      .then( allResults => {
        allResults.forEach( thisResult =>{
          if( thisResult.status ){
            this.state.lastPacketState = updateLastPacketState( this.state.lastPacketState, {  name: thisResult.replica, id: thisResult.id }, true );
          }
          else{
            console.log(thisResult);
          }
        })
    }).catch( err=>{
      console.log(err);
    });
  }

  async DistributeToReplica(replica, thisPacket) {
    // This method is called by the Leader to send packet to a specific replica that fell behind. These packets have already been committed by the Leader.
    pumpDataToReplica(replica, thisPacket);
    return true;
  }

  async PingReplicas() {
    if( this.state.role !== 'Leader'){ return 'Only the leader can ping the replicas.'; }

    const promiseArray = [];
    promiseArray.push( this.Report() );
    for (const replica of this.state.replicas) {
      promiseArray.push( pingReplica(replica) );
    }

    const results = await Promise.all(promiseArray).then(pingResults => {
      return pingResults;
    });
    return results;
  }

  async StartReplicas() {
    if( this.state.role !== 'Leader'){ return 'Only the leader can start the replicas.'; }

    const promiseArray = [];
    for (const replica of this.state.replicas) {
      promiseArray.push( startReplica( replica) );
    }

    const results = await Promise.all(promiseArray).then(pingResults => {
      return pingResults;
    });

    const leaderName = this.state.name;
    results.forEach( thisResult =>{
      this.state.lastPacketState = updateLastPacketState( this.state.lastPacketState, {  name: thisResult.name, id: thisResult.lastPacketState[leaderName] }, false );
    })
    return this.getState();
  }

  async CheckReplicaStatus(){
    const result = [];

    const createObj = ( name, lastID)=>{
      let obj = {};
      obj[name] = lastID;
      return obj;
    };

    const lastPacketIDLeader= getLastPacketIDForName( this.state.name, this.state.lastPacketState );
    result.push( createObj( this.state.name, lastPacketIDLeader ));
    for (const replica of this.state.replicas) {
      const lastPacketID= getLastPacketIDForName( replica, this.state.lastPacketState );
      result.push( createObj( replica, lastPacketID ));
    }
    return result;
  }

  async CatchupReplica(list) {
    // CatchupReplica checks if the requested replica is up to date.
    // If not, then it resends packets that are not reflected in this replica.
    if( this.state.role !== 'Leader'){ return { status: "Error", message: "Only Leader can catchup a replica"} };

    const integerList = getIntegerArrayForCSVList(list);
    const replica = this.state.replicas.filter( obj => integerList.includes(obj) );
    if( replica.length === 0 ){ return { status: "Error", message: "Invalid replica"}; }

    const status = await this.CheckReplicaStatus();
    const lastPacketIDLeader = status[0][this.state.name];
    const lastPacketIDReplica = status[1][replica[0]];
    if( lastPacketIDLeader > lastPacketIDReplica){
      dbLogReadServices.sendPacketFromArchive(this.state.logFolderArchive, replica[0], lastPacketIDReplica, this.DistributeToReplica);
    }
    else{
      return { status: "OK", message: "No catchup required"};
    }
  }

  async StopReplicas() {
    if( this.state.role !== 'Leader'){ return 'Only the leader can stop the replicas.'; }
    
    const promiseArray = [];
    for (const replica of this.state.replicas) {
      promiseArray.push( stopReplica(replica) );
    }

    const results = await Promise.all(promiseArray).then(pingResults => {
      return pingResults;
    });
    return results;
  }

  ErrorLog() {
    const now = new Date();
    return {
      timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      errorCount: this.errorLog.length,
      errorLog: this.errorLog
    };
  }

  async Commit(thisData){
    if( this.state.role === 'Leader' ){
      return this.CommitForLeader(thisData);
    }
    else{
      this.holdingPattern.push( thisData );
      return true;
    }
  }

  async CommitForLeader(thisData) {
    // The Leader assigns a packet id to itself and to each individual transaction in the packet data.
    const packet = createPacket( this.state.name, this.state.lastPacketState, thisData);
    return await dbLogWriteServices.logIt( packet )
    .then( result=>{
      this.state.lastPacketState = updateLastPacketState( this.state.lastPacketState, packet, true );
      return this.DistributeToReplicas(packet);
    })
    .then( result =>{
      this.gcQueue.push(packet.data);
      return true;
    })
    .catch( error =>{
        console.log(error);
        return false;
    });
  }

  async ProcessGCQueue(gcQueue, database) {
    // The gcQueue are records to process into the DB via a CRUD type operation.
    // Make a local copy of a batch of records to process and remove those records from the gcQueue.
    // The gcQueue is "live" at all times.
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

  async ProcessHoldingPattern( holdingPattern){

    //Make sure holdingPattern is sorted
    holdingPattern = holdingPattern.sort( (a,b)=>{ return a.id - b.id; });

    let keepGoing = true;
    while( keepGoing){
      // Get next expected id.
      const thisPacket  = holdingPattern[0];
      const lastPacketID= getLastPacketIDForName( getPacketName(thisPacket), this.state.lastPacketState );
      const thisPacketID= getPacketID(thisPacket);

      if( thisPacketID <= lastPacketID ){
        // thisPacket is in the past and can be skipped.
        holdingPattern.shift();
        keepGoing = holdingPattern.length == 0 ? false : true;
      }
      else if( thisPacketID === lastPacketID + 1){
        const isSuccessful = await dbLogWriteServices.logIt( thisPacket );
        if( isSuccessful){
          this.state.lastPacketState = updateLastPacketState( this.state.lastPacketState, thisPacket, true );
          this.gcQueue.push(thisPacket.data);
  
          holdingPattern.shift();
          keepGoing = holdingPattern.length == 0 ? false : true;
        }
        else{
          keepGoing = false;
        }
      }
    }
  }

  ProcessSaveDB(database) {
    const dbFolder = this.state.dbPath;
    dbDBWriteServices.saveDB(database, dbFolder);
  }

  BumpArchive(){
    return dbLogWriteServices.bumpToArchive();
  }

  crudIt(thisRecord, database) {
    const logSuccessAction = (thisRecord, database) => {
      database.lastPacketKey = thisRecord.packetKey;
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
        logSuccessAction(thisRecord, database);
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
        logSuccessAction(thisRecord, database);
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
        logSuccessAction(thisRecord, database);
        break;
      }
    }
  }

  CleanUpBeforeStop() {
    this.ProcessGCQueue(this.gcQueue, this.database);
    this.ProcessSaveDB(this.database);
  }

  ReplicationErrorLog() {
    if( this.state.role !== 'Leader') return {timestamp: '', errorCount: 0, errorLog: []};

    const now = new Date();
    return {
      timestamp: `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
      errorCount: this.replicationErrorLog.length,
      errorLog: this.replicationErrorLog
    };
  }

  ShowHoldingPattern() {
    if( this.state.role === 'Leader') return {status: 'Error', message: 'Only a replica can have a holding pattern to view' };
    return { replica: this.state.name, holdingPattern: this.holdingPattern};
  }
}

module.exports = { Database: Database };
