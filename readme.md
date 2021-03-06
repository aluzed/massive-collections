## Massive-Collections

Collections wrapper for Massive-JS.
You must already have a connection and Massive-Collections work with your database connection object.

## Dependencies

* bluebird
* massive (connection)

Let's admit we have a users table :

```sql
(
  id       serial primary key
  name     varchar(255),
  age      smallint,
  infos    jsonb not null,
  created  timestamp with time zone default now(),
  modified timestamp with time zone default now()
)
```

Create a collection file : `users.js`


```javascript
const { ColumnMissing } = require('massive-collections/errors');
const Collection = require('massive-collections');

// Get the connection from massive
module.exports = (db) => {

  const UsersCollection = new Collection('users', db);

  return UsersCollection;
};
```

## Methods

Now you can use following methods :

* get (id)
* count
* find
* insert
* update
* updateAll
* remove
* removeAll
* flush

Each method returns a Promise.

### Count method

Purpose: Count database row.

Returns: {Number}

| Parameter  | Type   | Description                               | Example                                                                                   |
|:-----------|:-------|:------------------------------------------|:------------------------------------------------------------------------------------------|
| conditions | Object | WHERE conditions                          | { "name ~~": "jo%"  }  // name like                                                       |

`Collection.count(conditions)`

```javascript

  Users.count().then(res => {
    console.log(res);
  });

```

### Get method

Purpose: Get a specific row.

Returns: {Object}

| Parameter  | Type   | Description      | Example  |
|:-----------|:-------|:-----------------|:---------|
| id         | Number | ID               | 5        |

`Collection.get(id)`

```javascript

  Users.get(10).then(user => {
    console.log(user);
  });

```

### Find method

Purpose: Get an array of rows.

Returns: {Array}

| Parameter  | Type   | Description                               | Example                                                                                   |
|:-----------|:-------|:------------------------------------------|:------------------------------------------------------------------------------------------|
| conditions | Object | WHERE conditions                          | { "name ~~": "jo%"  }  // name like                                                       |
| options    | Object | Other options, like limit, offset, etc... | { columns: ["name", "price", "description"], order: {field: "price", direction: "desc"}, offset: 20, limit: 10 } |

`Collection.find(conditions, options)`

```javascript

  Users.find().then(res => {
    console.log(res);
  });

```

### Insert method

Purpose: Insert an new row in our table.

Returns: {Object}

| Parameter  | Type   | Description      | Example                                                        |
|:-----------|:-------|:-----------------|:---------------------------------------------------------------|
| data       | Object | Values           | { name: "John Doe", infos: { email: "john.doe@domain.tld" } }  |

`Collection.insert(data)`

```javascript

  UsersCollection.insert({
    name: "Jane Doe",
    infos: {
      email: "jane.doe@domain.tld"
    }
  }).then(res => {
    console.log(res);
  });

```

### Update method

Purpose: Update a row where id = ...

Returns: {Object} (updated row)

| Parameter  | Type   | Description      | Example                                                        |
|:-----------|:-------|:-----------------|:---------------------------------------------------------------|
| id         | Number | id of the item   | 3                                                              |
| data       | Object | new data to set  | { name: "bobby" }                                              |

`Collection.update(id, data)`

```javascript

  UsersCollection.update(11, {
    name: "Toto"
  }).then(res => {
    console.log(res);
  });

```

### UpdateAll method

Purpose: Update any rows where conditions match

Returns: {Array} (updated rows)

| Parameter  | Type   | Description      | Example                                                        |
|:-----------|:-------|:-----------------|:---------------------------------------------------------------|
| conditions | Object | WHERE conditions | { "name ~~": "jo%"  }  // name like                            |
| data       | Object | new data to set  | { name: "bobby" }                                              |

`Collection.updateAll(conditions, data)`

```javascript

  UsersCollection.updateAll({
    'name ilike': 't%' // Find all name starting with t non case sensitive
  }, {
    age: 20 // Set age = 20
  }).then(res => {
    console.log(res);
  });

```

### Remove method

Purpose: Remove a row where id = ...

Returns: {Object} (deleted item)

| Parameter  | Type   | Description      | Example     |
|:-----------|:-------|:-----------------|:------------|
| id         | Number | id of the item   | 5           |

`Collection.remove(id)`

```javascript

  UsersCollection.remove(5).then(res => {
    console.log(res);
  });

```

### RemoveAll method

Purpose: Remove any rows that match conditions

Returns: {Array} (deleted items)

| Parameter  | Type   | Description      | Example                             |
|:-----------|:-------|:-----------------|:------------------------------------|
| conditions | Object | WHERE conditions | { "name ~~": "jo%"  }  // name like |

`Collection.removeAll(conditions)`

```javascript

  UsersCollection.removeAll({
    'username ilike': 'jo%'
  }).then(res => {
    console.log(res);
  });

```

### Flush method

Purpose: Remove any rows in that table

| Parameter  | Type    | Description                                                         | Example    |
|:-----------|:--------|:--------------------------------------------------------------------|:-----------|
| reset_seq  | Boolean | (Optionnal) Describe if we need to reset the linked sequence or not | true|false |

`Collection.flush(reset_seq)`

```javascript

  UsersCollection.flush().then(()  => {

  });

  // Reset sequence
  UsersCollection.flush(true).then(() => {

  })

```

## Formatters

You can format data when you read/write.

**dbFormat** before any write
**jsFormat** before any read

This will be helpful with custom format or extra libs (password hash, etc...).

```javascript

UsersCollection.dbFormat(data => {

  if (typeof data.infos === "undefined")
    throw new ColumnMissing(infos);

  // Force data convertion
  if (typeof data.infos === "object")
    data.infos = JSON.stringify(data.infos);

  return data;
});

```

## Hooks

You can hook methods call and change data value before any database write.

To assign a pre hook, we use the following method : `Collection.preHook(hookName, callback)`

```javascript
UsersCollection.preHook('update', function (next, data) {
  data.modified = new Date();
  next(data);
});

```

To assign a post hook, we use the following method : `Collection.postHook(hookName, callback)`

```javascript
UsersCollection.postHook('update', function (next, data) {
  data.new_field = 'qwerty';
  myRestartFunction(); // any action
  next(data);
});
```

### List of Hooks

* pre->count(next)
* pre->get(next)
* pre->find(next)
* pre->flush(next)
* pre->insert(next, data)
* pre->update(next, data)
* pre->updateAll(next, data)
* pre->remove(next)
* post->get(data)
* post->count(data)
* post->find(data)
* post->flush()
* post->insert(data)
* post->update(data)
* post->updateAll(data)
* post->remove(data)

For Pre Insert and Pre Update, you must pass `data` through the `next` callback.

### Custom queries

**Like** : **~~** :

```javascript
UsersCollection.find({
  "name ~~": 'ja%'
}).then(res => console.log(res));
```

**Not Like** : **!~~** :

```javascript
UsersCollection.find({
  "name !~~": 'ja%'
}).then(res => console.log(res));
```

**iLike** (case insensitive) :

```javascript
UsersCollection.find({
  "name ilike": '%joh%'
}).then(res => console.log(res));
```

**Not iLike** (case insensitive) :

```javascript
UsersCollection.find({
  "name not ilike": '%joh%'
}).then(res => console.log(res));
```

**Compare** : **>** **<** **<=** **>=** :
```javascript
UsersCollection.find({
  "age >": 30
}).then(res => console.log(res));
```

**JSONB queries** :

Let's assume that we have a columns `infos` :
```
{ "email": "...", "followers": 5000 }
```

```javascript
// Value in object like
UsersCollection.find({
  "infos->>'email' ~~": "jo%"
}).then(res => console.log(res));

// Get value then cast
UsersCollection.find({
  "(infos->>'followers')::float >": 600
}).then(res => console.log(res));

// Sort
UsersCollection.find({}, {
  order: [{
    field: "infos->>'followers'",
    direction: "DESC",
    type: "int"
  }]
}).then(res => console.log(res));
```
## CLI

You can create table from a terminal with massive-collections-cli. Let's assume that you already have a connection to a postgresql database (user, password, etc.).

You need to connect first (in a terminal) :

```
node_modules/.bin/massive-collections-cli connect --h=localhost:5432 --db=test_db --u=root --p=root
```

Once you are connected, you generate automatically a new file : `massive-collections_credentials.json` that should automatically be added to your .gitignore.

Then, you can create tables (in a terminal) :

```
# Note that we use double quote to prevent bash errors
node_modules/.bin/massive-collections-cli createTable posts "title:varchar(255):unique:notnull" "content:text" "picture:integer" "author:integer" "details:jsonb" "created:timestampz:noindex:null:now()"
```


Do not add an id column, this is automatic.

If you want to remove properly your credentials, you can disconnect (in a terminal) :

```
node_modules/.bin/massive-collections-cli disconnect
```

Please read the documentation first (in a terminal) :

```
node_modules/.bin/massive-collections-cli help
```
