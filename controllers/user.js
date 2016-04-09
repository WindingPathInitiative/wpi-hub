'use strict';

/**
 * User data routes.
 */

const router    = require( 'express' ).Router();
const token     = require( '../middlewares/token' );
const Users     = require( '../models/users' );
const _         = require( 'lodash' );
const UserError = require( '../helpers/errors' );

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
router.get( '/:id([a-zA-Z]{2}\\d{10})',
	token.validate(),
	( req, res, next ) => {
		let mes = req.params.id.toUpperCase();
		new Users({ membershipNumber: mes })
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
router.get( '/:id([a-zA-Z]{2}\\d{10})/private',
	token.validate(),
	( req, res, next ) => {
		let mes = req.params.id.toUpperCase();
		new Users({ membershipNumber: mes })
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			next( new UserError( 'User not found', err ) );
		})
		.tap( user => {
			if ( req.token.user === user.id ) {
				return user;
			} else {
				let perm = require( '../helpers/permissions' );
				return perm.hasOverUser( user, 'user_read_private', req.token.get( 'user' ) );
			}
		}).then( user => {
			user.showPrivate = true;
			res.json( user.toJSON() );
		}).catch( err => {
			next( new UserError( 'Authentication failed', 401, err ) );
			next( err );
		});
	}
);


module.exports = router;
