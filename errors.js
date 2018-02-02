
class InvalidFormat extends Error {};
class MissingArg extends Error {};
class ColumnMissing extends Error {};
class CannotBeEmpty extends Error {};

module.exports = {
  InvalidFormat,
  MissingArg,
  ColumnMissing,
  CannotBeEmpty
}
