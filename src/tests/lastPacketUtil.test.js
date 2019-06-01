const {createPacket,getLastPacketIDForName,getPacketID,getPacketKey,getPacketName,isPacket,updateLastPacketState,validatePacketIDValue} = require('../lastPacketUtil');

test("getLastPacketIDForName finds the correct last packet ID for it's name", () => {
    const packet = { name: '4000', id: 2};
    const lastPacketState = { '4000': 1}
    const actual = getLastPacketIDForName( packet.name, lastPacketState );
    expect( actual).toBe(1);
});

test("isPacket makes the correct decisino for a good packet", () => {
    const packet = { name: '4000', id: 2};
    const actual = isPacket( packet );
    expect( actual).toBe(true);
});

test("isPacket makes the correct decisino for a bad packet", () => {
    const packet = { notname: '4000', id: 2};
    const actual = isPacket( packet );
    expect( actual).toBe(false);
});

test("getPacketKey returns a packet key", () => {
    const packet = { name: '4000', id: 2};
    const actual = getPacketKey( packet );
    expect( actual).toBe('4000-2');
});

test("getPacketKey returns unk packet key for a bad packet", () => {
    const packet = { asfas: '4000', issd: 2};
    const actual = getPacketKey( packet );
    expect( actual).toBe('unk-0');
});

test("getPacketID returns ID for a good packet", () => {
    const packet = { name: '4000', id: 42};
    const actual = getPacketID( packet );
    expect( actual).toBe(42);
});

test("getPacketID returns 0 for a bad packet", () => {
    const packet = { name: '4000', idid: 42};
    const actual = getPacketID( packet );
    expect( actual).toBe(0);
});

test("getPacketName returns name for a good packet", () => {
    const packet = { name: '4000', id: 42};
    const actual = getPacketName( packet );
    expect( actual).toBe('4000');
});

test("getPacketName returns 'unk' for a bad packet", () => {
    const packet = { name: '4000', idid: 42};
    const actual = getPacketName( packet );
    expect( actual).toBe('unk');
});

test("createPacket throws an exception for missing arguments", () => {
    expect(() => {
        createPacket();
    }).toThrow('Invalid createPacket request');
});

test("createPacket throws an exception for name argument", () => {
    expect(() => {
        createPacket(123);
    }).toThrow('Invalid createPacket request');
});

test("createPacket throws an exception for bad lastPacket argument", () => {
    expect(() => {
        createPacket('4000', 'string');
    }).toThrow('Invalid createPacket request');
});

test("createPacket throws an exception for bad data argument", () => {
    expect(() => {
        createPacket('4000', {}, 123 );
    }).toThrow('Invalid createPacket request');
});

test("createPacket creates entry for new name and sets it to 1", () => {
    const actual = createPacket('4000', {}, [{ data: 'Woo Hoo'}] );
    expect( typeof actual).toBe('object');
    expect( actual.hasOwnProperty('name')).toBe(true);
    expect( actual.hasOwnProperty('id')).toBe(true);
    expect( actual.name).toBe('4000');
    expect( actual.id).toBe(1);
});

test("createPacket creates entry for existing name and increments it by 1", () => {
    const actual = createPacket('4000', {'4000': 1}, [{ xys: 'Woo Hoo'},{ lmn: 'Woo2 Hoo2'}] );
    expect( typeof actual).toBe('object');
    expect( actual.hasOwnProperty('name')).toBe(true);
    expect( actual.name).toBe('4000');
    expect( actual.id).toBe(2);
    expect( Array.isArray(actual.data)).toBe(true);
    expect( actual.data[0].packetKey).toBe('4000-2');
    expect( actual.data[1].packetKey).toBe('4000-2');
});

test("updateLastPacketState throws an exception for missing arguments", () => {
    expect(() => {
        updateLastPacketState();
    }).toThrow('Invalid updateLastPacketState request');
});

test("updateLastPacketState throws an exception for lastPacketState argument wrong type", () => {
    expect(() => {
        updateLastPacketState(123);
    }).toThrow('Invalid updateLastPacketState request');
});

test("updateLastPacketState throws an exception for successfulPacket argument wrong type", () => {
    expect(() => {
        updateLastPacketState({}, 123);
    }).toThrow('Invalid updateLastPacketState request');
});

test("updateLastPacketState throws an exception for successfulPacket argument correct type but missing name", () => {
    expect(() => {
        updateLastPacketState({}, {});
    }).toThrow('Invalid successfulPacket object');
});

test("updateLastPacketState throws an exception for successfulPacket argument correct type with name but missing id", () => {
    expect(() => {
        updateLastPacketState({}, { name: '4000'});
    }).toThrow('Invalid successfulPacket object');
});

test("updateLastPacketState throws an exception for successfulPacket argument correct type with name as number instead of string", () => {
    expect(() => {
        updateLastPacketState({}, { name: 123, id: 123});
    }).toThrow('Invalid successfulPacket');
});

test("updateLastPacketState with new name works", () => {
    const actual = updateLastPacketState( {}, { name: '4000', id: 1} );
    expect( typeof actual).toBe('object');
    expect( actual.hasOwnProperty('4000')).toBe(true);
    expect( actual['4000']).toBe(1);
});

test("updateLastPacketState with existing name works ", () => {
    const actual = updateLastPacketState( {'4000': 1}, { name: '4000', id: 2} );
    expect( typeof actual).toBe('object');
    expect( actual.hasOwnProperty('4000')).toBe(true);
    expect( actual['4000']).toBe(2);
});

test("updateLastPacketState throws an exception for if packet sequence is not valid", () => {
    expect(() => {
        const actual = updateLastPacketState( {'4000': 1}, { name: '4000', id: 3} );
    }).toThrow('Invalid state change for packet state for 4000. Should be 2 and not 3.');
});

test("updateLastPacketState throws an exception for if packet sequence is not valid with other names in list", () => {
    expect(() => {
        const actual = updateLastPacketState( {'4000': 1, '5000': 2}, { name: '4000', id: 3} );
    }).toThrow('Invalid state change for packet state for 4000. Should be 2 and not 3.');
});

test("updateLastPacketState with chaining multiple with the same name work ", () => {
    const actual = [];
    actual.push( updateLastPacketState( {'4000': 1}, { name: '4000', id: 2} ) );
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 3 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 4 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 5 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 6 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 7 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 8 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 9 } ));
    actual.push( updateLastPacketState( actual[actual.length - 1], { name: '4000', id: 10 } ));
    expect( actual[actual.length - 1]['4000']).toBe(10);
});

test("validatePacketIDValue returns true with good data", () => {
    expect(() => {
        const lastPacketState = { '4000': 1 }
        const successfulPacket = { name: '4000', id: 2};
        const actual = validatePacketIDValue( lastPacketState, successfulPacket );
        expect(actual).toBe(true);
    });
});

expect(() => {
    const lastPacketState = { '4000': 1 }
    const successfulPacket = { name: '4000', id: 3};
    const actual = validatePacketIDValue( lastPacketState, successfulPacket );
}).toThrow(`Invalid state change for packet state for 4000. Should be 2 and not 3.`);

