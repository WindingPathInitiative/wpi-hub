'use strict';

/**
 * User data routes.
 */

const router = require( 'express' ).Router();
const token  = require( '../middlewares/token' );
const Users  = require( '../models/users' );

/**
 * Gets the current user.
 */
router.get( '/me',
	token.parse(),
	( req, res ) => {
		res.json( req.user.toJSON() );
	}
);


/**
 * Gets user data. Provides additional data if correct token is provided.
 */
router.get( '/:id([a-zA-Z]{2}\\d{10})',
	token.parse( false ),
	( req, res, next ) => {
		let mes = req.params.id.toUpperCase();
		let attrs = [
			'membershipNumber',
			'firstName',
			'lastName',
			'nickname',
			'membershipType',
			'membershipExpiration',
			'orgUnit'
		];
		new Users({ membershipNumber: mes })
		.fetch({ require: true })
		.then( user => {

			// Filter out private data if this is an open endpoint.
			if ( ! req.user || req.user.id !== user.id ) {
				user = user.pick( attrs );
			}

			res.json( user );
		})
		.catch( () => {
			next( new Error( 'User not found' ) );
		});
	}
);


module.exports = router;
