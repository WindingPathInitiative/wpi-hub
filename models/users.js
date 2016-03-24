'use strict';

/**
 * User model.
 *
 * Stores information about an individual member, with an eye for
 * abstracting this infromation out in the future.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const _         = require( 'lodash' );

module.exports = bookshelf.model( 'User', {
	tableName: 'users',

	initialize: function( attrs, options ) {
		this.on( 'saving', this.saving );
	},

	saving: function( model, attrs, options ) {
		if ( ! model.has( 'email' ) ) {
			model.set( 'email', model.get( 'emailAddress' ) );
		}
		if ( ! model.has( 'portalID' ) && model.has( 'remoteId' ) ) {
			model.set( 'portalID', model.get( 'remoteId' ) );
		}
		model
			.unset( 'emailAddress' )
			.unset( 'remoteId' )
			.unset( 'affiliateId' )
			.unset( 'affiliateName' );
	},

	orgUnit: function() {
		return this.belongsTo( 'OrgUnit', 'orgUnit' );
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
});
