'use strict';

/**
 * Test for Org Unit Controller
 * @see controllers/auth.js
 */

const should  = require( 'should' );
const Promise = require( 'bluebird' );
const helpers = require( './helpers' );
const request = helpers.request;

module.exports = function() {

	describe( 'GET code', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/orgunits/ny-004' )
			.expect( 403, done );
		});

		it( 'fails if invalid code is provided', function( done ) {
			request
			.get( '/orgunits/fd-434221' )
			.query({ token: 'user' })
			.expect( 404, done );
		});

		it( 'fails if an id is provided', function( done ) {
			request
			.get( '/orgunits/1' )
			.query({ token: 'user' })
			.expect( 404, done );
		});

		it( 'works if valid code is provided', function( done ) {
			request
			.get( '/orgunits/ne' )
			.query({ token: 'user' })
			.expect( 200, done );
		});

		it( 'provides the correct data', function( done ) {
			request
			.get( '/orgunits/ny-004' )
			.query({ token: 'user' })
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				res.body.should.have.property( 'unit' ).is.Object();
				let unit = res.body.unit;
				unit.should.have.property( 'id' ).is.Number();
				unit.should.have.property( 'name' ).is.String();

				unit.should.have.property( 'users' ).is.Array();
				unit.users.forEach( helpers.models.user );

				unit.should.have.property( 'offices' ).is.Array();
				unit.offices.forEach( helpers.models.office );

				res.body.should.have.property( 'children' ).is.Array();
				res.body.children.should.have.length( 1 );
				res.body.children.forEach( helpers.models.orgUnit );

				res.body.should.have.property( 'parents' ).is.Array();
				res.body.parents.should.have.length( 2 );
				res.body.parents.forEach( helpers.models.orgUnit );

				done();
			});
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
				res.body.should.have.property( 'unit' ).is.Object();
				let unit = res.body.unit;
				unit.should.have.property( 'id' ).is.Number();
				unit.should.have.property( 'name' ).is.String();
				unit.should.not.have.property( 'users' );
				unit.should.not.have.property( 'offices' );

				res.body.should.have.property( 'children' ).is.Array();
				res.body.children.forEach( helpers.models.orgUnit );

				res.body.should.have.property( 'parents' ).is.Array();
				res.body.parents.forEach( helpers.models.orgUnit );

				done();
			});
		});
	});

	describe( 'PUT code', function() {

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
			.query({ token: 'nc' })
			.expect( 404, done );
		});

		it( 'fails without data', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: 'nc' })
			.expect( 400, done );
		});

		it( 'fails if modifying org unit without permission', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: 'user' })
			.send({ name: 'Test' })
			.expect( 403, done );
		});

		it( 'fails for invalid data', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: 'nc' })
			.send({ type: 'Blah' })
			.expect( 400, done );
		});

		it( 'works for modifying with permission', function( done ) {
			request
			.put( '/orgunits/3' )
			.query({ token: 'nc' })
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

		after( 'reset data', function( done ) {
			let OrgUnit = require( '../models/org_units' );
			new OrgUnit({ id: 3 })
			.save( { name: 'Children of the Lost Eden' }, { patch: true } )
			.then( () => done() );
		});
	});

	describe( 'POST new', function() {

		var data = {
			id: 10,
			name: 'Test Domain',
			code: 'XX-000',
			location: 'Narnia',
			defDoc: 'Test domain, please ignore!',
			website: 'http://www.example.com',
			type: 'Domain',
			parentID: 2
		};

		it( 'fails if no token is provided', function( done ) {
			request
			.post( '/orgunits' )
			.send( data )
			.expect( 403, done );
		});

		it( 'fails without data', function( done ) {
			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.expect( 400, done );
		});

		it( 'fails if creating org unit without permission', function( done ) {
			request
			.post( '/orgunits' )
			.query({ token: 'user' })
			.send( data )
			.expect( 403, done );
		});

		it( 'fails without parent', function( done ) {
			let badData = Object.assign( {}, data );
			badData.parentID = null;

			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails with nonexistent parent', function( done ) {
			let badData = Object.assign( {}, data );
			badData.parentID = 99;

			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails with incorrect type', function( done ) {
			let badData = Object.assign( {}, data );
			badData.type = 'Region';

			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails with invalid data', function( done ) {
			let badData = Object.assign( {}, data );
			badData.type = 'Wrong';
			badData.website = 'fffffff';

			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.send( badData )
			.expect( 400, done );
		});

		it( 'fails if ID already exists', function( done ) {
			let badData = Object.assign( {}, data );
			badData.id = 1;

			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.send( badData )
			.expect( 500, done );
		});

		it( 'works for creating with permission', function( done ) {
			request
			.post( '/orgunits' )
			.query({ token: 'admin' })
			.send( data )
			.expect( 200 )
			.end( ( err, res ) => {
				if ( err ) {
					return done( err );
				}
				delete data.parentID;
				res.body.should.have.properties( data );
				res.body.should.have.property( 'offices' ).and.be.an.Array();
				res.body.offices.forEach( helpers.models.office );
				done();
			});
		});

		after( 'delete org unit', function( done ) {
			let OrgUnit = require( '../models/org_units' );
			let Office = require( '../models/offices' );
			Promise.join(
				new OrgUnit({ id: data.id }).destroy(),
				new Office().where( 'parentOrgID', data.id ).destroy(),
				() => done()
			);
		});
	});

	describe( 'DELETE id', function() {

		before( 'create units', function( done ) {
			let OrgUnit = require( '../models/org_units' );
			let User    = require( '../models/users' );
			let Office  = require( '../models/offices' );

			let domain = new OrgUnit({
				id: 10,
				name: 'Test Domain',
				code: 'XX-000',
				location: 'Narnia',
				defDoc: 'Test domain, please ignore!',
				website: 'http://www.example.com',
				type: 'Domain',
				parentPath: '1.2.10'
			})
			.save( {}, { method: 'insert' } );

			let user = new User({
				id: 9,
				orgUnit: 10
			})
			.save();

			let office = new Office({
				id: 11,
				name: 'Test Officer',
				type: 'Primary',
				parentPath: '10',
				parentOrgID: 10
			})
			.save( {}, { method: 'insert' } );

			Promise.join(
				domain,
				user,
				office,
				() => done()
			);
		});

		it( 'fails if no token is provided', function( done ) {
			request
			.delete( '/orgunits/10' )
			.expect( 403, done );
		});

		it( 'fails if no permission', function( done ) {
			request
			.delete( '/orgunits/10' )
			.query({ token: 'user' })
			.expect( 403, done );
		});

		it( 'fails if target is root', function( done ) {
			request
			.delete( '/orgunits/1' )
			.query({ token: 'admin' })
			.expect( 500, done );
		});

		it( 'fails if target has children', function( done ) {
			request
			.delete( '/orgunits/2' )
			.query({ token: 'admin' })
			.expect( 500, done );
		});

		it( 'works for deleting with no children', function( done ) {
			request
			.delete( '/orgunits/10' )
			.query({ token: 'admin' })
			.expect( 200 )
			.end( ( err, res ) => {
				let User    = require( '../models/users' );
				let Office  = require( '../models/offices' );

				let user = new User({ id: 9 })
				.fetch()
				.then( user => {
					user.get( 'orgUnit' ).should.equal( 2, 'User is now on parent' );
				});

				let office = new Office({ id: 11 })
				.fetch()
				.then( office => {
					( null === office ).should.be.true( 'Office does not exist' );
				});

				Promise.join(
					user,
					office,
					() => done()
				);
			});
		});

		after( 'delete org unit', function( done ) {
			let OrgUnit = require( '../models/org_units' );
			let User    = require( '../models/users' );
			let Office  = require( '../models/offices' );

			let domain = new OrgUnit({ id: 10 }).destroy();
			let user   = new User({ id: 9, orgUnit: null }).save();
			let office = new Office({ id: 11 }).destroy();

			Promise.join(
				domain,
				user,
				office,
				() => done()
			);
		});
	});

	describe( 'GET search', function() {

		it( 'fails if no token is provided', function( done ) {
			request
			.get( '/orgunits/search' )
			.query({ name: 'children' })
			.expect( 403, done );
		});

		// Instead of manually writing these, we're just making a big array.
		let tests = [
			{ query: {}, error: 400, text: 'no params provided' },
			{ query: { name: 'NE', type: 'test' }, error: 400, text: 'invalid org type provided' },
			{ query: { code: 'XX', venue: 'CL' }, error: 400, text: 'code is used with a venue' },
			{ query: { code: 'XX', type: 'venue' }, error: 400, text: 'code is used with venue type' },
			{ query: { venue: 'CL', type: 'region' }, error: 400, text: 'venue used with wrong org type' },
			{ query: { name: 'unused' }, empty: true },
			{ query: { name: 'children' } },
			{ query: { code: 'XX' }, empty: true },
			{ query: { code: 'NY' } },
			{ query: { code: 'NY', name: 'unused' }, empty: true },
			{ query: { code: 'NY', name: 'children' } },
			{ query: { code: 'NE', type: 'domain' }, empty: true },
			{ query: { code: 'NE', type: 'region' } },
			{ query: { name: 'Apple', venue: 'AC' }, empty: true },
			{ query: { name: 'Apple', venue: 'CL' } }
		];

		tests.forEach( test => {
			let title = '';
			if ( test.text ) {
				title = test.text;
			} else {
				let s1 = test.empty ? 'empty array with unused' : 'list of org units for used';
				let s2 = Object.keys( test.query ).join( ' and ' );
				title = `${ s1 } ${ s2 }`;
			}

			if ( test.error ) {
				title = 'fails if ' + title;
			} else {
				title = 'returns ' + title;
			}

			it( title, function( done ) {
				let req = request
				.get( '/orgunits/search' )
				.query({ token: 'user' })
				.query( test.query );

				if ( test.error ) {
					req.expect( test.error, done );
				} else {
					req.expect( 200 )
					.end( ( err, res ) => {
						if ( err ) {
							return done( err );
						}
						res.body.should.be.an.Array();
						if ( test.empty ) {
							res.body.should.be.empty();
						} else {
							res.body.should.be.not.empty();
							res.body.forEach( helpers.models.orgUnit );
						}
						done();
					});
				}
			});
		});
	});
};
