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
		'user',
		'email',
		'roles'
	],

	parse: function( attrs ) {
		if ( undefined !== attrs.roles ) {
			attrs.roles = JSON.parse( attrs.roles );
		}
		return attrs;
	},

	format: function( attrs ) {
		if ( undefined !== attrs.roles ) {
			attrs.roles = JSON.stringify( attrs.roles );
		}
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
}, {
	/**
	 * Makes a new office for a unit.
	 * @param {OrgUnit} unit The parent org unit.
	 * @param {String} type The type of office.
	 * @param {Function} trans Optional. Transaction callback.
	 * @return {Promise}
	 */
	makeOfficeForUnit: function( unit, type, trans ) {
		let config = require( '../config/templates.json' );

		if ( ! unit.has( 'type' ) ) {
			throw new Error( 'Unit type not set' );
		}

		if ( ! config.rootOffices[ type ] ) {
			throw new Error( 'Unknown type "' + type + '"' );
		}

		var data;
		try {
			data = config[ unit.get( 'type' ) ][ type ];
		} catch ( err ) {
			throw new Error( 'Office config not found' );
		}

		let parentPath = config.rootOffices[ type ];
		if ( 1 !== unit.parents().pop() ) {
			parentPath += '.%';
		}

		return new Office()
		.where( 'parentOrgID', unit.parents().pop() )
		.where( 'parentPath', 'LIKE', parentPath )
		.fetch({ require: true, transacting: trans })
		.catch( err => {
			throw new Error( 'Parent not found' );
		})
		.then( parent => {
			return new Office({
				name: data.name,
				type: 'Primary',
				parentOrgID: unit.id,
				parentPath: parent.get( 'parentPath' ),
				roles: data.roles
			})
			.insertWithPath( trans );
		});
	}
}) );

module.exports = Office;
