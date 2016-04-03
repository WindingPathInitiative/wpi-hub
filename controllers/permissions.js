'use strict';

/**
 * User data routes.
 */

const router = require( 'express' ).Router();
const token  = require( '../middlewares/token' );
const Office = require( '../models/offices' );

/**
 * Gets the current user permissions.
 */
router.get( '/',
	token.validate(),
	( req, res, next ) => {
		new Office()
		.where( 'userID', '=', req.token.get( 'user' ) )
		.fetchAll()
		.then( offices => {
			res.json( offices.toJSON() );
		});
	}
);

module.exports = router;
