const log = require('color-log');

log.info("\n====================================\n");
log.info("\n| How To Use Massive-Collection CLI |\n");
log.info("\n====================================\n");

log.mark("\nAvailable commands : \n");

log.info(`
  * connect                     Connect to Database (permanent)
  * disconnect                  Disconnect
  * create-table | createTable  Create a table
          `);

log.mark("\nParameters : \n");

log.info(`
  * connect [parameters]

  list :
  --h     host:port
  --db    database
  --p     password
  --u     user
  `);

log.warn('Example : massive-collections-cli connect --h=localhost:5432 --db=test_db --u=root --p=root');

log.info(`
  * createTable <tableName> <...columns>

  column format:
  name:type:[index]:[nullable]:[default]

  * Details :
  name      Any
  type      Any postgresql type (or shortcuts : timestampz, int, bool)
  index     <unique|noindex> (optionnal)
  nullable  <null|notnull> (optionnal)
  default   <now()|true|false|...> (optionnal)
  `);

log.warn(`
  Example :
  massive-collections createTable users \\
  username:varchar(255):unique:notnull \\
  password:varchar(255):noindex:notnull \\
  age:int \\
  details:jsonb \\
  created:timestampz:noindex:null:now() \\
  modified:timestampz:noindex:null:now()
`);