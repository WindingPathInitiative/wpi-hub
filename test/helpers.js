'use strict';

const app     = require( '../app' );
const request = require( 'supertest' )( app );
const Token   = require( '../models/tokens' );

function makeToken( user ) {
	return new Token({ user: user }).save();
}

function deleteToken( token ) {
	return new Token({ token: token }).destroy();
}

module.exports = {
	request: request,
	makeToken: makeToken,
	deleteToken: deleteToken
};
