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
		res.json( req.user.toJSON() );
	}
);


/**
 * Gets user data. Provides additional data if correct token is provided.
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
		.then( user => {
			res.json( user.toJSON() );
		})
		.catch( ( err ) => {
			console.log( err );
			next( new Error( 'User not found' ) );
		});
	}
);


module.exports = router;
