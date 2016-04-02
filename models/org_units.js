'use strict';

/**
 * Organizational Unit model.
 *
 * Stores information about an org unit.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;

const OrgUnit = bookshelf.model( 'OrgUnit', {
	tableName: 'org_units',
	users: function() {
		return this.hasMany( 'User', 'orgUnit' );
	},

	/**
	 * Gets the parents of model.
	 * @param  {boolean} shallow Optional. True means just one level.
	 * @return {Promise}
	 */
	getParents: function( shallow ) {
		let query = new OrgUnit()
		.query( 'whereRaw', '? BETWEEN `lft` AND `rgt`', [ this.get( 'lft' ) - 1 ] );

		if ( shallow && 0 !== this.get( 'depth' ) ) {
			query.where( 'depth', '=', this.get( 'depth' ) - 1 );
		}

		return query.fetchAll();
	},

	/**
	 * Gets the children of model.
	 * @param  {boolean} shallow Optional. True means just one level.
	 * @return {Promise}
	 */
	getChildren: function( shallow ) {
		let query = new OrgUnit()
		.query( 'whereBetween', 'lft', [ this.get( 'lft' ) + 1, this.get( 'rgt' ) - 1 ] );

		if ( shallow ) {
			query.where( 'depth', '=', this.get( 'depth' ) + 1 );
		}

		return query.fetchAll();
	}
}, {
	/**
	 * Gets the boundaries of a new child.
	 * @param  {OrgUnit} parent The parent.
	 * @return {Promise}        JSON with new params.
	 */
	getNewBounds: function( parent ) {
		return new OrgUnit()
		.query( 'whereBetween', 'lft', [ parent.get( 'lft' ) + 1, parent.get( 'rgt' ) - 1 ] )
		.query( 'orderBy', 'rgt', 'desc' )
		.fetch()
		.then( unit => {
			if ( ! unit ) {
				return {};
			}
			unit = unit.toJSON();
			return {
				lft: unit.rgt + 1,
				rgt: unit.rgt + 1 + ( unit.rgt - unit.lft ),
				depth: unit.depth
			};
		});
	}
});

module.exports = OrgUnit;
