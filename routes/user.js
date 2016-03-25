'use strict';

const router = require( 'express' ).Router();
const token  = require( '../middlewares/token' );

router.get( '/me',
	token.parse,
	( req, res ) => {
		res.json( req.user.toJSON() );
	}
);

module.exports = router;
