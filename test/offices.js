'use strict';

/**
 * Test for Offices Controller
 * @see controllers/auth.js
 */

const should      = require( 'should' );
const Promise     = require( 'bluebird' );

const helpers     = require( './helpers' );
const request     = helpers.request;
const makeToken   = helpers.makeToken;
const deleteToken = helpers.deleteToken;

module.exports = function() {

	describe( 'GET id', function() {

		var token;
		before( 'create token', function( done ) {
			makeToken( 1 )
			.then( data => {
				token = data.id;
				done();
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/offices/1' )
			.expect( 403, done );
		});

		it( 'fails if invalid id is provided', function( done ) {
			request
			.get( '/offices/1111111' )
			.query({ token: token })
			.expect( 404, done );
		});

		it( 'provides the correct data', function( done ) {
			request
			.get( '/offices/1' )
			.query({ token: token })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				let body = res.body;
				body.should.have.properties({
					id: 1,
					name: 'National Coordinator',
					type: 'Primary',
					email: 'nc@mindseyesociety.org'
				});
				body.should.have.property( 'roles' ).is.Array;

				body.should.have.property( 'orgUnit' ).is.Object;
				helpers.models.orgUnit( body.orgUnit );

				body.should.have.property( 'user' ).is.Object;
				helpers.models.user( body.user );

				done();
			});
		});

		after( 'destroy token', function( done ) {
			deleteToken( token )
			.then( () => done() );
		});
	});

	describe( 'GET internal', function() {

		var userToken, ncToken;
		before( 'create tokens', function( done ) {
			let promise1 = makeToken( 9 )
			.then( data => {
				userToken = data.id;
			});

			let promise2 = makeToken( 2 )
			.then( data => {
				ncToken = data.id;
			});

			Promise.join( promise1, promise2, () => {
				done();
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/offices/internal' )
			.expect( 403, done );
		});

		it( 'provides no data for user without office', function( done ) {
			request
			.get( '/offices/internal' )
			.query({ token: userToken })
			.expect( 200, [], done );
		});

		it( 'provides data for user with office', function( done ) {
			request
			.get( '/offices/internal' )
			.query({ token: ncToken })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.instanceof( Array ).and.have.lengthOf( 1 );
				let office = res.body[0];
				office.should.have.properties({
					id: 1,
					name: 'National Coordinator',
					type: 'Primary',
					email: 'nc@mindseyesociety.org',
					userID: 2,
					parentOrgID: 1,
					parentOfficeID: null
				});
				office.should.have.property( 'roles' ).is.Array;

				done();
			});
		});

		after( 'destroy tokens', function( done ) {
			Promise.join(
				deleteToken( userToken ),
				deleteToken( ncToken ),
				() => done()
			);
		});
	});

	describe( 'PUT assign', function() {
		// TODO: Make integration tests once code works out.
	});
};
