'use strict';

module.exports = ( req, res, next ) => {

    // Navigation.
    require( './nav' )( res );

    // Authentication.
    require( './auth' )( req, res );

    next();
};
