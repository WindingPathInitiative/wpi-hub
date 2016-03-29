'use strict';

/**
 * User data routes.
 */

const router = require( 'express' ).Router();
const token  = require( '../middlewares/token' );


/**
 * Gets the current user.
 */
router.get( '/me',
	token.parse,
	( req, res ) => {
		res.json( req.user.toJSON() );
	}
);

module.exports = router;
