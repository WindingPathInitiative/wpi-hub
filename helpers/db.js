'use strict';

const _        = require( 'lodash' );
const config   = require( '../config' ).db;
const settings = {
	client:	 'pg',
	connection: _.defaults( config.global, { charset: 'utf8' }, config.knex )
};

let knex = require( 'knex' )( settings );

let bookshelf = require( 'bookshelf' )( knex );
bookshelf.plugin( 'registry' );

module.exports = {
	Bookshelf: bookshelf,
	Knex:      knex,
	Config:    settings
};
