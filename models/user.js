'use strict';

/**
 * User model.
 *
 * Stores information about an individual member, with an eye for
 * abstracting this infromation out in the future.
 */
var bookshelf = require( '../common/db' ).Bookshelf;

module.exports = bookshelf.model( 'User', {
	tableName: 'users',
	orgUnit:   function() {
		return this.belongsTo( 'OrgUnit' );
	}
});
