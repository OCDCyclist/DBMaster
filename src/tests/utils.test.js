const {getFilename, getIntegerArrayForCSVList, findFilesFromArchive} = require('../utils');

test('getIntegerArrayForCSVList accepts for valid args', () => {
    const actual = getIntegerArrayForCSVList('5000,5001,5002')
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(3);
    expect(actual[0]).toBe(5000);
    expect(actual[1]).toBe(5001);
    expect(actual[2]).toBe(5002);
});

test('getIntegerArrayForCSVList skips for invalid args', () => {
    const actual = getIntegerArrayForCSVList('-5000,abc,5002')
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(1);
    expect(actual[0]).toBe(5002);
});

test('getFilename works with proper date', () => {
    const actual = getFilename(new Date( 2019, 3, 27, 8, 10));
    expect(typeof actual).toBe('string');
    expect(actual).toBe('FN-2019-04-27-08-10.json');
});

test('getFilename pads digits LT 10', () => {
    const actual = getFilename(new Date( 2019, 3, 1, 2, 5));
    expect(typeof actual).toBe('string');
    expect(actual).toBe('FN-2019-04-01-02-05.json');
});

test('getFilename returns blank for undefined arg', () => {
    const actual = getFilename();
    expect(typeof actual).toBe('string');
    expect(actual).toBe('');
});

test('getFilename returns blank for non date object', () => {
    const actual = getFilename( {});
    expect(typeof actual).toBe('string');
    expect(actual).toBe('');
});

test('findFilesFromArchive returns nothing with no arguments', () => {
    const actual = findFilesFromArchive();
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(0);
});

test('findFilesFromArchive returns nothing with bad arguments', () => {
    const actual = findFilesFromArchive('hello', []);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(0);
});

test('findFilesFromArchive returns from first file', () => {
    const files = ['Archive_4000-1.json', 'Archive_4000-100.json', 'Archive_4000-10000.json', 'Archive_4000-100000.json']
    const actual = findFilesFromArchive( files, 1);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(4);
});

test('findFilesFromArchive returns from second file with id on border', () => {
    const files = ['Archive_4000-1.json', 'Archive_4000-100.json', 'Archive_4000-10000.json', 'Archive_4000-100000.json']
    const actual = findFilesFromArchive( files, 100);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(3);
});

test('findFilesFromArchive returns from second file with id after border', () => {
    const files = ['Archive_4000-1.json', 'Archive_4000-100.json', 'Archive_4000-10000.json', 'Archive_4000-100000.json']
    const actual = findFilesFromArchive( files, 110);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(3);
});

test('findFilesFromArchive returns from second file with id near upper border', () => {
    const files = ['Archive_4000-1.json', 'Archive_4000-100.json', 'Archive_4000-10000.json', 'Archive_4000-100000.json']
    const actual = findFilesFromArchive( files, 9999);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(3);
});

test('findFilesFromArchive returns from last file with id equal to upper border', () => {
    const files = ['Archive_4000-1.json', 'Archive_4000-100.json', 'Archive_4000-10000.json', 'Archive_4000-100000.json']
    const actual = findFilesFromArchive( files, 100000);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(1);
});

test('findFilesFromArchive returns from last file with id above to upper border', () => {
    const files = ['Archive_4000-1.json', 'Archive_4000-100.json', 'Archive_4000-10000.json', 'Archive_4000-100000.json']
    const actual = findFilesFromArchive( files, 100000000);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(1);
});

test('findFilesFromArchive returns first file if there is just one file', () => {
    const files = ['Archive_4000-1.json']
    const actual = findFilesFromArchive( files, 100000000);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(1);
});

test('findFilesFromArchive returns nothing with empty files input', () => {
    const files = []
    const actual = findFilesFromArchive( files, 100000000);
    expect(Array.isArray(actual)).toBe(true);
    expect(actual.length).toBe(0);
});

