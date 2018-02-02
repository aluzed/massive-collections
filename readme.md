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
* find
* insert
* update
* remove
* flush

Each method returns a Promise.

### Get method

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

### Remove method

| Parameter  | Type   | Description      | Example     |
|:-----------|:-------|:-----------------|:------------|
| id         | Number | id of the item   | 5           |

`Collection.remove(id)`

```javascript

  UsersCollection.remove(5).then(res => {
    console.log(res);
  });

```

### Flush method

`Collection.flush()`

```javascript

  UsersCollection.flush().then(res => {
    console.log(res);
  });

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
UsersCollection.postHook('update', function (data) {
  console.log(data);
  myRestartFunction();
});
```

### List of Hooks

* pre->get(next)
* pre->find(next)
* pre->flush(next)
* pre->insert(next, data)
* pre->update(next, data)
* pre->remove(next)
* post->get(data)
* post->find(data)
* post->flush(data)
* post->insert(data)
* post->update(data)
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
