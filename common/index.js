'use strict';

module.exports = ( req, res, next ) => {

    // Authentication.
    require( './auth' )( req, res );

    // Navigation.
    require( './nav' )( req, res );

    next();
};
