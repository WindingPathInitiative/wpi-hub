'use strict';

module.exports = ( req, res, next ) => {

    // Navigation.
    require( './nav' )( res );

    next();
};
