const chai       = require('chai');
const expect     = chai.expect;
const massive    = require('massive');
const Collection = require('../index');
const config     = require('./config');
const fs         = require('fs');
const path       = require('path');
const Promise    = require('bluebird');

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

  // create table then flush method
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

  // insert method
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

  // get method
  it('Should get a specific item from its ID', (done) => {
    FakeTable.get(tmpId).then(row => {

      expect(row).to.deep.include({
        id: tmpId,
        username: 'John Doe',
        password: 'qwerty'
      });

      done();
    })
  });

  // count method
  it('Should count results', done => {
    // Save 3 items
    Promise.all(
      [
        {
          username: 'Jane Doe',
          password: 'password'
        },
        {
          username: 'Bobby Doe',
          password: 'bobybobyboby1'
        },
        {
          username: 'Johnny Doe',
          password: 'wuwu123'
        },
        {
          username: 'Johnas Doe',
          password: 'babacool'
        }
      ].map(u => {
        return new Promise((resolve, reject) => {
          FakeTable.insert(u).then(fakeItem => {
            resolve();
          }).then(err => reject(err));
        })
      })
    ).then(() => {
      FakeTable.count().then(result => {
        expect(result).to.equal(5);
        done();
      });
    })
  });

  // count method with conditions
  it('Should count only where username contains "jo"', done => {
    FakeTable.count({
      'username ILIKE': 'jo%'
    }).then(result => {
      expect(result).to.equal(3);
      done();
    })
  })

  // update method
  it('Should update a row', done => {
    FakeTable.update(tmpId, {
      password: 'taratatouille'
    }).then(user => {
      expect(user).to.deep.include({
        username: 'John Doe',
        password: 'taratatouille'
      })
      done();
    })
  });

  // updateAll method
  it('Should update multiple rows', done => {
    FakeTable.updateAll({
      'username ilike': 'j%'
    }, {
      password: 'blablabla'
    }).then(users => {
      // Check if users have been correctly updated
      expect(users.find(u => u.username === 'John Doe')).to.deep.include({
        username: 'John Doe',
        password: 'blablabla'
      });
      expect(users.find(u => u.username === 'Jane Doe')).to.deep.include({
        username: 'Jane Doe',
        password: 'blablabla'
      });
      expect(users.find(u => u.username === 'Johnny Doe')).to.deep.include({
        username: 'Johnny Doe',
        password: 'blablabla'
      });
      done();
    });
  });

  // remove method
  it('Should remove a row', done => {
    FakeTable.remove(tmpId).then(() => {
      // Check if table count is now 3
      FakeTable.count().then(result => {
        expect(result).to.equal(4);
        done();
      })
    })
  })

  // removeAll method
  it('Should removeAll John% users', done => {
    FakeTable.insert({
      username: 'John Doe',
      password: 'qwerty'
    }).then(() => {
      FakeTable.removeAll({
        'username ilike': 'john%'
      }).then(() => {
        FakeTable.find().then(users => {
          expect(users.length).to.equal(2);
          done();
        });
      })
    })
  })

  // flush method, clear data before exiting
  it('Should clean data', done => {
    FakeTable.flush().then(() => {
      FakeTable.find({}).then(res => {
        expect(res.length).to.equal(0);
        done();
      });
    });
  });
})
