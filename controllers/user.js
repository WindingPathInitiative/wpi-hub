'use strict';

/**
 * User data routes.
 */

const router = require( 'express' ).Router();
const token  = require( '../middlewares/token' );
const Users  = require( '../models/users' );
const _      = require( 'lodash' );

/**
 * Gets the current user.
 */
router.get( '/me',
	token.parse(),
	( req, res ) => {
		req.user.load( 'orgUnit' )
		.then( user => {
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
			columns: [
				'membershipNumber',
				'firstName',
				'lastName',
				'nickname',
				'membershipType',
				'membershipExpiration',
				'orgUnit'
			],
			withRelated: 'orgUnit'
		})
		.catch( () => {
			next( new Error( 'User not found' ) );
		})
		.then( user => {
			res.json( user.toJSON() );
		});
	}
);


router.get( '/private/:id([a-zA-Z]{2}\\d{10})',
	token.validate(),
	( req, res, next ) => {
		let mes = req.params.id.toUpperCase();
		new Users({ membershipNumber: mes })
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( () => {
			next( new Error( 'User not found' ) );
		})
		.then( user => {
			if ( req.token.user === user.id ) {
				return user;
			} else {
				let perm = require( '../helpers/permissions' );
				return perm.hasOverUser( user, 'user_read_private', req.token.get( 'user' ) );
			}
		}).then( user => {
			res.json( user.toJSON() );
		}).catch( () => {
			let err = new Error( 'Authentication failed' );
			err.status = 401;
			next( err );
		});
	}
);


module.exports = router;
