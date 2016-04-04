'use strict';

const Offices = require( '../models/offices' );
const Users   = require( '../models/users' );
const OrgUnit = require( '../models/org_units' );
const _       = require( 'lodash' );

exports.has = ( permission, officer ) => {};

exports.hasOverUser = ( user, permission, officer ) => {
	return normalizeOfficer( officer )
	.then( offices => {
		return offices.filter( office => {
			return office.has( 'roles' ) && -1 !== office.get( 'roles' ).indexOf( permission );
		});
	})
	.then( offices => {

		// No offices found.
		if ( ! offices ) {
			return false;
		}

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

			// Checks if current org has the parents org.
			return user.related( 'orgUnit' )
			.getParents()
			.then( parents => {
				parents = parents.toArray();
				for ( let p = 0; p < parents.length; p++ ) {
					for ( let o = 0; o < offices.length; o++ ) {
						if ( parents[ p ].id === offices[ o ].get( 'parentOrgID' ) ) {
							return true;
						}
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
};

exports.hasOverUnit = ( unit, permission, officer ) => {};

function normalizeOfficer( officer ) {
	if ( ! Number.isInteger( officer ) ) {
		officer = officer.id;
	}
	return new Offices().where( 'userID', officer ).fetchAll({ require: true });
}

function normalizeRole( role ) {

}
