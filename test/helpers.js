'use strict';

const app       = require( '../app' );
const supertest = require( 'supertest' );
const Token     = require( '../models/tokens' );
const http      = require( 'http' );
const should    = require( 'should' );
const _         = require( 'lodash' );

app.set( 'port', '3000' );

let server = http.createServer( app );
server.listen( '3000' );

function makeToken( user ) {
	return new Token({ user: user }).save();
}

function deleteToken( token ) {
	return new Token({ token: token }).destroy();
}

function _dataValidationFactory( pub, pri ) {
	return ( model, full ) => {
		model.should.have.properties( pub );
		model.should.not.have.properties( pri );
	};
}

module.exports = {
	request: supertest( server ),
	makeToken: makeToken,
	deleteToken: deleteToken,

	models: {
		office: _dataValidationFactory(
			[ 'id', 'name', 'type', 'user' ],
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
