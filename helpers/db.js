'use strict';

const _        = require( 'lodash' );
const config   = require( '../config' ).db;
const settings = {
	client:	 config.knex.db || 'mysql',
	connection: _.defaults( config.global, { charset: 'utf8' }, config.knex )
};

if ( process.env.NODE_ENV && 'development' !== process.env.NODE_ENV ) {
	settings.connection.debug = false;
}

let knex = require( 'knex' )( settings );

let bookshelf = require( 'bookshelf' )( knex );
bookshelf.plugin( 'registry' );

module.exports = {
	Bookshelf: bookshelf,
	Knex:      knex,
	Config:    settings
};
