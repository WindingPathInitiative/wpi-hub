'use strict';

const app       = require( '../app' );
const supertest = require( 'supertest' );
const Token     = require( '../models/tokens' );
const http      = require( 'http' );

app.set( 'port', '3000' );

let server = http.createServer( app );
server.listen( '3000' );

function makeToken( user ) {
	return new Token({ user: user }).save();
}

function deleteToken( token ) {
	return new Token({ token: token }).destroy();
}

module.exports = {
	request: supertest( server ),
	makeToken: makeToken,
	deleteToken: deleteToken
};
