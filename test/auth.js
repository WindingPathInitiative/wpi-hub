'use strict';

/**
 * Test for Auth Controller
 * @see controllers/auth.js
 */

const request = require( './helpers' ).request;
const should  = require( 'should' );

module.exports = function() {

	describe( 'GET signin', function() {
		it( 'fails if invalid code is provided', function( done ) {
			request
			.get( '/v1/auth/signin/invalid' )
			.expect( 500, done );
		});

		it( 'provides url with valid redirect', function( done ) {
			request
			.get( '/v1/auth/signin/test' )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should
				.have.property( 'url' )
				.match( /localhost:3000/ );
				done();
			});
		});
	});

	describe( 'GET verify', function() {

		it( 'fails if invalid code is provided', function( done ) {
			request
			.get( '/v1/auth/verify/invalid' )
			.expect( 500, done );
		});

		it( 'redirects if no token is provided', function( done ) {
			request
			.get( '/v1/auth/verify/test' )
			.expect( 302 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.headers.should
				.have.property( 'location' )
				.startWith( 'http://localhost:3000/dev/auth' )
				.and.containEql( 'client_id=client_id_here' );
				done();
			});
		});

		it( 'redirects to app with token set', function( done ) {
			request.get( '/dev/auth' )
			.query({ redirect_uri: 'http://localhost:3000/v1/auth/verify/test' })
			.redirects( 1 )
			.expect( 302 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.headers.should
				.have.property( 'location' )
				.startWith( 'http://localhost:3000/dev' )
				.and.containEql( 'token' );
				res.headers.should
				.have.property( 'set-cookie' )
				.match( /token=\w+-\w+-\w+-\w+-\w+/ );
				done();
			});
		});
	});

	describe( 'GET signout', function() {
		var token;
		before( 'create token', function( done ) {
			require( './helpers' ).makeToken( 1 )
			.then( data => {
				token = data.id;
				done();
			});
		});

		it( 'fails without a token', function( done ) {
			request
			.get( '/v1/auth/signout' )
			.expect( 403, {
				message: 'Token not provided',
				status: 403
			}, done );
		});

		it( 'fails with an invalid token', function( done ) {
			request
			.get( '/v1/auth/signout' )
			.query({ token: 'test-invalid-token' })
			.expect( 403, {
				message: 'Invalid token',
				status: 403
			}, done );
		});

		it( 'succeeds with a valid token', function( done ) {
			request
			.get( '/v1/auth/signout' )
			.query({ token: token })
			.expect( 200, { success: 1 } )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				const Token = require( '../models/tokens' );
				new Token({ token: token }).fetch().then( model => {
					( null === model ).should.be.true; // jshint ignore:line
					done();
				});
			});
		});
	});

	after( 'deletes tokens', function( done ) {
		const Token = require( '../models/tokens' );
		new Token()
		.where( 'user', 8 )
		.destroy()
		.then( () => done() );
	});
};
