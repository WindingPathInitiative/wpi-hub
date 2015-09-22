'use strict';

var _      = require( 'lodash' ),
    config = require( './config/db.json' ),
    settings, knex, bookshelf;

settings = {
    client:     'mysql',
    connection: _.defaults( config.global, { charset: 'utf8' }, config.knex )
};

knex = require( 'knex' )( settings );

bookshelf = require( 'bookshelf' )( knex );

bookshelf.plugin( 'registry' );

module.exports = {
    Bookshelf: bookshelf,
    Knex:      knex,
    Config:    settings
};
