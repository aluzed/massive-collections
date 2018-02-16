const chai = require('chai');
const expect = chai.expect;

const cli = require('../bin/massive-collections-cli');

describe('Massive-Collection-Cli tests', () => {
  it('Should generate a proper create table users query', () => {
    let tableName = 'fake_users';

    let colsList = [
        'username:varchar(255):unique:notnull',
        'password:varchar(255):noindex:notnull',
        'email:varchar(255):noindex:notnull',
        'age:int',
        'created:timestampz:noindex:null:now()',
        'modified:timestampz:noindex:null:now()' ];

    let query = cli.createTable(tableName, colsList);

    let columns = query.match(/\((.+)\)/)[1];

    let colCount = columns.split(',').length;

    console.log('query');

    // Expect the query to contain each column plus an id column
    expect(colCount).to.equal((colsList.length + 1));
  });
})
