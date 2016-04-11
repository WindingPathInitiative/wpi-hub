'use strict';

/**
 * User data routes.
 */

const router    = require( 'express' ).Router();
const token     = require( '../middlewares/token' );
const Users     = require( '../models/users' );
const _         = require( 'lodash' );
const UserError = require( '../helpers/errors' );
const Promise   = require( 'bluebird' );


/**
 * Gets the current user.
 */
router.get( '/me',
	token.parse(),
	( req, res ) => {
		req.user.load( 'orgUnit' )
		.then( user => {
			user.showPrivate = true;
			res.json( user.toJSON() );
		});
	}
);


/**
 * Gets open user data.
 */
router.get( '/:id',
	token.validate(),
	parseID,
	( req, res, next ) => {
		new Users( req.query )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			next( new UserError( 'User not found', err ) );
		})
		.then( user => {
			res.json( user.toJSON() );
		});
	}
);


/**
 * Gets private user data.
 */
router.get( '/:id/private',
	token.validate(),
	parseID,
	( req, res, next ) => {
		new Users( req.query )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			next( new UserError( 'User not found', err ) );
		})
		.tap( user => {
			if ( req.token.get( 'user' ) === user.id ) {
				return;
			} else {
				const perm = require( '../helpers/permissions' );
				return perm.hasOverUser( user, 'user_read_private', req.token.get( 'user' ) );
			}
		})
		.then( user => {
			user.showPrivate = true;
			res.json( user.toJSON() );
		})
		.catch( err => {
			next( new UserError( 'Authentication failed', 401, err ) );
		});
	}
);


/**
 * Updates user domain assignment.
 */
router.put( '/:id/assign/:domain(\\d+)',
	token.validate(),
	parseID,
	( req, res, next ) => {
		const OrgUnit = require( '../models/org_units' );

		// Get the user.
		let userQuery = new Users( req.query )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			next( new UserError( 'User not found', err ) );
		});

		// Get the target org unit.
		let orgQuery = new OrgUnit({ id: req.params.domain })
		.fetch({
			requre: true
		})
		.catch( err => {
			next( new UserError( 'Domain not found', err ) );
		});

		Promise.join( userQuery, orgQuery, ( user, org ) => {

			// Wasting everyone's time here.
			if ( user.get( 'orgUnit' ) === org.id ) {
				throw new UserError( 'User already member of org unit' );
			}

			user.org = org;
			return user;
		})
		.tap( user => {
			let curOrg = user.related( 'orgUnit' );

			// If it's the current user being moved,
			// and they are moving to a domain.
			if (
				req.token.get( 'user' ) === user.id &&
				'Domain' === user.org.get( 'type' )
			) {
				// If the user is assigned to National or nothing, go right ahead.
				if ( ! user.has( 'orgUnit' ) || 1 === curOrg.id ) {
					return;
				}

				// If the current domain is a domain,
				// the user can't do this!
				if ( 'Domain' === curOrg.get( 'type' ) ) {
					throw new UserError( 'Cannot leave domain', 401 );
					return;
				}

				// Otherwise, check if the domain is under the current org unit.
				return user.org
				.isChild( curOrg )
				.then( result => {
					if ( ! result ) {
						throw new UserError( 'Domain not under current region', 401 );
					}
				});
			}
			// Otherwise, check permissions.
			else {
				const perm = require( '../helpers/permissions' );
				return perm.hasOverUser( user, 'user_assign', req.token.get( 'user' ) );
			}
		})
		.then( user => {
			// Validation passed, move the user now.
			user
			.save({ orgUnit: user.org.id }, { patch: true })
			.then( user => {
				res.json({ success: true });
			});
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 401, err ) );
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
		req.query = { membershipNumber: id.toUpperCase() };
		next();
	} else if ( Number.parseInt( id ) ) {
		req.query = { id: Number.parseInt( id ) };
		next();
	} else {
		next( new UserError( 'Invalid ID provided', 400 ) );
	}
}

module.exports = router;
