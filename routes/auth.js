'use strict';

const passport   = require( 'passport' );
const router     = require( 'express' ).Router();
const controller = require( '../controllers/auth' );

router.get( '/:code',
	controller.validateParam,
	controller.getLogin
);

router.get( '/verify/:code',
	controller.validateParam,
	passport.authenticate( 'provider', {
		failureRedirect: 'http://portal.mindseyesociety.org',
		session: false
	}),
	controller.getValidate
);

module.exports = router;
