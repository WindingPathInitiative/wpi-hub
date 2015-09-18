'use strict';

var express  = require( 'express' ),
    router   = express.Router(),
    passport = require( 'passport' );

/* GET users listing. */
router.get( '/', passport.authenticate( 'provider' ) );

router.get( '/verify',
    passport.authenticate( 'provider', {
        successRedirect: '/',
        failureRedirect: '/auth/fail'
    })
);

router.get( '/fail', ( req, res ) => {
    res.send( '<a href="/auth">failure! :(</a>' );
});

module.exports = router;
