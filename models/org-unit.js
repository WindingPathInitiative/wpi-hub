'use strict';

/**
 * Organizational Unit model.
 *
 * Stores information about an org unit.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const Base      = require( './base' );
const _         = require( 'lodash' );

const types     = [ 'Nation', 'Region', 'Chapter', 'Venue' ];
const venues = require( '../config/venues.json' );

function getDepth( node ) {
	return types.indexOf( node.get( 'type' ) );
}

const OrgUnit = bookshelf.model( 'OrgUnit', Base.extend({
	tableName: 'org_units',
	publicAttrs: [
		'id',
		'name',
		'code',
		'type',
		'venueType',
		'location'
	],

	users: function() {
		return this.hasMany( 'User', 'orgUnit' );
	},

	offices: function() {
		return this.hasMany( 'Office', 'parentOrgID' );
	},

	serialize: function( options ) {
		let attrs = Base.prototype.serialize.apply( this, arguments );
		delete attrs.parentPath;
		if ( null === attrs.venueType ) {
			delete attrs.venueType;
		}
		// Escape newlines.
		if ( attrs.defDoc ) {
			attrs.defDoc = attrs.defDoc.replace( /\n/g, '\\n' );
		}
		return attrs;
	},

	/**
	 * Gets the parent IDs.
	 * @return {array}
	 */
	parents: function() {
		let parents = this.get( 'parentPath' ).split( '.' ).map( p => parseInt( p ) );
		parents.pop();
		return parents;
	},

	/**
	 * Gets the parents of model.
	 * @return {Promise}
	 */
	getParents: function() {
		return new OrgUnit()
		.where( 'id', 'in', this.parents() )
		.fetchAll();
	},

	/**
	 * Gets the children of model.
	 * @return {Promise}
	 */
	getChildren: function() {
		return new OrgUnit()
		.where( 'parentPath', 'LIKE', this.get( 'parentPath' ) + '.%' )
		.fetchAll();
	},

	/**
	 * Gets the entire org chain of a unit, highest to lowest.
	 * @return {Promise}
	 */
	getChain: function() {
		return new OrgUnit()
		.where( 'id', 'in', this.parents() )
		.query( 'orWhere', 'parentPath', 'LIKE', this.get( 'parentPath' ) + '.%' )
		.query( 'orderBy', 'parentPath', 'asc' )
		.fetchAll();
	},

	/**
	 * Checks if current unit is child of provided one.
	 * @param  {mixed} node Either an ID or an OrgUnit object.
	 * @return {Promise}
	 */
	isChild: function( node ) {
		if ( ! Number.isInteger( node ) ) {
			node = node.id;
		}

		return -1 !== this.parents().indexOf( node );
	},

	/**
	 * Checks if provided unit is below current one.
	 * @param  {mixed} node Either an ID or an OrgUnit object.
	 * @return {Promise}
	 */
	hasChild: function( node ) {
		if ( Number.isInteger( node ) ) {
			node = new OrgUnit({ id: node }).fetch();
		} else if ( node instanceof OrgUnit ) {
			let resolve = require( 'bluebird' ).resolve;
			node = resolve( node );
		} else {
			throw new Error( 'Invalid data type provided' );
		}

		return node.then( node => {
			return node.isChild( this.id );
		});
	}
}, {
	/**
	 * Returns array of unit types.
	 * @return {array}
	 */
	getTypes: function() {
		return types;
	},
	getVenues: function(){
		return venues;
	}
}) );

module.exports = OrgUnit;
