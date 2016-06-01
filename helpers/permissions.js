'use strict';

const Offices   = require( '../models/offices' );
const Users     = require( '../models/users' );
const OrgUnit   = require( '../models/org_units' );
const UserError = require( '../helpers/errors' );
const _         = require( 'lodash' );
const Promise   = require( 'bluebird' );


/**
 * Checks if officer has permission.
 * @param  {mixed}  permissions Role to check.
 * @param  {mixed}  officer     User object or ID.
 * @return {Promise}
 */
function has( permissions, officer ) {

	if ( ! _.isArray( permissions ) ) {
		permissions = [ permissions ];
	}

	permissions.push( 'admin' ); // Admins always pass roles checks;

	return normalizeOfficer( officer )
	.catch( err => {
		throw new Error( 'User has no offices' );
	})
	.then( offices => {
		// Filter out offices we have the desired permission.
		return offices.filter( office => {
			return office.has( 'roles' ) &&
			_.intersection( office.get( 'roles' ), permissions ).length;
		});
	})
	.then( offices => {
		if ( ! offices.length ) {
			throw new Error( 'No offices with permission' );
		}
		return offices;
	});
}


/**
 * Checks if officer has permission over user.
 * @param  {Model}  user       User model.
 * @param  {mixed}  permission Role to check.
 * @param  {mixed}  officer    User object or ID.
 * @return {Promise}
 */
function hasOverUser( user, permission, officer ) {
	return has( permission, officer )
	.tap( () => {
		// Normalizes the user.
		if ( Number.isInteger( user ) ) {
			return new Users({ id: user })
			.fetch({ require: true, withRelated: 'orgUnit' })
			.catch( err => {
				throw new UserError( 'User not found.', 404, err );
			})
			.then( model => {
				user = model;
			});
		}
	})
	.tap( () => {
		// Loads the org unit data if not already loaded.
		if ( user.has( 'orgUnit' ) && _.isEmpty( user.relations ) ) {
			return user.load( 'orgUnit' );
		}
	})
	.then( offices => {

		let officeOrgs = mapCollection( offices, 'parentOrgID' );

		// If the user has an org unit.
		if ( user.has( 'orgUnit' ) ) {
			// Checks if user is attached to the office domain.
			if ( -1 !== officeOrgs.indexOf( user.get( 'orgUnit' ) ) ) {
				return true;
			}

			// Checks if current org has the parents org.
			return user.related( 'orgUnit' )
			.getParents()
			.then( parents => {
				parents = parents.toArray();
				for ( let p = 0; p < parents.length; p++ ) {
					if ( -1 !== officeOrgs.indexOf( parents[ p ].id ) ) {
						return true;
					}
				};
				throw new Error( 'Officer not found in chain' );
			});
		}
		// If the user isn't attached to a domain,
		// the officer needs to be National.
		// This operates under the assumption National is 1.
		else {
			if ( -1 !== officeOrgs.indexOf( 1 ) ) {
				return true;
			} else {
				throw new Error( 'Not national officer' );
			}
		}
	});
}


/**
 * Checks if officer has permission over unit.
 * @param  {mixed}  unit       Org Unit model or ID.
 * @param  {mixed}  permission Role to check.
 * @param  {mixed}  officer    User object or ID.
 * @return {Promise}
 */
function hasOverUnit( unit, permission, officer ) {
	return has( permission, officer )
	.tap( () => {

		// If no valid org unit is defined, default to National.
		if ( ! unit ) {
			unit = 1;
		}

		if ( Number.isInteger( unit ) ) {
			return new OrgUnit({ id: unit })
			.fetch({ require: true })
			.catch( err => {
				throw new UserError( 'Org unit not found.', 404, err );
			})
			.then( model => {
				unit = model;
			});
		}
	})
	.then( offices => {

		let officeOrgs = mapCollection( offices, 'parentOrgID' );

		// If one of these is National, we're good.
		if ( -1 !== officeOrgs.indexOf( 1 ) ) {
			return true;
		}

		// Checks if unit is one of the office domains.
		if ( -1 !== officeOrgs.indexOf( unit.id ) ) {
			return true;
		}

		// Checks if current org has the parents org.
		return unit
		.getParents()
		.then( parents => {
			parents = parents.toArray();
			for ( let p = 0; p < parents.length; p++ ) {
				if ( -1 !== officeOrgs.indexOf( parents[ p ].id ) ) {
					return true;
				}
			};
			throw new Error( 'Officer not found in chain' );
		});
	});
}


/**
 * Checks if officer has permission over an officer.
 * @param  {mixed}  office     Office model or ID.
 * @param  {mixed}  permission Role to check.
 * @param  {mixed}  officer    User object or ID.
 * @return {Promise}
 */
function hasOverOffice( office, permission, officer ) {
	let officeQuery;

	// If we have just an ID, let's fix that.
	if ( Number.isInteger( office ) ) {
		officeQuery = new Offices({ id: office })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Office not found.', 404, err );
		})
		.then( model => {
			office = model;
		});
	} else {
		officeQuery = Promise.resolve( office );
	}

	return officeQuery
	.then( () => has( permission, officer ) )
	.then( offices => {
		let officeIds = mapCollection( offices, 'id' );
		let parents   = office
		.get( 'parentOfficePath' )
		.split( '.' )
		.map( m => parseInt( m ) );

		for ( let i = 0; i < parents.length; i++ ) {
			if ( -1 !== officeIds.indexOf( parents[ i ] ) ) {
				return true;
			}
		}
		throw new Error( 'Officer not found in chain' );
	});
}


/**
 * Normalizes officer param and gets offices.
 * @param  {mixed} officer Officer or offices input.
 * @return {Promise}
 */
function normalizeOfficer( officer ) {
	// TODO: Come up with better test of Collection object.
	if ( 'function' === typeof officer.filter ) {
		return Promise.resolve( officer );
	} else if ( ! Number.isInteger( officer ) ) {
		officer = officer.id;
	}
	return new Offices().where( 'userID', officer ).fetchAll({ require: true });
}


/**
 * Maps a collection to array of field values.
 * @param  {Collection} coll  The collection.
 * @param  {string}     field The field.
 * @return {array}
 */
function mapCollection( coll, field ) {
	return coll.map( c => c.get( field ) );
}


module.exports = {
	has: has,
	hasOverUnit: hasOverUnit,
	hasOverUser: hasOverUser,
	hasOverOffice: hasOverOffice,
	prefetch: normalizeOfficer
};
