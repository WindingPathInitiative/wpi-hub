'use strict';

/**
 * Test for Offices Controller
 * @see controllers/auth.js
 */

const should  = require( 'should' );
const Promise = require( 'bluebird' );

const helpers = require( './helpers' );
const request = helpers.request;

const Office = require( '../models/office' );

module.exports = function() {

	before( 'creates tokens', function( done ) {
		Promise.join(
			helpers.makeToken( 3, 'rc' ),
			helpers.makeToken( 10, 'arc' ),
			() => done()
		);
	});

	describe( 'GET id', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/v1/office/1' )
			.expect( 403, done );
		});

		it( 'fails if invalid id is provided', function( done ) {
			request
			.get( '/v1/office/1111111' )
			.query({ token: 'user' })
			.expect( 404, done );
		});

		it( 'provides the correct data', function( done ) {
			request
			.get( '/v1/office/1' )
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
				body.should.have.property( 'roles' ).is.Array();

				body.should.have.property( 'orgUnit' ).is.Object();
				helpers.models.orgUnit( body.orgUnit );

				body.should.have.property( 'user' ).is.Object();
				helpers.models.user( body.user );

				done();
			});
		});
	});

	describe( 'GET me', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/v1/office/me' )
			.expect( 403, done );
		});

		it( 'provides no data for user without office', function( done ) {
			request
			.get( '/v1/office/me' )
			.query({ token: 'user' })
			.expect( 200, [], done );
		});

		it( 'provides data for user with office', function( done ) {
			request
			.get( '/v1/office/me' )
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
				office.should.have.property( 'roles' ).is.Array();

				done();
			});
		});
	});

	describe( 'PUT assign', function() {

		afterEach( 'reset officers', function( done ) {
			Promise.join(
				new Office({ id: 1 }).save( { userID: 2 }, { patch: true } ),
				new Office({ id: 7 }).save( { userID: 8 }, { patch: true } ),
				() => done()
			);
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/v1/office/7/assign/7' )
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/v1/office/7/assign/99' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for expired user', function( done ) {
			request
			.put( '/v1/office/7/assign/7' )
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails for invalid office id', function( done ) {
			request
			.put( '/v1/office/99/assign/7' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for assigning without permission', function( done ) {
			request
			.put( '/v1/office/7/assign/7' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'fails for vacating without permission', function( done ) {
			request
			.put( '/v1/office/7/assign/0' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'works for officer vacating themselves', function( done ) {
			request
			.put( '/v1/office/1/assign/0' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				new Office({ id: 1 })
				.fetch()
				.then( office => {
					office.get( 'userID' ).should.be.equal( 0 );
					done();
				});
			});
		});

		it( 'works for officer vacating subordinate', function( done ) {
			request
			.put( '/v1/office/7/assign/0' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				new Office({ id: 7 })
				.fetch()
				.then( office => {
					office.get( 'userID' ).should.be.equal( 0 );
					done();
				});
			});
		});

		it( 'works for officer assigning subordinate', function( done ) {
			request
			.put( '/v1/office/7/assign/5' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				new Office({ id: 7 })
				.fetch()
				.then( office => {
					office.get( 'userID' ).should.equal( 5 );
					done();
				});
			});
		});

		it( 'fails for assigning same officer', function( done ) {
			request
			.put( '/v1/office/7/assign/8' )
			.query({ token: 'nc' })
			.expect( 500, done );
		});
	});

	describe( 'PUT update', function() {
		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/v1/office/7' )
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails if invalid ID is provided', function( done ) {
			request
			.put( '/v1/office/99' )
			.send({ name: 'Test' })
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails if user is expired', function( done ) {
			request
			.put( '/v1/office/7' )
			.send({ name: 'Test' })
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails without data', function( done ) {
			request
			.put( '/v1/office/3' )
			.query({ token: 'nc' })
			.expect( 400, done );
		});

		it( 'fails if modifying office without permission', function( done ) {
			request
			.put( '/v1/office/7' )
			.query({ token: 'user' })
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails for invalid data', function( done ) {
			request
			.put( '/v1/office/7' )
			.query({ token: 'nc' })
			.send({ email: 'invalid' })
			.expect( 400, done );
		});

		it( 'works for modifying with permission', function( done ) {
			request
			.put( '/v1/office/7' )
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
			new Office({ id: 7 })
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
			.post( '/v1/office/7/assistant' )
			.send( data )
			.expect( 403, done );
		});

		it( 'fails if invalid ID is provided', function( done ) {
			request
			.post( '/v1/office/99/assistant' )
			.send( data )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails if user is expired', function( done ) {
			request
			.post( '/v1/office/7/assistant' )
			.send( data )
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails without data', function( done ) {
			request
			.post( '/v1/office/7/assistant' )
			.query({ token: 'nc' })
			.expect( 400, done );
		});

		it( 'fails if creating assistant without permission', function( done ) {
			request
			.post( '/v1/office/7/assistant' )
			.query({ token: 'user' })
			.send( data )
			.expect( 403, done );
		});

		it( 'fails for invalid data', function( done ) {
			let badData = Object.assign( {}, data );
			badData.name = null;
			request
			.post( '/v1/office/7/assistant' )
			.query({ token: 'nc' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails if assigning permissions parent does not have', function( done ) {
			let badData = Object.assign( {}, data );
			badData.roles = data.roles.concat( 'invalid_perm' );
			request
			.post( '/v1/office/7/assistant' )
			.query({ token: 'nc' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'works for creating with permission', function( done ) {
			request
			.post( '/v1/office/7/assistant' )
			.query({ token: 'nc' })
			.send( data )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.office( res.body, true );
				res.body.should.have.properties( data );
				res.body.should.have.property( 'parentOfficeID', 7 );
				res.body.should.have.property( 'parentPath' ).and.startWith( '1.3.7.' );
				done();
			});
		});

		it( 'works for primary creating own assistant', function( done ) {
			request
			.post( '/v1/office/1/assistant' )
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
			email: 'aarc@test.com',
			roles: [ 'user_read_private', 'user_update' ]
		};

		before( 'creates assistant', function( done ) {
			new Office({
				id: 11,
				name: 'Test Assistant',
				userID: 5,
				parentOfficeID: 2,
				parentOrgID: 2,
				parentPath: '1.2.11',
				roles: [ 'user_read_private', 'user_update' ]
			})
			.save( null, { method: 'insert' } )
			.then( () => done() );
		});

		it( 'fails if expired', function( done ) {
			request
			.post( '/v1/office/11/assistant' )
			.query({ token: 'expired' })
			.send( data )
			.expect( 403, done );
		});

		it( 'fails without permission', function( done ) {
			request
			.post( '/v1/office/11/assistant' )
			.query({ token: 'user' })
			.send( data )
			.expect( 403, done );
		});

		it( 'works for permission', function( done ) {
			request
			.post( '/v1/office/9/assistant' )
			.query({ token: 'arc' })
			.send( data )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.office( res.body, true );
				res.body.should.have.properties( data );
				res.body.should.have.property( 'parentOfficeID', 3 );
				res.body.should.have.property( 'parentPath' ).and.startWith( '1.3.9.' );
				done();
			});
		});

		after( 'delete assistant', function( done ) {
			new Office({ id: 11 })
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

	describe( 'DELETE assistant', function() {

		before( 'create second assistant', function( done ) {
			let office = new Office({
				id: 11,
				name: 'Test Assistant',
				userID: 8,
				parentOfficeID: 7,
				parentOrgID: 3,
				parentPath: '1.3.7.11',
				roles: [ 'office_create_assistants' ]
			})
			.save( null, { method: 'insert' } );

			Promise.join(
				office,
				helpers.makeToken( 8, 'adc' ),
				() => done()
			);
		});

		beforeEach( 'create assistant', function( done ) {
			new Office({ id: 10 })
			.fetch({ require: true })
			.then( () => done() )
			.catch( () => {
				new Office({
					id: 10,
					name: 'Test Assistant',
					userID: 5,
					parentOfficeID: 7,
					parentOrgID: 3,
					parentPath: '1.3.7.10',
					roles: [ 'user_read_private', 'user_update' ],
					type: 'Assistant'
				})
				.save( null, { method: 'insert' } )
				.then( () => done() );
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.delete( '/v1/office/10/assistant' )
			.expect( 403, done );
		});

		it( 'fails if invalid ID is provided', function( done ) {
			request
			.delete( '/v1/office/99/assistant' )
			.query({ token: 'rc' })
			.expect( 404, done );
		});

		it( 'fails if office is not an assistant', function( done ) {
			request
			.delete( '/v1/office/7/assistant' )
			.query({ token: 'rc' })
			.expect( 400, done );
		});

		it( 'fails if user is expired', function( done ) {
			request
			.delete( '/v1/office/10/assistant' )
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails without permission', function( done ) {
			request
			.delete( '/v1/office/10/assistant' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'works for primary in chain', function( done ) {
			request
			.delete( '/v1/office/10/assistant' )
			.query({ token: 'nc' })
			.expect( 200, done );
		});

		it( 'works for assistant to primary', function( done ) {
			request
			.delete( '/v1/office/10/assistant' )
			.query({ token: 'arc' })
			.expect( 200, done );
		});

		it( 'works for assistant in chain', function( done ) {
			request
			.delete( '/v1/office/10/assistant' )
			.query({ token: 'arc' })
			.expect( 200, done );
		});

		after( 'deletes assistant', function( done ) {
			new Office({ id: 10 })
			.destroy()
			.then( () => done() );
		});

		after( 'deletes second assistant', function( done ) {
			Promise.join(
				new Office({ id: 11 }).destroy(),
				helpers.deleteToken( 'adc' ),
				() => done()
			);
		});
	});

	after( 'deletes token', function( done ) {
		Promise.join(
			helpers.deleteToken( 'rc' ),
			helpers.deleteToken( 'arc' ),
			() => done()
		);
	});
};
