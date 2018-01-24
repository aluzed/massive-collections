## Massive-Collections

Collections wrapper for Massive-JS.
You must already have a connection and Massive-Collections work with your database connection object.

## Dependencies

* bluebird
* massive (connection)

Let's admit we have a users table :

```sql
(
  name     varchar(255),
  infos    jsonb not null,
  created  timestamp with time zone,
  modified timestamp with time zone
)
```

Create a collection file : `users.js`


```javascript
const { ColumnMissing } = require('massive-collections/errors');
const Collection = require('massive-collections');

module.exports = (db) => {

  const UsersCollection = new Collection('users', db);

  return UsersCollection;
};
```

## Methods

Now you can use following methods :

* find
* insert
* update
* remove
* flush

Each method returns a Promise.

### Find method

| Parameter  | Type   | Description                               | Example                                                                                   |
|:-----------|:-------|:------------------------------------------|:------------------------------------------------------------------------------------------|
| conditions | Object | WHERE conditions                          | { "name  }                                                                                |
| options    | Object | Other options, like limit, offset, etc... | { columns: ["name", "price", "description"], order: "price desc", offset: 20, limit: 10 } |

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

* pre->find(next)
* pre->flush(next)
* pre->insert(next, data)
* pre->update(next, data)
* pre->remove(next)
* post->find(data)
* post->flush(data)
* post->insert(data)
* post->update(data)
* post->remove(data)

For Pre Insert and Pre Update, you must pass `data` through the `next` callback.
