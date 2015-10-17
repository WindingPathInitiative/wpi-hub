'use strict';

/**
 * Organizational Unit model.
 *
 * Stores information about an org unit.
 */
var bookshelf = require( '../common/db' ).Bookshelf;

module.exports = bookshelf.model( 'OrgUnit', {
	tableName: 'org_units',
	parentID:  function() {
		return this.belongsTo( 'OrgUnit' );
	}
});
