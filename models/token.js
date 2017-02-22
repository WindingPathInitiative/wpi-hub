'use strict';

/**
 * Token model.
 *
 * Stores temporary references to users,
 * to allow systems to log in on their behalf.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const uuid      = require( 'uuid/v4' );

/**
 * Gets time in an hour.
 * @return {Integer}
 */
function getExpire() {
	return new Date( Date.now() + 3600000 );
}

const tableName = 'tokens';

module.exports = bookshelf.model( 'Token', {
	tableName: tableName,
	idAttribute: 'token',

	initialize: function() {
		this.on( 'saving', this.saving );
	},

	saving: function( model, attrs, options ) {
		if ( ! model.has( 'token' ) ) {
			model.set( 'token', uuid() );
		}
		model.set( 'expires', getExpire() ); // Plus one hour.
	},

	user: function() {
		return this.belongsTo( 'User', 'user' );
	},

	refresh: function() {
		return this.save({ expires: getExpire() }, { patch: true })
		.catch( () => {}); // Silently fail if we don't update.
	},

	notExpired: function() {
		return this.query( 'whereRaw', '`expires` > CURRENT_TIMESTAMP' );
	},

	expired: function() {
		return this.query( 'whereRaw', '`expires` < CURRENT_TIMESTAMP' );
	}
}, {
	refresh: function( token ) {
		new this({ token: token })
			.fetch()
			.then( token => {
				if ( token ) {
					token.refresh();
				}
			});
	},
	exists: function( token ) {
		return this.count({ token: token });
	},
	removeExpired: function() {
		return bookshelf.knex( tableName )
			.whereRaw( '`expires` < CURRENT_TIMESTAMP' )
			.del();
	}
});
