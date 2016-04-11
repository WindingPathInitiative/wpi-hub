'use strict';

const Offices = require( '../models/offices' );
const Users   = require( '../models/users' );
const OrgUnit = require( '../models/org_units' );
const _       = require( 'lodash' );


/**
 * Checks if officer has permission.
 * @param  {string} permission Role to check.
 * @param  {mixed}  officer     User object or ID.
 * @return {Promise}
 */
function has( permission, officer ) {
	return normalizeOfficer( officer )
	.catch( err => {
		throw new UserError( 'User has no offices', err );
	})
	.then( offices => {
		// Filter out offices we have the desired permission.
		return offices.filter( office => {
			return office.has( 'roles' ) && -1 !== office.get( 'roles' ).indexOf( permission );
		});
	})
	.then( offices => {
		if ( ! offices ) {
			throw new Error( 'No offices with permission' );
		}
		return offices;
	});
}


/**
 * Checks if officer has permission over user.
 * @param  {Model}  user       User model.
 * @param  {string} permission Role to check.
 * @param  {mixed}  officer    User object or ID.
 * @return {Promise}
 */
function hasOverUser( user, permission, officer ) {
	return has( permission, officer )
	.then( offices => {

		// If the user isn't attached to a domain,
		// the officer needs to be National.
		// This operates under the assumption National is 1.
		if ( ! user.has( 'orgUnit' ) ) {
			let isNational = _.reduce( offices, ( memo, office ) => {
				return memo || 1 === office.get( 'parentOrgID' );
			}, false );
			if ( ! isNational ) {
				throw new Error( 'Not national officer' );
			}
		} else {

			let officeOrgs = mapCollection( offices, 'parentOrgID' );

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
				return false;
			});
		}
	})
	.then( result => {
		if ( result ) {
			return user;
		}
		throw new Error( 'Authorization failed' );
	});
}


function hasOverUnit( unit, permission, officer ) {

}

function normalizeOfficer( officer ) {
	if ( ! Number.isInteger( officer ) ) {
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
	hasOverUser: hasOverUser
};
