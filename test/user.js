'use strict';

/**
 * Test for User Controller
 * @see controllers/user.js
 */

const should  = require( 'should' );
const Promise = require( 'bluebird' );

const helpers = require( './helpers' );
const request = helpers.request;

module.exports = function() {

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
					'firstName', 'lastName',
					'email', 'orgUnit', 'fullName'
				]);
				res.body.should.have.property( 'id' ).Number();
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

		it( 'works for valid MES number', function( done ) {
			request
			.get( '/v1/user/US2016010001' )
			.query({ token: 'user' })
			.expect( 200, done );
		});

		it( 'fails for invalid MES number', function( done ) {
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

		it( 'fails for invalid MES number', function( done ) {
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

		it( 'fails if modifying user without permission', function( done ) {
			request
			.put( '/v1/user/1' )
			.query({ token: 'user' })
			.send({ firstName: 'Test' })
			.expect( 403, done );
		});

		it( 'works for user modifying themselves', function( done ) {
			request
			.put( '/v1/user/5' )
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
			.send({ membershipType: 'Full' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'membershipType', 'Full' );
				done();
			});
		});

		it( 'fails for invalid data', function( done ) {
			request
			.put( '/v1/user/7' )
			.query({ token: 'nc' })
			.send({ membershipType: 'Blah' })
			.expect( 400, done );
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/user' );
			let p1 = new User({ id: 5 }).save({ firstName: 'Test' }, { patch: true });
			let p2 = new User({ id: 7 }).save({ membershipType: 'Trial' }, { patch: true });

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

		it( 'fails for invalid MES number', function( done ) {
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
			.put( '/v1/user/5/assign/7' )
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

	describe( 'GET', function() {
		before( 'create token', function( done ) {
			let makeToken = require( './helpers' ).makeToken;
			makeToken( 6, 'expired' ).then( () => done() );
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/v1/user' )
			.expect( 403, done );
		});

		it( 'fails if expired token is provided', function( done ) {
			request
			.get( '/v1/user' )
			.query({ token: 'expired' })
			.query({ name: 'test' })
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
			{ query: { name: 'user', expired: true }, empty: true }
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

		after( 'destroy token', function( done ) {
			let deleteToken = require( './helpers' ).deleteToken;
			deleteToken( 'expired' ).then( () => done() );
		});
	});
};
