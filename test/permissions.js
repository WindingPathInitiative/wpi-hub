'use strict';

/**
 * Test for Permissions helper
 * @see helpers/permissions.js
 */

const should      = require( 'should' );
const permissions = require( '../helpers/permissions' );
const User        = require( '../models/users' );
const OrgUnit     = require( '../models/org_units' );
const Promise     = require( 'bluebird' );
const UserError   = require( '../helpers/errors' );

const officesTest = offices => {
	offices.should.be.an.Array();
	offices.length.should.be.above( 0 );
	offices.forEach( o => {
		o.should.be.an.Object();
		o.should.have.property( 'id' );
		should( o.attributes ).have.properties([
			'id',
			'name',
			'email',
			'type',
			'userID',
			'roles'
		]);
		o.get( 'roles' ).should.be.an.Array();
	});
};

const errorTest = err => {
	err.should.be.an.Error();
	err.should.have.property( 'message' );
};

const perm = 'user_read_private'; // Generic permission to test.

module.exports = function() {
	var admin, nc, rc, dc;

	before( 'prefetch users', function( done ) {
		Promise.all([
			permissions.prefetch( 1 ),
			permissions.prefetch( 2 ),
			permissions.prefetch( 3 ),
			permissions.prefetch( 8 )
		])
		.then( res => {
			admin = res[0];
			nc    = res[1];
			rc    = res[2];
			dc    = res[3];
			done();
		});
	});

	describe( 'prefetch', function() {
		it( 'throws for a user without offices', function( done ) {
			permissions.prefetch( 5 ) // Plain user.
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'returns array of offices for a given user', function( done ) {
			permissions.prefetch( 1 )
			.then( offices => {
				offices.should.be.an.Object();
				offices.length.should.be.above( 0 );
				offices.models.forEach( o => {
					o.should.be.an.Object();
					o.should.have.property( 'id' );
					should( o.attributes ).have.properties([
						'id',
						'name',
						'email',
						'type',
						'userID',
						'roles'
					]);
					o.get( 'userID' ).should.equal( 1 );
					o.get( 'roles' ).should.be.an.Array();
				});
				done();
			});
		});
	});

	describe( 'has', function() {
		it( 'throws an error if a user has no offices', function( done ) {
			permissions.has( 'org_update', 5 )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'throws an error if the user has none of the roles', function( done ) {
			permissions.has( 'barnacles', nc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'returns an array of offices that match', function( done ) {
			permissions.has( 'org_update', nc )
			.then( offices => {
				officesTest( offices );
				done();
			});
		});

		it( 'always works if a user has the admin role', function( done ) {
			permissions.has( 'barnacles', admin )
			.then( offices => {
				officesTest( offices );
				done();
			});
		});
	});

	describe( 'hasOverUser', function() {
		it( 'throws if the user does not exist', function( done ) {
			permissions.hasOverUser( 99, perm, nc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'throws if user has no unit and officer is not national', function( done ) {
			permissions.hasOverUser( 9, perm, dc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'works if the user has no unit and office is national', function( done ) {
			permissions.hasOverUser( 9, perm, nc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'works if the officer and user are part of same unit', function( done ) {
			permissions.hasOverUser( 5, perm, dc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'works if the officer unit is a parent of the user unit', function( done ) {
			permissions.hasOverUser( 5, perm, rc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'throws if officer unit is not parent of user unit', function( done ) {
			permissions.hasOverUser( 2, perm, rc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});
	});

	describe( 'hasOverUnit', function() {
		it( 'throws if the unit does not exist', function( done ) {
			permissions.hasOverUnit( 99, perm, nc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'works if the office is national', function( done ) {
			permissions.hasOverUnit( {}, perm, nc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'works if the office is the same as the unit', function( done ) {
			permissions.hasOverUnit( 3, perm, dc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'works if the office unit is a parent of the unit', function( done ) {
			permissions.hasOverUnit( 3, perm, rc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'throws if office unit is not parent of the unit', function( done ) {
			permissions.hasOverUnit( 6, perm, rc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});
	});

	describe( 'hasOverOffice', function() {
		it( 'throws if the office does not exist', function( done ) {
			permissions.hasOverOffice( 99, perm, nc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'works if the office is itself', function( done ) {
			permissions.hasOverOffice( 1, perm, nc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'works if the office is a parent of the target office', function( done ) {
			permissions.hasOverOffice( 7, perm, rc )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'works if the office is an assistant to a parent of the target', function( done ) {
			permissions.hasOverOffice( 7, perm, 10 )
			.then( res => {
				res.should.be.ok();
				done();
			});
		});

		it( 'throws if office is an assistant not parent of target office', function( done ) {
			permissions.hasOverOffice( 5, perm, 10 )
			.catch( err => {
				errorTest( err );
				done();
			});
		});

		it( 'throws if office is not a parent of the target office', function( done ) {
			permissions.hasOverOffice( 5, perm, nc )
			.catch( err => {
				errorTest( err );
				done();
			});
		});
	});
};
