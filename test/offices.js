'use strict';

/**
 * Test for Offices Controller
 * @see controllers/auth.js
 */

const should  = require( 'should' );
const Promise = require( 'bluebird' );

const helpers = require( './helpers' );
const request = helpers.request;

const Office = require( '../models/offices' );

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

	describe( 'PUT update', function() {
		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/offices/5' )
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails if invalid ID is provided', function( done ) {
			request
			.put( '/offices/99' )
			.send({ name: 'Test' })
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails without data', function( done ) {
			request
			.put( '/offices/3' )
			.query({ token: 'nc' })
			.expect( 400, done );
		});

		it( 'fails if modifying office without permission', function( done ) {
			request
			.put( '/offices/5' )
			.query({ token: 'user' })
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails for invalid data', function( done ) {
			request
			.put( '/offices/5' )
			.query({ token: 'nc' })
			.send({ email: 'invalid' })
			.expect( 400, done );
		});

		it( 'works for modifying with permission', function( done ) {
			request
			.put( '/offices/5' )
			.query({ token: 'nc' })
			.send({
				name: 'Test',
				email: 'test@test.com',
				roles: [ 'user_update' ]
			})
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.office( res.body, true );
				res.body.should.have.properties({
					name: 'Test',
					email: 'test@test.com',
					roles: [ 'user_update' ]
				});
				done();
			});
		});

		after( 'reset data', function( done ) {
			new Office({ id: 5 })
			.save({
				name: 'DC',
				email: null,
				roles: [ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ]
			}, { patch: true })
			.then( () => done() );
		});
	});

	describe( 'POST assistant', function() {

		let data = {
			name: 'Test Assistant',
			email: 'adc@test.com',
			roles: [ 'user_read_private', 'user_update' ]
		};

		it( 'fails if no token is provided', function( done ) {
			request
			.post( '/offices/5/assistant' )
			.send( data )
			.expect( 403, done );
		});

		it( 'fails if invalid ID is provided', function( done ) {
			request
			.post( '/offices/99/assistant' )
			.send( data )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails without data', function( done ) {
			request
			.post( '/offices/5/assistant' )
			.query({ token: 'nc' })
			.expect( 400, done );
		});

		it( 'fails if creating assistant without permission', function( done ) {
			request
			.post( '/offices/5/assistant' )
			.query({ token: 'user' })
			.send( data )
			.expect( 403, done );
		});

		it( 'fails for invalid data', function( done ) {
			let badData = Object.assign( {}, data );
			badData.name = null;
			request
			.post( '/offices/5/assistant' )
			.query({ token: 'nc' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails if assigning permissions parent does not have', function( done ) {
			let badData = Object.assign( {}, data );
			badData.roles = data.roles.concat( 'invalid_perm' );
			request
			.post( '/offices/5/assistant' )
			.query({ token: 'nc' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'works for creating with permission', function( done ) {
			request
			.post( '/offices/5/assistant' )
			.query({ token: 'nc' })
			.send( data )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.office( res.body, true );
				res.body.should.have.properties( data );
				res.body.should.have.property( 'parentOfficeID', 5 );
				res.body.should.have.property( 'parentPath' ).and.startWith( '1.2.5.' );
				done();
			});
		});

		it( 'works for primary creating own assistant', function( done ) {
			request
			.post( '/offices/1/assistant' )
			.query({ token: 'nc' })
			.send( data )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.office( res.body, true );
				res.body.should.have.properties( data );
				res.body.should.have.property( 'parentOfficeID', 1 );
				res.body.should.have.property( 'parentPath' ).and.startWith( '1.' );
				done();
			});
		});

		after( 'delete assistants', function( done ) {
			data.roles = JSON.stringify( data.roles );
			new Office()
			.where( data )
			.destroy()
			.then( () => done() );
		});
	});

	describe( 'PUT assistant self', function() {
		let data = {
			name: 'Test Assistant Assistant',
			email: 'aadc@test.com',
			roles: [ 'user_read_private', 'user_update' ]
		};

		before( 'create assistant', function( done ) {
			new Office({
				id: 10,
				name: 'Test Assistant',
				userID: 5,
				parentOfficeID: 1,
				parentOrgID: 1,
				parentPath: '1.10',
				roles: [ 'user_read_private', 'user_update' ]
			})
			.save( null, { method: 'insert' } )
			.then( () => done() );
		});

		it( 'fails without permission', function( done ) {
			request
			.post( '/offices/10/assistant' )
			.query({ token: 'user' })
			.send( data )
			.expect( 403, done );
		});

		it( 'works for permission', function( done ) {
			new Office({ id: 10 })
			.set( 'roles', [ 'user_read_private', 'user_update', 'office_create_own_assistants' ] )
			.save()
			.then( office => {
				request
				.post( '/offices/10/assistant' )
				.query({ token: 'user' })
				.send( data )
				.expect( 200 )
				.end( ( err, res ) => {
					if ( err ) {
						return done( err );
					}
					helpers.models.office( res.body, true );
					res.body.should.have.properties( data );
					res.body.should.have.property( 'parentOfficeID', 1 );
					res.body.should.have.property( 'parentPath' ).and.startWith( '1.10.' );
					done();
				});
			});
		});

		after( 'delete assistant', function( done ) {
			new Office({ id: 10 })
			.destroy()
			.then( () => done() );
		});

		after( 'delete created assistant', function( done ) {
			data.roles = JSON.stringify( data.roles );
			new Office()
			.where( data )
			.destroy()
			.then( () => done() );
		});
	});
};
