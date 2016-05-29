'use strict';

/**
 * Test for Offices Controller
 * @see controllers/auth.js
 */

const should  = require( 'should' );
const Promise = require( 'bluebird' );

const helpers = require( './helpers' );
const request = helpers.request;

module.exports = function() {

	describe( 'GET id', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/offices/1' )
			.expect( 403, done );
		});

		it( 'fails if invalid id is provided', function( done ) {
			request
			.get( '/offices/1111111' )
			.query({ token: 'user' })
			.expect( 404, done );
		});

		it( 'provides the correct data', function( done ) {
			request
			.get( '/offices/1' )
			.query({ token: 'user' })
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
	});

	describe( 'GET internal', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/offices/internal' )
			.expect( 403, done );
		});

		it( 'provides no data for user without office', function( done ) {
			request
			.get( '/offices/internal' )
			.query({ token: 'user' })
			.expect( 200, [], done );
		});

		it( 'provides data for user with office', function( done ) {
			request
			.get( '/offices/internal' )
			.query({ token: 'nc' })
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
	});

	describe( 'PUT assign', function() {

		let Office = require( '../models/offices' );

		afterEach( 'reset officers', function( done ) {
			let main = new Office({ id: 1 }).save( { userID: 2 }, { patch: true } );
			let child = new Office({ id: 5 }).save( { userID: 8 }, { patch: true } );

			Promise.join( main, child, () => done() );
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/offices/5/assign/5' )
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/offices/5/assign/99' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for invalid office id', function( done ) {
			request
			.put( '/offices/99/assign/5' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for assigning without permission', function( done ) {
			request
			.put( '/offices/5/assign/5' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'fails for vacating without permission', function( done ) {
			request
			.put( '/offices/5/assign/0' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'works for user vacating themselves', function( done ) {
			request
			.put( '/offices/1/assign/0' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				new Office({ id: 1 })
				.fetch()
				.then( office => {
					office.get( 'userID' ).should.be.null;
					done();
				});
			});
		});

		it( 'works for officer vacating subordinate', function( done ) {
			request
			.put( '/offices/5/assign/0' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				new Office({ id: 5 })
				.fetch()
				.then( office => {
					office.get( 'userID' ).should.be.null;
					done();
				});
			});
		});

		it( 'works for officer assigning subordinate', function( done ) {
			request
			.put( '/offices/5/assign/5' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				new Office({ id: 5 })
				.fetch()
				.then( office => {
					office.get( 'userID' ).should.equal( 5 );
					done();
				});
			});
		});

		it( 'fails for assigning same officer', function( done ) {
			request
			.put( '/offices/5/assign/8' )
			.query({ token: 'nc' })
			.expect( 500, done );
		});
	});
};
