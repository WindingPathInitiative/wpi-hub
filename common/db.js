'use strict';

var _      = require( 'lodash' ),
    config = require( './config/db.json' ),
    knex, bookshelf;

knex = require( 'knex' )({
    client:     'mysql',
    connection: _.defaults( config.global, { charset: 'utf8' })
});

bookshelf = require( 'bookshelf' )( knex );

bookshelf.plugin( 'registry' );

module.exports = bookshelf;
