// Sets config settings. Used by Knex CLI commands.
GLOBAL.config = require( './config' );
module.exports = require( './common/db' ).Config;
