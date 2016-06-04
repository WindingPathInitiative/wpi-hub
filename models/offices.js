'use strict';

/**
 * Office model.
 *
 * Stores information about an office and it's permissions.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const Base      = require( './base' );

const Office = bookshelf.model( 'Office', Base.extend({
	tableName: 'offices',
	publicAttrs: [
		'id',
		'name',
		'type',
		'user'
	],

	parse: function( attrs ) {
		attrs.roles = JSON.parse( attrs.roles );
		return attrs;
	},

	parentOffice: function() {
		return this.belongsTo( 'Office', 'parentOfficeID' );
	},

	orgUnit: function() {
		return this.belongsTo( 'OrgUnit', 'parentOrgID' );
	},

	user: function() {
		return this.belongsTo( 'User', 'userID' );
	},

	getParents: function() {
		let parents = this.get( 'parentPath' ).split( '.' );
		return new Office()
		.where( 'id', 'in', parents )
		.fetchAll();
	},

	getChildren: function() {
		let prefix = this.get( 'parentPath' ) + '%';
		return new Office()
		.query( 'whereRaw', 'parentPath LIKE ?', prefix )
		.fetchAll();
	}
}) );

module.exports = Office;
