const {Database} = require('../Database');

test('Database initial role as leader', () => {
    const props = {
        role: 'Leader',
        logFolder: 'd:\\logFolder',
        logFolderArchive: 'd:\\logFolderArchive',
        dbPath: 'd:\\dbPath'
    };
    const database = new Database(props);
    const actual = database.getState();
    expect(Object.keys(actual).length).toBe(8);
    expect(actual.role).toBe('Leader');
    expect(actual.logFolder).toBe('d:\\logFolder');
    expect(actual.logFolderArchive).toBe('d:\\logFolderArchive');
    expect(actual.dbPath).toBe('d:\\dbPath');
    expect(actual.status).toBe('stopped');
});

test('Database initial role as replica', () => {
    const props = {
        role: 'Replica',
        logFolder: 'd:\\logFolder',
        logFolderArchive: 'd:\\logFolderArchive',
        dbPath: 'd:\\dbPath'
    };
    const database = new Database(props);
    const actual = database.getState();
    expect(Object.keys(actual).length).toBe(8);
    expect(actual.role).toBe('Replica');
    expect(actual.logFolder).toBe('d:\\logFolder');
    expect(actual.logFolderArchive).toBe('d:\\logFolderArchive');
    expect(actual.dbPath).toBe('d:\\dbPath');
    expect(actual.status).toBe('stopped');
});

test('Database initial role as replica', () => {
    const props = {
        role: 'Replica',
        logFolder: 'd:\\logFolder',
        logFolderArchive: 'd:\\logFolderArchive',
        dbPath: 'd:\\dbPath'
    };
    const database = new Database(props);
    const actual = database.getState();
    expect(Object.keys(actual).length).toBe(8);
    expect(actual.role).toBe('Replica');
    expect(actual.logFolder).toBe('d:\\logFolder');
    expect(actual.logFolderArchive).toBe('d:\\logFolderArchive');
    expect(actual.dbPath).toBe('d:\\dbPath');
    expect(actual.status).toBe('stopped');
});

