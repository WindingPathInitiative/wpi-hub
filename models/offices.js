'use strict';

/**
 * Office model.
 *
 * Stores information about an office and it's permissions.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const _         = require( 'lodash' );

const Office = bookshelf.model( 'Office', {
	tableName: 'offices',

	parse: function( attrs ) {
		attrs.roles = JSON.parse( attrs.roles );
		return attrs;
	},

	orgUnit: function() {
		return this.hasOne( 'OrgUnit', 'parentOrgID' );
	},

	user: function() {
		return this.hasOne( 'User', 'userID' );
	}
}, {});

module.exports = Office;
