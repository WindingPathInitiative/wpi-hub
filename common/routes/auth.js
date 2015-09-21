'use strict';

var router   = require( 'express' ).Router(),
    passport = require( 'passport' );

// Authenticate user.
router.get( '/', passport.authenticate( 'provider' ) );

// Verifies user.
router.get( '/verify',
    passport.authenticate( 'provider', {
        // Routes absolute, not relative.
        successRedirect: '/',
        failureRedirect: 'http://portal.mindseyesociety.org'
    })
);

module.exports = router;
