'use strict';

const app       = require( '../app' );
const supertest = require( 'supertest' );
const Token     = require( '../models/token' );
const http      = require( 'http' );
const should    = require( 'should' );
const _         = require( 'lodash' );

app.set( 'port', '3000' );

let server = http.createServer( app );
server.listen( '3000' );

/**
 * Makes a token.
 * @param {integer} user  User ID.
 * @param {string}  token Optional. Token string.
 * @return {Promise}
 */
function makeToken( user, token ) {
	let data = { user: user };
	if ( token ) {
		data.token = token;
	}
	return new Token( data ).save( {}, { method: 'insert' } );
}

/**
 * Deletes a token.
 * @param {string} token The token ID.
 * @return {Promise}
 */
function deleteToken( token ) {
	return new Token({ token: token }).destroy();
}

/**
 * Internal generator for validating models.
 * @param {array} pub Public info.
 * @param {array} pri Private info.
 * @return {void}
 */
function _dataValidationFactory( pub, pri ) {
	return ( model, full ) => {
		model.should.have.properties( pub );
		if ( true === full ) {
			model.should.have.properties( pri );
		} else {
			model.should.not.have.properties( pri );
		}
	};
}

module.exports = {
	request: supertest( server ),
	makeToken: makeToken,
	deleteToken: deleteToken,

	models: {
		office: _dataValidationFactory(
			[ 'id', 'name', 'type' ],
			[ 'email', 'roles' ]
		),
		orgUnit: _dataValidationFactory(
			[ 'id', 'name', 'code', 'type' ],
			[ 'venueType', 'location', 'website', 'defDoc' ]
		),
		user: _dataValidationFactory(
			[ 'id', 'firstName', 'lastName', 'nickname', 'fullName', 'membershipType', 'membershipExpiration' ],
			[ 'email', 'address' ]
		)
	}
};
