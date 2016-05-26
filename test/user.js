'use strict';

/**
 * Test for User Controller
 * @see controllers/user.js
 */

const should      = require( 'should' );
const Promise     = require( 'bluebird' );

// Because there's no destructuring yet. :(
const helpers     = require( './helpers' );
const request     = helpers.request;
const makeToken   = helpers.makeToken;
const deleteToken = helpers.deleteToken;

module.exports = function() {

	describe( 'GET me', function() {

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
			.get( '/users/me' )
			.expect( 403, done );
		});

		it( 'provides data if token is provided', function( done ) {
			request
			.get( '/users/me' )
			.query({ token: token })
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
				res.body.should.have.property( 'id' ).Number;
				done();
			});
		});

		after( 'destroy token', function( done ) {
			deleteToken( token )
			.then( () => done() );
		});
	});

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
			.get( '/users/1' )
			.expect( 403, done );
		});

		it( 'works for valid user id', function( done ) {
			request
			.get( '/users/1' )
			.query({ token: token })
			.expect( 200, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.get( '/users/999999999999999' )
			.query({ token: token })
			.expect( 404, done );
		});

		it( 'works for valid MES number', function( done ) {
			request
			.get( '/users/US2016010001' )
			.query({ token: token })
			.expect( 200, done );
		});

		it( 'fails for invalid MES number', function( done ) {
			request
			.get( '/users/DA0000000000' )
			.query({ token: token })
			.expect( 404, done );
		});

		it( 'provides data if token is provided', function( done ) {
			request
			.get( '/users/1' )
			.query({ token: token })
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
				res.body.should.have.property( 'id' ).Number;
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});

		after( 'destroy token', function( done ) {
			deleteToken( token )
			.then( () => done() );
		});
	});

	describe( 'GET private', function() {
		var token1, token2;
		before( 'create token', function( done ) {
			let promise1 = makeToken( 5 )
			.then( data => {
				token1 = data.id;
			});

			let promise2 = makeToken( 2 )
			.then( data => {
				token2 = data.id;
			});

			Promise.join( promise1, promise2, () => {
				done();
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/users/1/private' )
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.get( '/users/999999999999999/private' )
			.query({ token: token2 })
			.expect( 404, done );
		});

		it( 'fails for invalid MES number', function( done ) {
			request
			.get( '/users/DA0000000000/private' )
			.query({ token: token2 })
			.expect( 404, done );
		});

		it( 'works for self', function( done ) {
			request
			.get( '/users/5/private' )
			.query({ token: token1 })
			.expect( 200, done );
		});

		it( 'fails with no permission', function( done ) {
			request
			.get( '/users/2/private' )
			.query({ token: token1 })
			.expect( 403, done );
		});

		it( 'works for correct permission', function( done ) {
			request
			.get( '/users/1/private' )
			.query({ token: token2 })
			.expect( 200, done );
		});

		it( 'provides data if token is provided', function( done ) {
			request
			.get( '/users/1/private' )
			.query({ token: token2 })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should
				.be.instanceOf( Object )
				.and.have.properties([
					'firstName', 'lastName',
					'orgUnit', 'fullName'
				])
				.and.have.property( 'email' );
				res.body.should.have.property( 'id' ).Number;
				helpers.models.orgUnit( res.body.orgUnit );
				done();
			});
		});

		after( 'destroy token', function( done ) {
			Promise.join(
				deleteToken( token1 ),
				deleteToken( token2 ),
				() => done()
			);
		});
	});

	describe( 'PUT id', function() {
		var userToken, ncToken, dcToken;

		before( 'create tokens', function( done ) {
			let promise1 = makeToken( 9 )
			.then( data => {
				userToken = data.id;
			});

			let promise2 = makeToken( 2 )
			.then( data => {
				ncToken = data.id;
			});

			let promise3 = makeToken( 3 )
			.then( data => {
				dcToken = data.id;
			});

			Promise.join( promise1, promise2, promise3, () => {
				done();
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/users/9' )
			.send({ firstName: 'Test' })
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/users/999999999999999' )
			.send({ firstName: 'Test' })
			.query({ token: ncToken })
			.expect( 404, done );
		});

		it( 'fails for invalid MES number', function( done ) {
			request
			.put( '/users/DA0000000000' )
			.send({ firstName: 'Test' })
			.query({ token: ncToken })
			.expect( 404, done );
		});

		it( 'fails without data', function( done ) {
			request
			.put( '/users/1' )
			.query({ token: ncToken })
			.expect( 400, done );
		});

		it( 'fails if modifying user without permission', function( done ) {
			request
			.put( '/users/1' )
			.query({ token: userToken })
			.send({ firstName: 'Test' })
			.expect( 403, done );
		});

		it( 'works for user modifying themselves', function( done ) {
			request
			.put( '/users/9' )
			.query({ token: userToken })
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
			.put( '/users/7' )
			.query({ token: dcToken })
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
			.put( '/users/7' )
			.query({ token: dcToken })
			.send({ membershipType: 'Blah' })
			.expect( 400, done );
		});

		after( 'destroy tokens', function( done ) {
			Promise.join(
				deleteToken( userToken ),
				deleteToken( ncToken ),
				deleteToken( dcToken ),
				() => done()
			);
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/users' );
			let p1 = new User({ id: 9 }).save({ firstName: 'Test' }, { patch: true });
			let p2 = new User({ id: 7 }).save({ membershipType: 'Trial' }, { patch: true });

			Promise.join( p1, p2, () => done() );
		});
	});

	describe( 'PUT assign', function() {
		var userToken, ncToken, dcToken;
		before( 'create tokens', function( done ) {
			let promise1 = makeToken( 9 )
			.then( data => {
				userToken = data.id;
			});

			let promise2 = makeToken( 2 )
			.then( data => {
				ncToken = data.id;
			});

			let promise3 = makeToken( 3 )
			.then( data => {
				dcToken = data.id;
			});

			Promise.join( promise1, promise2, promise3, () => {
				done();
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/users/9/assign/3' )
			.expect( 403, done );
		});

		it( 'fails for invalid user id', function( done ) {
			request
			.put( '/users/999999999999999/assign/3' )
			.query({ token: ncToken })
			.expect( 404, done );
		});

		it( 'fails for invalid MES number', function( done ) {
			request
			.put( '/users/DA0000000000/assign/3' )
			.query({ token: ncToken })
			.expect( 404, done );
		});

		it( 'fails if assigning to non-domain', function( done ) {
			request
			.put( '/users/9/assign/2' )
			.query({ token: ncToken })
			.expect( 500, done );
		});

		it( 'fails if assigning to invalid domain', function( done ) {
			request
			.put( '/users/9/assign/999999' )
			.query({ token: ncToken })
			.expect( 404, done );
		});

		it( 'fails if assigning user without permission', function( done ) {
			request
			.put( '/users/1/assign/3' )
			.query({ token: userToken })
			.expect( 403, done );
		});

		it( 'works for user without domain assigning themselves', function( done ) {
			request
			.put( '/users/9/assign/3' )
			.query({ token: userToken })
			.expect( 200, done );
		});

		it( 'fails for user with domain assigning themselves', function( done ) {
			request
			.put( '/users/9/assign/7' )
			.query({ token: userToken })
			.expect( 403, done );
		});

		it( 'fails for user already in domain', function( done ) {
			request
			.put( '/users/9/assign/3' )
			.query({ token: ncToken })
			.expect( 500, done );
		});

		it( 'works for assigning outside user with permission over domain', function( done ) {
			request
			.put( '/users/2/assign/3' )
			.query({ token: dcToken })
			.expect( 200, done );
		});

		after( 'destroy tokens', function( done ) {
			Promise.join(
				deleteToken( userToken ),
				deleteToken( ncToken ),
				deleteToken( dcToken ),
				() => done()
			);
		});

		after( 'reset users', function( done ) {
			let User = require( '../models/users' );
			let p1 = new User({ id: 9 }).save({ orgUnit: null }, { patch: true });
			let p2 = new User({ id: 2 }).save({ orgUnit: 6 }, { patch: true });

			Promise.join( p1, p2, () => done() );
		});
	});

	describe( 'GET search', function() {
		var userToken, expiredToken;
		before( 'create tokens', function( done ) {
			let userPromise = makeToken( 1 )
			.then( data => {
				userToken = data.id;
			});

			let expiredPromise = makeToken( 6 )
			.then( data => {
				expiredToken = data.id;
			});

			Promise.join( userPromise, expiredPromise, () => {
				done();
			});
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/users/search' )
			.expect( 403, done );
		});

		it( 'fails if expired token is provided', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: expiredToken })
			.expect( 403, done );
		});

		it( 'fails if no params provided', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.expect( 400, done );
		});

		it( 'returns empty array with unused name', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ name: 'foo' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.be.empty;
				done();
			});
		});

		it( 'returns list of users for used name', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ name: 'test' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.be.not.empty;
				res.body.forEach( helpers.models.user );
				done();
			});
		});

		it( 'returns empty array with unused email', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ email: 'foo' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.be.empty;
				done();
			});
		});

		it( 'returns user for used email', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ email: 'test@test.com' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.have.length( 1 );
				res.body.forEach( helpers.models.user );
				done();
			});
		});

		it( 'returns empty array with unused MES number', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ mes: 'foo' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.be.empty;
				done();
			});
		});

		it( 'returns user for used MES number', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ mes: 'US2012030038' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.have.length( 1 );
				res.body.forEach( helpers.models.user );
				done();
			});
		});

		it( 'fails when querying invalid domain', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ orgUnit: 99 })
			.expect( 404, done );
		});

		it( 'returns empty array for empty org unit', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ orgUnit: 4 })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.be.empty;
				done();
			});
		});

		it( 'returns list of users for org unit', function( done ) {
			request
			.get( '/users/search' )
			.query({ token: userToken })
			.query({ orgUnit: 3 })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.be.an.Array;
				res.body.should.not.be.empty;
				res.body.forEach( helpers.models.user );
				done();
			});
		});

		after( 'destroy tokens', function( done ) {
			Promise.join(
				deleteToken( userToken ),
				deleteToken( expiredToken ),
				() => done()
			);
		});
	});
};
