'use strict';

/**
 * Test for Auth Controller
 * @see controllers/auth.js
 */

const request = require( './helpers' ).request;
const should  = require( 'should' );

module.exports = function() {

	describe( 'GET code', function() {

		var token;
		before( 'create token', function( done ) {
			require( './helpers' ).makeToken( 1 )
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
				unit.should.have.property( 'offices' ).is.Array;

				res.body.should.have.property( 'children' ).is.Array;
				res.body.should.have.property( 'parents' ).is.Array;

				done();
			});
		});

		after( 'destroy token', function( done ) {
			require( './helpers' ).deleteToken( token )
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
				res.body.should.have.property( 'parents' ).is.Array;

				done();
			});
		});
	});
};
