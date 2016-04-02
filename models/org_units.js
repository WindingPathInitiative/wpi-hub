'use strict';

/**
 * Organizational Unit model.
 *
 * Stores information about an org unit.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const types     = [ 'Nation', 'Region', 'Domain', 'Venue' ];

function getDepth( node ) {
	return types.indexOf( node.get( 'type' ) );
}

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
		let query = new OrgUnit().whereParents( this );
		let depth = getDepth( this );

		if ( shallow && 0 !== depth ) {
			query.where( 'type', '=', types[ depth - 1 ] );
		}

		return query.fetchAll();
	},

	/**
	 * Gets the children of model.
	 * @param  {boolean} shallow Optional. True means just one level.
	 * @return {Promise}
	 */
	getChildren: function( shallow ) {
		let query = new OrgUnit().whereChildren( this );

		if ( shallow ) {
			query.where( 'type', '=', types[ getDepth( this ) + 1 ] );
		}

		return query.fetchAll();
	},

	/**
	 * Gets the entire org chain of a unit, highest to lowest.
	 * @return {Promise}
	 */
	getChain: function() {
		let query = new OrgUnit()
		.whereParents( this )
		.query( 'orWhereBetween', 'lft', [ this.get( 'lft' ) + 1, this.get( 'rgt' ) - 1 ] )
		.query( 'orderBy', 'lft', 'asc' )
		.fetchAll();

		return query;
	},


	/**
	 * Adds WHERE statement for parents.
	 * @param {OrgUnit} node
	 * @return {Promise}
	 */
	whereParents: function( node ) {
		return this
		.query( 'whereRaw', '? BETWEEN `lft` AND `rgt`', [ node.get( 'lft' ) - 1 ] )
		.query( 'whereRaw', '? BETWEEN `lft` AND `rgt`', [ node.get( 'rgt' ) + 1 ] );
	},

	/**
	 * Adds WHERE statement for children.
	 * @param {OrgUnit} node
	 * @return {Promise}
	 */
	whereChildren: function( node ) {
		return this.query( 'whereBetween', 'lft', [ node.get( 'lft' ) + 1, node.get( 'rgt' ) - 1 ] );
	}
}, {
	/**
	 * Gets the boundaries of a new child.
	 * @param  {OrgUnit} parent The parent.
	 * @return {Promise}        JSON with new params.
	 */
	getNewBounds: function( parent ) {
		return new OrgUnit()
		.whereChildren( parent )
		.query( 'orderBy', 'rgt', 'desc' )
		.fetch()
		.then( unit => {
			if ( ! unit ) {
				return {};
			}
			unit = unit.toJSON();
			return {
				lft: unit.rgt + 1,
				rgt: unit.rgt + 1 + ( unit.rgt - unit.lft )
			};
		});
	}
});

module.exports = OrgUnit;
