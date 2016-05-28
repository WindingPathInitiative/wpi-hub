'use strict';

/**
 * Test for Org Unit Controller
 * @see controllers/auth.js
 */

const should      = require( 'should' );
const Promise     = require( 'bluebird' );
const helpers     = require( './helpers' );
const request     = helpers.request;
const makeToken   = helpers.makeToken;
const deleteToken = helpers.deleteToken;

module.exports = function() {

	describe( 'GET code', function() {

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
			.get( '/orgunits/ny-004' )
			.expect( 403, done );
		});

		it( 'fails if invalid code is provided', function( done ) {
			request
			.get( '/orgunits/fd-434221' )
			.query({ token: token })
			.expect( 404, done );
		});

		it( 'fails if an id is provided', function( done ) {
			request
			.get( '/orgunits/1' )
			.query({ token: token })
			.expect( 404, done );
		});

		it( 'works if valid code is provided', function( done ) {
			request
			.get( '/orgunits/ne' )
			.query({ token: token })
			.expect( 200, done );
		});

		it( 'provides the correct data', function( done ) {
			request
			.get( '/orgunits/ny-004' )
			.query({ token: token })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'unit' ).is.Object;
				let unit = res.body.unit;
				unit.should.have.property( 'id' ).is.Number;
				unit.should.have.property( 'name' ).is.String;

				unit.should.have.property( 'users' ).is.Array;
				unit.users.forEach( helpers.models.user );

				unit.should.have.property( 'offices' ).is.Array;
				unit.offices.forEach( helpers.models.office );

				res.body.should.have.property( 'children' ).is.Array;
				res.body.children.forEach( helpers.models.orgUnit );

				res.body.should.have.property( 'parents' ).is.Array;
				res.body.parents.forEach( helpers.models.orgUnit );

				done();
			});
		});

		after( 'destroy token', function( done ) {
			deleteToken( token )
			.then( () => done() );
		});
	});

	describe( 'GET internal', function() {
		it( 'fails if code is provided', function( done ) {
			request
			.get( '/orgunits/internal/ny-004' )
			.expect( 404, done );
		});

		it( 'works if an id is provided', function( done ) {
			request
			.get( '/orgunits/internal/1' )
			.expect( 200, done );
		});

		it( 'provides the correct data', function( done ) {
			request
			.get( '/orgunits/internal/3' )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'unit' ).is.Object;
				let unit = res.body.unit;
				unit.should.have.property( 'id' ).is.Number;
				unit.should.have.property( 'name' ).is.String;
				unit.should.not.have.property( 'users' ).is.Array;
				unit.should.not.have.property( 'offices' ).is.Array;

				res.body.should.have.property( 'children' ).is.Array;
				res.body.children.forEach( helpers.models.orgUnit );

				res.body.should.have.property( 'parents' ).is.Array;
				res.body.parents.forEach( helpers.models.orgUnit );

				done();
			});
		});
	});

	describe( 'PUT code', function() {

		var rcToken, userToken;

		before( 'create tokens', function( done ) {
			let userPromise = makeToken( 5 )
			.then( data => {
				userToken = data.id;
			});

			let rcPromise = makeToken( 3 )
			.then( data => {
				rcToken = data.id;
			});

			Promise.join(
				userPromise,
				rcPromise,
				() => done()
			);
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.put( '/orgunits/3' )
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails if invalid code is provided', function( done ) {
			request
			.put( '/orgunits/99' )
			.send({ name: 'Test' })
			.query({ token: rcToken })
			.expect( 404, done );
		});

		it( 'fails without data', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: rcToken })
			.expect( 400, done );
		});

		it( 'fails if modifying org unit without permission', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: userToken })
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails for invalid data', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: rcToken })
			.send({ type: 'Blah' })
			.expect( 400, done );
		});

		it( 'works for modifying with permission', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: rcToken })
			.send({ name: 'Test' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'name', 'Test' );
				done();
			});
		});

		after( 'destroy token', function( done ) {
			Promise.join(
				deleteToken( userToken ),
				deleteToken( rcToken ),
				() => done()
			);
		});

		after( 'reset data', function( done ) {
			let OrgUnit = require( '../models/org_units' );
			new OrgUnit({ id: 3 })
			.save( { name: 'Children of the Lost Eden' }, { patch: true } )
			.then( () => done() );
		});
	});

	describe( 'POST new', function() {

		var adminToken, userToken, data;

		data = {
			id: 10,
			name: 'Test Domain',
			code: 'XX-000',
			location: 'Narnia',
			defDoc: 'Test domain, please ignore!',
			website: 'http://www.example.com',
			type: 'Domain',
			parentID: 5
		};

		before( 'create tokens', function( done ) {
			let userPromise = makeToken( 3 )
			.then( data => {
				userToken = data.id;
			});

			let adminPromise = makeToken( 1 )
			.then( data => {
				adminToken = data.id;
			});

			Promise.join(
				userPromise,
				adminPromise,
				() => done()
			);
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.post( '/orgunits' )
			.send( data )
			.expect( 403, done );
		});

		it( 'fails without data', function( done ) {
			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.expect( 400, done );
		});

		it( 'fails if creating org unit without permission', function( done ) {
			request
			.post( '/orgunits' )
			.query({ token: userToken })
			.send( data )
			.expect( 403, done );
		});

		it( 'fails without parent', function( done ) {
			let badData = Object.assign( {}, data );
			badData.parentID = null;

			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails with nonexistent parent', function( done ) {
			let badData = Object.assign( {}, data );
			badData.parentID = 99;

			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails with incorrect type', function( done ) {
			let badData = Object.assign( {}, data );
			badData.type = 'Region';

			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails with invalid data', function( done ) {
			let badData = Object.assign( {}, data );
			badData.type = 'Wrong';
			badData.website = 'fffffff';

			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails if ID already exists', function( done ) {
			let badData = Object.assign( {}, data );
			badData.id = 1;

			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.send( badData )
			.expect( 500, done );
		});

		it( 'works for creating with permission', function( done ) {
			request
			.post( '/orgunits' )
			.query({ token: adminToken })
			.send( data )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				delete data.parentID;
				res.body.should.have.properties( data );
				done();
			});
		});

		after( 'destroy token', function( done ) {
			Promise.join(
				deleteToken( userToken ),
				deleteToken( adminToken ),
				() => done()
			);
		});

		after( 'delete org unit', function( done ) {
			let OrgUnit = require( '../models/org_units' );
			new OrgUnit({ id: data.id })
			.destroy()
			.then( () => done() );
		});
	});
};
