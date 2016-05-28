'use strict';

/**
 * Org unit data routes.
 */
const router    = require( 'express' ).Router();
const OrgUnit   = require( '../models/org_units' );
const token     = require( '../middlewares/token' );
const network   = require( '../middlewares/network' );
const _         = require( 'lodash' );
const UserError = require( '../helpers/errors' );


/**
 * Gets node information for user.
 */
router.get( /^\/([a-zA-Z]{2}[\-\d]*)\/?$/,
	token.validate(),
	( req, res, next ) => {
		let query = new OrgUnit({ code: req.params[0].toUpperCase() })
		.fetch({
			require: true,
			withRelated: [
				'users',
				{
					offices: query => {
						query
						.select([ 'offices.*', 'users.firstName', 'users.lastName', 'users.membershipNumber' ])
						.leftJoin( 'users', 'offices.userID', 'users.id' );
					}
				}
			]
		})
		// Hides org unit, because why?
		.tap( unit => {
			let users = unit.related( 'users' );
			users.each( user => {
				user.unset( 'orgUnit' );
			});
		})
		// Sets user key for offices.
		.tap( unit => {
			let offices = unit.related( 'offices' );
			offices.each( office => {
				let user = {};
				_.each([ 'membershipNumber', 'firstName', 'lastName', 'userID' ], field => {
					if ( office.has( field ) ) {
						user[ field ] = office.get( field );
					}
					office.unset( field );
				});
				if ( _.isEmpty( user ) ) {
					user = null;
				}
				office
				.set( 'user', user )
				.unset( 'parentOrgID' );
			});
		});

		getChain( query )
		.then( unit => {
			res.json( unit );
		})
		.catch( err => {
			next( new UserError( 'Org unit not found', 404, err ) );
		});
	}
);


/**
 * Creates a new org unit
 */
router.post( '/',
	token.validate(),
	( req, res, next ) => {
		let data  = req.body;

		if ( _.isEmpty( data ) ) {
			return next( new UserError( 'No data provided', 400 ) );
		}

		if ( ! data.parentID ) {
			return next( new UserError( 'No parent provided', 400 ) );
		}

		let types = OrgUnit.getTypes();

		if ( -1 === types.indexOf( data.type ) || 'Nation' === data.type ) {
			return next( new UserError( 'Invalid org unit type', 400 ) );
		}

		new OrgUnit({ id: data.parentID })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Parent not found', 400 );
		})
		.tap( parent => {
			const perm = require( '../helpers/permissions' );
			let role = 'org_create_' + data.type.toLowerCase();
			return perm.hasOverUnit( parent, role, req.token.get( 'user' ) );
		})
		.then( parent => {
			// Make sure the new org unit is the correct type.
			if ( types.indexOf( data.type ) - 1 !== types.indexOf( parent.get( 'type' ) ) ) {
				throw new UserError( 'Org type doesn\'t match expected type', 400 );
			}

			return OrgUnit.getNewBounds( parent );
		})
		.then( bounds => {
			const validate = require( '../helpers/validation' );
			data = Object.assign( data, bounds );
			let constraints = {
				id: { numericality: { onlyInteger: true, strict: true } },
				name: { length: { minimum: 1 }, presence: true },
				code: { length: { minimum: 1 }, presence: true },
				venueType: { length: { minimum: 1 } },
				location: { isString: true },
				defDoc: { isString: true },
				website: { url: true },
				type: { inclusion: [ 'Venue', 'Domain', 'Region' ], presence: true },
				lft: { numericality: { onlyInteger: true }, presence: true },
				rgt: { numericality: { onlyInteger: true }, presence: true }
			};
			if ( 'Venue' === data.type ) {
				contraints.venueType.presence = true;
			}
			return validate.async( data, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			})
			.then( attributes => {
				return new OrgUnit().save( attributes, { method: 'insert' } );
			})
			.catch( err => {
				throw new UserError( 'There was an error creating the org unit', 500, err );
			});
		})
		.then( unit => {
			unit.show();
			res.json( unit );
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 403, err ) );
			}
		});
	}
);


/**
 * Updates org unit
 */
router.put( '/:id',
	token.validate(),
	( req, res, next ) => {
		if ( _.isEmpty( req.body ) ) {
			return next( new UserError( 'No data provided', 400 ) );
		}

		let query = new OrgUnit();
		let id    = req.params.id;
		if ( NaN !== Number.parseInt( id ) ) {
			query.where( 'id', Number.parseInt( id ) );
		} else {
			query.where( 'code', id );
		}

		query.fetch({
			require: true
		})
		.catch( err => {
			throw new UserError( 'Org unit not found', 404, err );
		})
		.tap( unit => {
			const perm = require( '../helpers/permissions' );
			return perm.hasOverUnit( unit, 'org_update', req.token.get( 'user' ) );
		})
		.then( unit => {
			const validate = require( '../helpers/validation' );
			let constraints = {
				name: { length: { minimum: 1 } },
				code: { length: { minimum: 1 } },
				venueType: { isString: true },
				location: { isString: true },
				defDoc: { isString: true },
				website: { url: true },
				type: { inclusion: [ 'Venue', 'Domain', 'Region' ] }
			};
			return validate.async( req.body, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			})
			.then( attributes => {
				return unit.save( attributes );
			});
		})
		.then( unit => {
			unit.show();
			res.json( unit.toJSON() );
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 403, err ) );
			}
		});
	}
);


/**
 * Gets node information based off of ID.
 */
router.get( '/internal/:id',
	network.internal,
	( req, res, next ) => {
		let id = parseInt( req.params.id );
		if ( NaN === id ) {
			return next( new Error( 'Invalid org id' ) );
		}
		let query = new OrgUnit({ id: id })
		.fetch({ require: true });

		getChain( query )
		.then( unit => {
			res.json( unit );
		})
		.catch( err => {
			next( new UserError( 'Org unit not found', 404, err ) );
		});
	}
);


/**
 * Gets and returns JSON response.
 * @param  {object} unit The unit model.
 * @return {Promise}
 */
function getChain( unit ) {
	return unit.then( unit => {
		return [ unit, unit.getChain() ];
	})
	.spread( ( unit, chain ) => {
		unit.show();
		let resp = {
			unit: unit.toJSON(),
			children: [],
			parents: []
		};

		// Splits chain into children and parents.
		if ( chain ) {
			let left  = unit.get( 'lft' );
			let units = _.map( chain.toArray(), u => {
				let json = u.toJSON();
				json.lft = u.get( 'lft' );
				json.rgt = u.get( 'rgt' );
				return json;
			});
			let split = _.partition( units, r => r.lft < left );
			if ( 2 === split.length ) {
				let map = m => _.omit( m, [ 'lft', 'rgt' ] );
				resp.parents = _.map( split[0], map );
				resp.children = _.map( split[1], map );
			}
		}

		// Sorts children.
		if ( resp.children.length > 1 ) {
			resp.children = sortChain( resp.children );
		}
		return resp;
	});
}


/**
 * Makes chain heirarchical.
 * @param  {array} units Array of org units.
 * @return {array}
 */
function sortChain( units ) {
	let types = OrgUnit.getTypes();
	let depth = index => types.indexOf( units[ index ].type );
	_.each( units, unit => {
		unit.children = [];
	});
	for ( let i = units.length - 1; i > 0; i-- ) {
		let d1 = depth( i );
		for ( let u = i - 1; u >= 0; u-- ) {
			if ( depth( i ) > depth( u ) ) {
				units[ u ].children.push( units[ i ] );
				units[ i ] = false;
				break;
			}
		}
	}
	return _.compact( units );
}


module.exports = router;
