'use strict';

/**
 * User data routes.
 */

const router = require( 'express' ).Router();
const token  = require( '../middlewares/token' );
const Users  = require( '../models/users' );
const Office = require( '../models/offices' );

/**
 * Gets the current user permissions.
 */
router.get( '/',
	token.parse(),
	( req, res, next ) => {
		req.user.load([ 'offices' ])
		.then( user => {
			res.json( user.toJSON() );
		});
	}
);

module.exports = router;
