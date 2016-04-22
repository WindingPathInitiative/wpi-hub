'use strict';

/**
 * Office routes.
 */

const router    = require( 'express' ).Router();
const token     = require( '../middlewares/token' );
const network   = require( '../middlewares/network' );
const Office    = require( '../models/offices' );
const Users     = require( '../models/users' );
const UserError = require( '../helpers/errors' );


/**
 * Gets an office by ID.
 */
router.get( '/:id(\\d+)',
	token.validate(),
	( req, res ) => {
		new Office({ id: req.params.id })
		.fetch({
			withRelated: [ 'parentOffice', 'orgUnit', 'user' ]
		})
		.then( office => {
			office.unset([ 'userID', 'parentOrgID', 'parentOfficeID' ]);
			res.json( office.toJSON() );
		});
	}
);

/**
 * Gets the current user offices.
 */
router.get( '/internal',
	network.internal,
	token.validate(),
	( req, res ) => {
		new Office()
		.where( 'userID', '=', req.token.get( 'user' ) )
		.fetchAll()
		.then( offices => {
			res.json( offices.toJSON() );
		});
	}
);

/**
 * Assigns a user to an office, or vacates it.
 */
router.put( '/:id(\\d+)/assign/:user(\\d+)',
	token.validate(),
	( req, res, next ) => {

		var curUser = req.token.get( 'user' );
		var userID  = Number.parseInt( req.params.user );

		let officeQuery, userQuery;

		officeQuery = new Office({ id: req.params.id })
		.fetch({ require: true })
		.catch( err => {
			next( new UserError( 'Office not found', 404, err ) );
		});

		if ( userID ) {
			userQuery = new Users({ id: userID })
			.fetch({
				require: true
			})
			.catch( err => {
				next( new UserError( 'User not found', 404, err ) );
			});
		} else {
			userQuery = false;
		}

		const Promise = require( 'bluebird' );

		Promise.join( officeQuery, userQuery, ( office, user ) => {
			return office;
		})
		.tap( office => {

			// Sanity check.
			if ( office.get( 'userID' ) === userID ) {
				if ( userID ) {
					throw new UserError( 'User already officer' );
				} else {
					throw new UserError( 'Office already vacant' );
				}
			}

			const perm = require( '../helpers/permissions' );

			// If the office belongs to the current user and they are quitting.
			if (
				curUser === office.get( 'userID' ) &&
				0 === office.user
			) {
				return;
			}
			// Check if we're a parent office.
			else if ( 'Assistant' === office.get( 'type' ) ) {
				return perm.hasOverOffice( office, 'office_assign', curUser );
			}
			// Otherwise, check the org unit chain.
			else {
				return perm.hasOverUnit( office.get( 'parentOrgID' ), 'office_assign', curUser );
			}
		})
		.then( office => {

			// Let's change the officer now.
			office
			.save({ userID: userID }, { patch: true })
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

module.exports = router;