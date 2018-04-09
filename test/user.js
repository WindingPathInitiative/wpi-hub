'use strict';

/**
 * Test for User Controller
 * @see controllers/user.js
 */

const should  = require( 'should' );
const Promise = require( 'bluebird' );

const helpers  = require( './helpers' );
const request  = helpers.request;
const internal = helpers.internal;

module.exports = function() {

	describe( 'GET', function() {
		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/v1/user' )
			.expect( 403, done );
		});

		it( 'fails when querying invalid domain', function( done ) {
			request
			.get( '/v1/user' )
			.query({ token: 'user' })
			.query({ orgUnit: 99 })
			.expect( 404, done );
		});

		// Instead of manually writing these, we're just making a big array.
		let tests = [
			{ query: {} },
			{ query: { name: 'unused' }, empty: true },
			{ query: { name: 'test' } },
			{ query: { email: 'unused' }, empty: true },
			{ query: { email: 'test@test.com' } },
			{ query: { mes: 'test' }, empty: true },
			{ query: { mes: 'US2012030038' } },
			{ query: { orgUnit: 4 }, empty: true },
			{ query: { orgUnit: 3 } },
			{ query: { name: 'expired', expired: false }, empty: true },
			{ query: { name: 'expired', expired: true } },
			{ query: { expired: false } },
			{ query: { expired: true } },
			{ query: { name: 'user', expired: false } },
			{ query: { name: 'user', expired: true }, empty: true },
			{ query: { name: 'user', type: 'full' } },
			{ query: { name: 'user', type: 'trial' }, empty: true },
			{ query: { name: 'trial', type: 'trial' } },
			{ query: { name: 'user', type: 'trial' }, empty: true },
			{ query: { name: 'suspended', type: 'suspended' } },
			{ query: { name: 'user', type: 'suspended' }, empty: true }
		];

		tests.forEach( test => {
			let s1 = test.empty ? 'empty array with unused' : 'list of users for used';
			let s2 = Object.keys( test.query ).join( ' and ' );
			let title = `returns ${ s1 } ${ s2 }`;

			it( title, function( done ) {
				request
				.get( '/v1/user' )
				.query({ token: 'user' })
				.query( test.query )
				.expect( 200 )
				.end( ( err, res ) => {
					if ( err ) {
						return done( err );
					}
					res.body.should.be.an.Array();
					if ( test.empty ) {
						res.body.should.be.empty();
					} else {
						res.body.should.be.not.empty();
						res.body.forEach( helpers.models.user );
					}
					done();
				});
			});
		});
	});

	describe( 'GET me', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/v1/user/me' )
			.expect( 403, done );
		});

		it( 'provides data if token is provided', function( done ) {
			request
			.get( '/v1/user/me' )
			.query({ token: 'user' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should
				.be.instanceOf( Object )
				.and.have.properties([
					'firstName',
					'lastName',
					'orgUnit',
					'fullName',
					'email',
					'address'
				]);
				res.body.should.have.property( 'id' ).Number();
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});

		it( 'provides office data if query set', function( done ) {
			request
			.get( '/v1/user/me' )
			.query({ token: 'admin' })
			.query({ offices: true })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.offices.forEach( office => helpers.models.office( office, true ) );
				done();
			});
		});

		it( 'provides office children if query set', function( done ) {
			request
			.get( '/v1/user/me' )
			.query({ token: 'admin' })
			.query({ offices: true, children: true })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.offices.forEach( office => {
					office.should.have.property( 'children' ).and.is.Array();
				});
				done();
			});
		});
	});

	describe( 'GET id', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/v1/user/1' )
			.expect( 403, done );
		});

		it( 'works for valid user id', function( done ) {
			request
			.get( '/v1/user/1' )
			.query({ token: 'user' })
			.expect( 200, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.get( '/v1/user/999999999999999' )
			.query({ token: 'user' })
			.expect( 404, done );
		});

		it( 'works for valid WPI number', function( done ) {
			request
			.get( '/v1/user/US2016010001' )
			.query({ token: 'user' })
			.expect( 200, done );
		});

		it( 'fails for invalid WPI number', function( done ) {
			request
			.get( '/v1/user/DA0000000000' )
			.query({ token: 'user' })
			.expect( 404, done );
		});

		it( 'provides open data if token is provided', function( done ) {
			request
			.get( '/v1/user/1' )
			.query({ token: 'user' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should
				.be.instanceOf( Object )
				.and.have.properties([
					'firstName',
					'lastName',
					'orgUnit',
					'fullName'
				])
				.and.not.have.property( 'email' );
				res.body.should.have.property( 'id' ).Number();
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});

		it( 'fails to provide private data if officer is expired', function( done ) {
			request
			.get( '/v1/user/1' )
			.query({ private: true })
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'provides open data if wrong auth provided', function( done ) {
			request
			.get( '/v1/user/1' )
			.query({ private: true })
			.query({ token: 'user' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should
				.be.instanceOf( Object )
				.and.have.properties([
					'firstName',
					'lastName',
					'orgUnit',
					'fullName'
				])
				.and.not.have.property( 'email' );
				res.body.should.have.property( 'id' ).Number();
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});

		it( 'provides private data if auth provided', function( done ) {
			request
			.get( '/v1/user/1' )
			.query({ private: true })
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should
				.be.instanceOf( Object )
				.and.have.properties([
					'firstName',
					'lastName',
					'orgUnit',
					'fullName',
					'email',
					'address'
				]);
				res.body.should.have.property( 'id' ).Number();
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});
	});

	describe( 'PUT id', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/v1/user/9' )
			.send({ firstName: 'Test' })
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/v1/user/999999999999999' )
			.send({ firstName: 'Test' })
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for expired user', function( done ) {
			request
			.put( '/v1/user/9' )
			.send({ firstName: 'Test' })
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails for suspended user', function( done ) {
			request
			.put( '/v1/user/9' )
			.send({ firstName: 'Test' })
			.query({ token: 'suspended' })
			.expect( 403, done );
		});

		it( 'fails for invalid WPI number', function( done ) {
			request
			.put( '/v1/user/DA0000000000' )
			.send({ firstName: 'Test' })
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails without data', function( done ) {
			request
			.put( '/v1/user/1' )
			.query({ token: 'nc' })
			.expect( 400, done );
		});

		it( 'fails for invalid data', function( done ) {
			request
			.put( '/v1/user/7' )
			.query({ token: 'nc' })
			.send({ email: 'Blah' })
			.expect( 400, done );
		});

		it( 'fails for unknown attributes', function( done ) {
			request
			.put( '/v1/user/7' )
			.query({ token: 'nc' })
			.send({ membershipType: 'Full' })
			.expect( 400, done );
		});

		it( 'fails if modifying user without permission', function( done ) {
			request
			.put( '/v1/user/1' )
			.query({ token: 'user' })
			.send({ firstName: 'Test' })
			.expect( 403, done );
		});

		it( 'works for user modifying themselves', function( done ) {
			request
			.put( '/v1/user/me' )
			.query({ token: 'user' })
			.send({ firstName: 'Test2' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'firstName', 'Test2' );
				done();
			});
		});

		it( 'works for modifying with permission', function( done ) {
			request
			.put( '/v1/user/7' )
			.query({ token: 'nc' })
			.send({ firstName: 'Test2' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'firstName', 'Test2' );
				done();
			});
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/user' );
			let p1 = new User({ id: 5 }).save({ firstName: 'Test' }, { patch: true });
			let p2 = new User({ id: 7 }).save({ firstName: 'Test' }, { patch: true });

			Promise.join( p1, p2, () => done() );
		});
	});

	describe( 'PUT assign', function() {

		before( 'create tokens', function( done ) {
			let makeToken = require( './helpers' ).makeToken;
			Promise.join(
				makeToken( 9, 'domainless' ),
				makeToken( 8, 'dc' ),
				() => done()
			);
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/v1/user/9/assign/3' )
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/v1/user/999999999999999/assign/3' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for expired user', function( done ) {
			request
			.put( '/v1/user/9/assign/3' )
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails for suspended user', function( done ) {
			request
			.put( '/v1/user/9/assign/3' )
			.query({ token: 'suspended' })
			.expect( 403, done );
		});

		it( 'fails for invalid WPI number', function( done ) {
			request
			.put( '/v1/user/DA0000000000/assign/3' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails if assigning to non-domain', function( done ) {
			request
			.put( '/v1/user/9/assign/2' )
			.query({ token: 'nc' })
			.expect( 500, done );
		});

		it( 'fails if assigning to invalid domain', function( done ) {
			request
			.put( '/v1/user/9/assign/999999' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails if assigning user without permission', function( done ) {
			request
			.put( '/v1/user/1/assign/3' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'works for user without domain assigning themselves', function( done ) {
			request
			.put( '/v1/user/9/assign/3' )
			.query({ token: 'domainless' })
			.expect( 200, done );
		});

		it( 'fails for user with domain assigning themselves', function( done ) {
			request
			.put( '/v1/user/me/assign/7' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'fails for user already in domain', function( done ) {
			request
			.put( '/v1/user/5/assign/3' )
			.query({ token: 'nc' })
			.expect( 500, done );
		});

		it( 'works for assigning outside user with permission over domain', function( done ) {
			request
			.put( '/v1/user/2/assign/3' )
			.query({ token: 'dc' })
			.expect( 200, done );
		});

		after( 'destroy tokens', function( done ) {
			let deleteToken = helpers.deleteToken;
			Promise.join(
				deleteToken( 'domainless' ),
				deleteToken( 'dc' ),
				() => done()
			);
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/user' );
			let p1 = new User({ id: 9 }).save({ orgUnit: null }, { patch: true });
			let p2 = new User({ id: 2 }).save({ orgUnit: 6 }, { patch: true });

			Promise.join( p1, p2, () => done() );
		});
	});

	describe( 'PUT suspend', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/v1/user/9/suspend' )
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/v1/user/999999999999999/suspend' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for invalid WPI number', function( done ) {
			request
			.put( '/v1/user/DA0000000000/suspend' )
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails for expired user', function( done ) {
			request
			.put( '/v1/user/9/suspend' )
			.query({ token: 'expired' })
			.expect( 403, done );
		});

		it( 'fails for suspended user', function( done ) {
			request
			.put( '/v1/user/9/suspend' )
			.query({ token: 'suspended' })
			.expect( 403, done );
		});

		it( 'fails without permission', function( done ) {
			request
			.put( '/v1/user/9/suspend' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'works to suspend with permission', function( done ) {
			request
			.put( '/v1/user/9/suspend' )
			.query({ token: 'nc' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'membershipType', 'Suspended' );
				done();
			});
		});

		it( 'works to restore with permission', function( done ) {
			request
			.put( '/v1/user/11/suspend' )
			.query({ token: 'nc' })
			.query({ restore: true })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'membershipType', 'Full' );
				done();
			});
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/user' );
			let p1 = new User({ id: 9 }).save({ membershipType: 'Full' }, { patch: true });
			let p2 = new User({ id: 11 }).save({ membershipType: 'Suspended' }, { patch: true });

			Promise.join( p1, p2, () => done() );
		});
	});

	describe( 'POST portal', function() {

		it( 'fails if accessed from the normal network', function( done ) {
			request
			.post( '/v1/user/portal' )
			.expect( 403 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'message', 'Request over insecure port' );
				res.body.should.have.property( 'status', 403 );
				done();
			});
		});

		it( 'fails if data not provided', function( done ) {
			internal
			.post( '/v1/user/portal' )
			.expect( 400 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'message', 'Invalid POST' );
				res.body.should.have.property( 'status', 400 );
				done();
			});
		});

		it( 'works to update a user', function( done ) {
			internal
			.post( '/v1/user/portal' )
			.send({
				id: '10',
				changes: {
					membership_number: 'US2016010010',
					firstname: 'Test',
					lastname: 'aRC',
					email: 'arc.members@test.org',
					type: 'Full',
					cam_expiry: '1577836800',
					membership_expiration: {
						date: '2020-01-01 00:00:00'
					},
					address: '301 Wilson Road',
					city: 'Cherry Hill',
					state: 'New Jersey',
					zip: '08001',
					country: 'US'
				}
			})
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'address' ).and.startWith( '301 Wilson Road' );
				helpers.models.user( res.body, true );
				done();
			});
		});

		it( 'works to create a user', function( done ) {
			internal
			.post( '/v1/user/portal' )
			.send({
				id: '1865',
				cam_id: 'US2010086415',
				changes: {
					membership_number: 'US2010086415',
					firstname: 'Joseph',
					lastname: 'Terranova',
					birthday: '1986-11-15',
					email: 'joeterranova@gmail.com',
					address: '301 Anywhere',
					city: 'Cherry Hill',
					state: 'New Jersey',
					zip: '08001',
					country: 'US',
					phone: '856-123-4567',
					cam_expiry: '1488758400',
					membership_expiration: {
						date: '2017-03-06 00:00:00',
						timezone_type: '3',
						timezone: 'UTC'
					},
					status: 'Member',
					type: 'Full'
				}
			})
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.user( res.body, true );
				res.body.should.have.properties({
					firstName: 'Joseph',
					lastName:  'Terranova'
				});
				done();
			});
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/user' );
			let p1 = new User({ id: 10 }).save({ address: null }, { patch: true });
			let p2 = new User().where({ portalID: 1865 }).destroy();

			Promise.join( p1, p2, () => done() );
		});

	});

	describe( 'GET id internal', function() {
		it( 'fails if accessed from the normal network', function( done ) {
			request
			.get( '/v1/user/1/internal' )
			.expect( 403, done );
		});

		it( 'fails if accessing a user that does not exist', function( done ) {
			internal
			.get( '/v1/user/1000/internal' )
			.expect( 404, done );
		});

		it( 'provides expected data', function( done ) {
			internal
			.get( '/v1/user/1/internal' )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				helpers.models.user( res.body, true );
				res.body.offices.forEach( o => helpers.models.office( o ) );
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});
	});
};
