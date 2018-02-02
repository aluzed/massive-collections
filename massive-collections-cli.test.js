const cli = require('./massive-collections-cli');

test('Should generate a proper create table users query', () => {
  let tableName = 'users';

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

  // Expect the query to contain each column plus an id column
  expect(colCount).toBe((colsList.length + 1));

  console.log(query);
});
