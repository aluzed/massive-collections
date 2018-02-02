const massive = require('massive');
const Collection = require('./index');
const config = require('./config');
const fs = require('fs');


describe('Massive-Collections tests', () => {

  // Init our db connection
  beforeAll((done) => {
    massive(config).then(db => {
      process.db = db;
      done();
    })
  });

  test('Should create a fake table in our database', (done) => {
    const fakeTableQuery = fs.readFileSync('./faketable.sql', 'utf8');
  
    process.db.query(fakeTableQuery).then(() => {
      const FakeTable = new Collection('fake_table', process.db);

      FakeTable.flush().then(() => {

        FakeTable.find({}, {}).then(res => {
          expect(res.length).toBe(0);
          done();
        });

      });
    });
  });
    
  test('Should insert data', (done) => {
    const FakeTable = new Collection('fake_table', process.db);

    FakeTable.insert({ 
      username: 'John Doe',
      password: 'qwerty'
    }).then((fakeRow) => {
      expect(fakeRow.username).toBe('John Doe');
      expect(fakeRow.password).toBe('qwerty');
      done();
    })

  }); 

})