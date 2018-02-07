const chai       = require('chai');
const expect     = chai.expect;
const massive    = require('massive');
const Collection = require('../index');
const config     = require('./config');
const fs         = require('fs');
const path       = require('path');

describe('Massive-Collections tests', () => {
  let tmpId = null;
  let processDB = null;
  let FakeTable = null;

  // Init our db connection
  it('Should initialize connection to DB', done => {
    massive(config).then(db => {
      processDB = db;
      done();
    })
  })

  it('Should create a fake table in our database', done => {
    const fakeTableQuery = fs.readFileSync(path.join(__dirname, 'faketable.sql'), 'utf8');
    processDB.query(fakeTableQuery).then(() => {

      // Reload DB to get the table (if just created)
      processDB.reload().then(() => {
        FakeTable = new Collection('fake_table', processDB);
        
        // Empty the table to prevent errors
        FakeTable.flush().then(() => {
          FakeTable.find({}, {}).then(res => {
            expect(res.length).to.equal(0);
            done();
          });
  
        });
      })

    });
  });

  it('Should insert data', done => {
    FakeTable.insert({
      username: 'John Doe',
      password: 'qwerty'
    }).then(() => {

      FakeTable.find({}).then(res => {
        expect(res.length).to.equal(1);

        tmpId = res[0].id;

        expect(res[0]).to.deep.include({
          username: 'John Doe',
          password: 'qwerty'
        });
        done();
        
      });
    });
  });

  it('Should get a specific row', (done) => {
    FakeTable.get(tmpId).then(row => {

      expect(row).to.deep.include({
        id: tmpId,
        username: 'John Doe',
        password: 'qwerty'
      });

      done();
    })
  });


  it('Should clean data', (done) => {
    FakeTable.flush().then(() => {
      FakeTable.find({}).then(res => {
        expect(res.length).to.equal(0);
        done();
      });
    });
  });
})
