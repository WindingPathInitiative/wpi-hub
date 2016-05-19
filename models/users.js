'use strict';

/**
 * User model.
 *
 * Stores information about an individual member, with an eye for
 * abstracting this infromation out in the future.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const _         = require( 'lodash' );
const Base      = require( './base' );

module.exports = bookshelf.model( 'User', Base.extend({
	tableName: 'users',

	publicAttrs: [
		'membershipNumber',
		'firstName',
		'lastName',
		'nickname',
		'fullName',
		'membershipType',
		'membershipExpiration'
	],

	initialize: function( attrs, options ) {
		this.on( 'saving', this.saving );
	},

	parse: function( attrs ) {
		attrs.fullName = attrs.firstName + ' ' + attrs.lastName;
		return attrs;
	},

	saving: function( model, attrs, options ) {
		if ( ! model.has( 'email' ) ) {
			model.set( 'email', model.get( 'emailAddress' ) );
		}
		if ( ! model.has( 'portalID' ) && model.has( 'remoteId' ) ) {
			model.set( 'portalID', model.get( 'remoteId' ) );
		}
		model.unset([ 'emailAddress', 'remoteId', 'affiliateId', 'affiliateName', 'fullName' ]);
	},

	serialize: function( options ) {
		let attrs = Base.prototype.serialize.apply( this, arguments );
		if ( ! this.showPrivate ) {
			attrs = _.omit( attrs, [ 'email', 'address' ] );
		}
		return attrs;
	},

	orgUnit: function() {
		return this.belongsTo( 'OrgUnit', 'orgUnit' );
	},

	offices: function() {
		return this.hasMany( 'Office', 'userID' );
	},

	makeToken: function() {
		let Token = bookshelf.model( 'Token' );
		return new Token({ user: this.id }).save();
	}
}, {
	getByPortalId: function( id ) {
		if ( ! id ) {
			throw new Error( 'No Portal ID provided' );
		}
		return new this({ portalID: id }).fetch();
	}
}) );
