'use strict';

const Promise = require( 'bluebird' );

before( 'create tokens', function( done ) {
	let makeToken = require( './helpers' ).makeToken;

	Promise.join(
		makeToken( 1, 'admin' ),
		makeToken( 2, 'nc' ),
		makeToken( 5, 'user' ),
		() => done()
	);
});

describe( 'auth', require( './auth' ) );

describe( 'users', require( './user' ) );

describe( 'org units', require( './org-units' ) );

describe( 'offices', require( './offices' ) );

describe( 'permissions', require( './permissions' ) );

after( 'destroy tokens', function( done ) {
	let deleteToken = require( './helpers' ).deleteToken;

	Promise.join(
		deleteToken( 'admin' ),
		deleteToken( 'nc' ),
		deleteToken( 'user' ),
		() => done()
	);
});
