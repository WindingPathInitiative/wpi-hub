'use strict';

const Offices   = require( '../models/office' );
const Users     = require( '../models/user' );
const OrgUnit   = require( '../models/org-unit' );
const UserError = require( '../helpers/errors' );
const _         = require( 'lodash' );
const Promise   = require( 'bluebird' );


let presetOffice;


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
				throw new UserError( 'User not found', 404, err );
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
				return unmapCollection( offices, 'parentOrgID', user.get( 'orgUnit' ) );
			}

			// Checks if current org has the parents org.
			let unit = user.related( 'orgUnit' );
			let validOrgs = _.intersection( unit.parents(), officeOrgs );
			if ( ! validOrgs.length ) {
				throw new Error( 'Officer not found in chain' );
			} else {
				return unmapCollection( offices, 'parentOrgID', validOrgs );
			}
		}
		// If the user isn't attached to a domain,
		// the officer needs to be National.
		// This operates under the assumption National is 1.
		else {
			if ( -1 !== officeOrgs.indexOf( 1 ) ) {
				return unmapCollection( offices, 'parentOrgID', 1 );
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
		let officesReturn = [];
		let officeResponses = [];
		// If one of these is National, we're good.
		if ( -1 !== officeOrgs.indexOf( 1 ) ) {
			officeResponses.push(unmapCollection( offices, 'parentOrgID', 1 ));
		}

		// Checks if unit is one of the office domains.
		if ( -1 !== officeOrgs.indexOf( unit.id ) ) {
			officeResponses.push(unmapCollection( offices, 'parentOrgID', unit.id ));
		}

		// Checks if current org has the parents org.
		let valid = _.intersection( unit.parents(), officeOrgs );
		if ( ! valid.length ) {
			if(officeResponses.length == 0) throw new Error( 'Officer not found in chain' );
		} else {
			officeResponses.push(unmapCollection( offices, 'parentOrgID', valid ));
		}
		//it's not pretty, but it works
		for(let j = 0; j < officeResponses.length; j++){
			for(let k = 0; k < officeResponses[j].length; k++){
				if(-1 == officesReturn.indexOf(officeResponses[j][k])){
					officesReturn.push(officeResponses[j][k]);
				}
			}
		}
		return officesReturn;
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
			throw new UserError( 'Office not found', 404, err );
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
		.get( 'parentPath' )
		.split( '.' )
		.map( m => parseInt( m ) );

		let parentOfficeIDs = offices
		.filter( o => 'Assistant' === o.get( 'type' ) )
		.map( o => parseInt( o.get( 'parentOfficeID' ) ) );

		for ( let i = 0; i < parents.length; i++ ) {
			if ( -1 !== officeIds.indexOf( parents[ i ] ) ) {
				return unmapCollection( offices, 'id', parents[ i ] );
			} else if ( -1 !== parentOfficeIDs.indexOf( parents[ i ] ) ) {
				return unmapCollection( offices, 'parentOfficeID', parents[ i ] );
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
	let query = new Offices().where( 'userID', officer );
	if ( presetOffice ) {
		query.where( 'id', presetOffice );
	}
	return query.fetchAll({ require: true });
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


/**
 * Reverses a map to get the original data back.
 * @param {Collection} offices Original collection.
 * @param {String}     field   Field to key off of.
 * @param {Array}      valid   Array of valid fields.
 * @return {Collection}
 */
function unmapCollection( offices, field, valid ) {
	if ( ! _.isArray( valid ) ) {
		valid = [ valid ];
	}
	return offices.filter( o => -1 !== valid.indexOf( o.get( field ) ) );
}


/**
 * Express middleware to set office to use.
 * @param {Object}   req  Request object.
 * @param {Object}   res  Response object.
 * @param {Function} next Callback.
 */
function setPresetOffice( req, res, next ) {
	if ( req.query.useOffice ) {
		presetOffice = Number.parseInt( req.query.useOffice );
	} else {
		presetOffice = false;
	}
	next();
}


module.exports = {
	has,
	hasOverUnit,
	hasOverUser,
	hasOverOffice,
	prefetch: normalizeOfficer,
	presetOffice: setPresetOffice
};
