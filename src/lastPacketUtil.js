// Public Methods.
const createPacket = ( name, lastPacketState, thisData)=>{
    // Create a packet which is defined by the name of the creator (e.g., ;4000'), the sequential id value (e.g., 100), and an array of arbitrary data.
    // Each element of the data property is tagged with the packet key of the parent packet. which is name-id (e.g., 4000-100.
    if( typeof name !== 'string' || typeof lastPacketState !== 'object' || !Array.isArray(thisData) ){ throw 'Invalid createPacket request';}
    const packet = {
        name: name,
        id: getLastPacketIDForName( name, lastPacketState) + 1,
    };

    const assignPacketKey = obj => Object.assign( {}, obj, { packetKey: `${getPacketKey(packet)}`});
    return Object.assign( {}, packet, { data: thisData.map( assignPacketKey ) } );
};

const updateLastPacketState = ( lastPacketState, successfulPacket, validateStateChange) =>{
    if( typeof lastPacketState !== 'object' || typeof successfulPacket !== 'object' ){ throw 'Invalid updateLastPacketState request';}
    if( !successfulPacket.hasOwnProperty('name') || !successfulPacket.hasOwnProperty('id') ){ throw 'Invalid successfulPacket object';}
    if( typeof successfulPacket.name !== 'string' ){ throw 'Invalid successfulPacket';}

    // Default id to zero if not present or invalid.
    successfulPacket.id = typeof successfulPacket.id === 'number' ? successfulPacket.id : 0;

    // validateStateChange usually but on the start up of a replica, just assign whatever id the replica provides.
    if( validateStateChange || typeof validateStateChange === 'undefined' ){
        validatePacketIDValue( lastPacketState, successfulPacket );
    }

    const newLastPacketState =  Object.assign( {}, lastPacketState );
    newLastPacketState[successfulPacket.name] = successfulPacket.id;
    return newLastPacketState;
};

const getPacketKey = packet =>{
    return isPacket( packet) ? `${String(packet.name)}-${packet.id}` : 'unk-0';
}

const getPacketID = packet =>{
    return isPacket( packet) ? Number(packet.id) : 0;
}

const getPacketName = packet =>{
    return isPacket( packet) ? packet.name : 'unk';
}

const getLastPacketIDForName = ( name, lastPacketState )=>{
    return lastPacketState.hasOwnProperty( String(name)) ? lastPacketState[String(name)] : 0;
}

const isPacket = packet =>{
    return packet.hasOwnProperty('id') && packet.hasOwnProperty('name') ? true : false;
}

const validatePacketIDValue = ( lastPacketState, successfulPacket )=>{
    const lastValue = getLastPacketIDForName( successfulPacket.name, lastPacketState);
    return lastValue + 1 === successfulPacket.id ? true : false;
}

module.exports = {
    createPacket,
    getLastPacketIDForName,
    getPacketID,
    getPacketKey,
    getPacketName,
    isPacket,
    updateLastPacketState,
    validatePacketIDValue
};
