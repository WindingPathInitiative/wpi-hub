'use strict';

/**
 * User data routes.
 */

const router        = require( 'express' ).Router();
const token         = require( '../middlewares/token' );
const User          = require( '../models/user' );
const _             = require( 'lodash' );
const UserError     = require( '../helpers/errors' );
const Promise       = require( 'bluebird' );
const Moment        = require( 'moment' );
const normalizeBool = require( '../helpers/validation' ).normalizeBool;


/**
 * Gets a list of users, optionally with filtering.
 */
router.get( '/',
	token.validate(),
	( req, res, next ) => {
		let params = _.omit( req.query, 'token' );
		let query = new User();

		if ( params.name ) {
			let like = '%' + params.name + '%';
			query.where( q => {
				q.where( 'firstName', 'LIKE', like )
				.orWhere( 'lastName', 'LIKE', like )
				.orWhere( 'nickname', 'LIKE', like );
			});
		} else if ( params.email ) {
			query.where( 'email', params.email );
		} else if ( params.mes ) {
			query.where( 'membershipNumber', params.mes );
		}

		if ( undefined !== params.expired ) {
			let type = normalizeBool( params.expired ) ? '<' : '>=';
			query.where( 'membershipExpiration', type, Moment.utc().format( 'YYYY-MM-DD' ) );
		}

		if ( ! isNaN( Number.parseInt( params.limit ) ) ) {
			query.query( 'limit', Number.parseInt( params.limit ) );
		} else {
			query.query( 'limit', 100 );
		}
		if ( ! isNaN( Number.parseInt( params.offset ) ) ) {
			query.query( 'offset', Number.parseInt( params.offset ) );
		}

		new Promise( res => res( query ) )
		.tap( query => {
			// Gets a list of IDs of desired org unit.
			if ( parseInt( params.orgUnit ) ) {
				let id = parseInt( params.orgUnit );
				const OrgUnit = require( '../models/org-unit' );

				return new OrgUnit({ id: id })
				.fetch({ require: true })
				.catch( err => {
					throw new UserError( 'Org unit not found', 404, err );
				})
				.then( unit => {
					return unit.getChildren();
				})
				.then( units => {
					let ids = units.map( u => u.id ).concat( id );
					query.query( 'whereIn', 'orgUnit', ids );
				});
			}
		})
		.then( query => {
			query
			.fetchAll()
			.then( users => {
				res.json( users.toJSON() );
			});
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'List failed', 500, err ) );
			}
		});
	}
);


/**
 * Gets user data, optionally with private info.
 */
router.get( '/:id',
	token.validate(),
	parseID,
	// Checks membership expiration for private query.
	( req, res, next ) => {
		let showPrivate = normalizeBool( req.query.private );
		if ( showPrivate ) {
			new User({ id: req.token.get( 'user' ) })
			.fetch({ require: true })
			.catch( err => next( new UserError( 'User not found', err, 500 ) ) )
			.then( user => {
				req.user = user;
				token.expired( req, res, next );
			});
		} else {
			next();
		}
	},
	( req, res, next ) => {

		let showPrivate = normalizeBool( req.query.private );

		new User( req.id )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		})
		.tap( user => {
			if ( req.token.get( 'user' ) === user.id ) {
				showPrivate = true;
			} else if ( showPrivate ) {
				const perm = require( '../helpers/permissions' );
				return perm
				.hasOverUser( user, 'user_read_private', req.token.get( 'user' ) )
				.catch( err => {
					// If the check fails, just don't show private data.
					showPrivate = false;
				});
			}
		})
		.then( user => {
			user.show();
			user.showPrivate = showPrivate;
			res.json( user.toJSON() );
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
 * Updates a user.
 */
router.put( '/:id',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {
		if ( _.isEmpty( req.body ) ) {
			next( new UserError( 'No data provided', 400 ) );
			return;
		}

		new User( req.id )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		})
		.tap( user => {
			if ( req.token.get( 'user' ) === user.id ) {
				return;
			} else {
				const perm = require( '../helpers/permissions' );
				return perm.hasOverUser( user, 'user_update', req.token.get( 'user' ) );
			}
		})
		.then( user => {
			const validate = require( '../helpers/validation' );
			let constraints = {
				portalID: { numericality: { onlyInteger: true } },
				firstName: { length: { minimum: 1 } },
				lastName: { length: { minimum: 1 } },
				nickname: { isString: true },
				address: { isString: true },
				email: { email: true },
				membershipType: { inclusion: [ 'None', 'Trial', 'Full', 'Expelled' ] },
				membershipExpiration: { date: true, format: /\d{4}-\d{2}-\d{2}/ }
			};
			return validate.async( req.body, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			})
			.then( attributes => {
				return user.save( attributes );
			});
		})
		.then( user => {
			user.show();
			user.showPrivate = true;
			res.json( user.toJSON() );
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
 * Updates user domain assignment.
 */
router.put( '/:id/assign/:domain(\\d+)',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {
		const OrgUnit = require( '../models/org-unit' );

		// Get the user.
		let userQuery = new User( req.id )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		});

		// Get the target org unit.
		let orgQuery = new OrgUnit({ id: req.params.domain })
		.fetch({
			require: true
		})
		.catch( err => {
			throw new UserError( 'Domain not found', 404, err );
		})
		.then( unit => {
			if ( 'Domain' !== unit.get( 'type' ) ) {
				throw new UserError( 'Assigning to non-domain' );
			}
			return unit;
		});

		Promise.join( userQuery, orgQuery, ( user, org ) => {

			// Wasting everyone's time here.
			if ( user.get( 'orgUnit' ) === org.id ) {
				throw new UserError( 'User already member of domain' );
			}

			user.targetDomain = org;
			return user;
		})
		.tap( user => {
			let curOrg = user.related( 'orgUnit' );

			// If the user is trying to move themselves.
			if ( req.token.get( 'user' ) === user.id ) {

				// If the user is assigned to National or nothing, go right ahead.
				if ( ! user.has( 'orgUnit' ) || 1 === curOrg.id ) {
					return;
				}

				// If the current org unit is a domain,
				// the user can't do this!
				if ( 'Domain' === curOrg.get( 'type' ) ) {
					throw new UserError( 'Cannot leave domain', 403 );
				}

				// Otherwise, check if the domain is under the current org unit.
				return user.targetDomain
				.isChild( curOrg )
				.then( result => {
					if ( ! result ) {
						throw new UserError( 'Domain not under current region', 403 );
					}
				});
			}
			// Otherwise, check permissions.
			else {
				const perm = require( '../helpers/permissions' );
				return perm.prefetch( req.token.get( 'user' ) )
				.then( offices => {
					return Promise.any([
						perm.hasOverUser( user, 'user_assign', offices ),
						perm.hasOverUnit( user.targetDomain, 'user_assign', offices )
					]);
				});
			}
		})
		.then( user => {
			// Validation passed, move the user now.
			user
			.save({ orgUnit: user.targetDomain.id }, { patch: true })
			.then( user => {
				res.json({ success: true });
			});
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
 * Parses an ID into the correct query.
 */
function parseID( req, res, next ) {
	let id = req.params.id;

	if ( ! id ) {
		next( new UserError( 'No ID provided', 400 ) );
	} else if ( -1 !== id.search( /^[a-z]{2}\d{10}$/i ) ) {
		req.id = { membershipNumber: id.toUpperCase() };
		next();
	} else if ( Number.parseInt( id ) ) {
		req.id = { id: Number.parseInt( id ) };
		next();
	} else if ( 'me' === id ) {
		req.id = { id: req.token.get( 'user' ) };
		next();
	} else {
		next( new UserError( 'Invalid ID provided', 400 ) );
	}
}


module.exports = router;
