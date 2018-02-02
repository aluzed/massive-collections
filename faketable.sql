CREATE TABLE IF NOT EXISTS "fake_table" (
  id serial primary key,
  username varchar(255) not null,
  password varchar(255) not null,
  created timestamp with time zone default now(),
  modified timestamp with time zone default now()
);