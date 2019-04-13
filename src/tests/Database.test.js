const {Database} = require('../Database');

test('Database initial role as leader', () => {
    const role = 'Leader';
    const database = new Database(role);
    const actual = database.getState();
    expect(Object.keys(actual).length).toBe(4);
    expect(actual.role).toBe('Leader');
    expect(actual.count).toBe(0);
    expect(actual.lastID).toBe(0);
    expect(actual.status).toBe('stopped');
});

test('Database initial role as replica', () => {
    const role = 'Replica';
    const database = new Database(role);
    const actual = database.getState();
    expect(Object.keys(actual).length).toBe(4);
    expect(actual.role).toBe('Replica');
    expect(actual.count).toBe(0);
    expect(actual.lastID).toBe(0);
    expect(actual.status).toBe('stopped');
});

test('Database initial role as leader after starting.', () => {
    const role = 'Leader';
    const database = new Database(role);
    const actual = database.Start();
    expect(actual.status).toBe('running');
    const getState = database.getState();
    expect(getState.status).toBe('running');
});

test('Database initial role as leader after starting and starting again.', () => {
    const role = 'Leader';
    const database = new Database(role);
    const actual = database.Start();
    expect(actual.status).toBe('running');
    const actualrestart = database.Start();
    expect(actualrestart.status).toBe('running');
});

test('Database initial role as leader after starting and starting again.', () => {
    const role = 'Leader';
    const database = new Database(role);
    const actual = database.Start();
    expect(actual.status).toBe('running');
    const actualrestart = database.Start();
    expect(actualrestart.status).toBe('running');
});

test('Database initial role as leader after starting and stopping.', () => {
    const role = 'Leader';
    const database = new Database(role);
    const actual = database.Start();
    expect(actual.status).toBe('running');
    const actualStop = database.Stop();
    expect(actualStop.status).toBe('stopped');
});

