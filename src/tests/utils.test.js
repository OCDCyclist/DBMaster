const {getIntegerArrayForCSVList} = require('../utils');

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
