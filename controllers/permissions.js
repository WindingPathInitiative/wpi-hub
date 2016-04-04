'use strict';

/**
 * User data routes.
 */

const router  = require( 'express' ).Router();
const token   = require( '../middlewares/token' );
const network = require( '../middlewares/network' );
const Office  = require( '../models/offices' );

/**
 * Gets the current user permissions.
 */
router.get( '/',
	network.internal,
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
