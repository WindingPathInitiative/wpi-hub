'use strict';

/**
 * Module to set up navigation for system.
 */

var nav      = require( './config/nav.json' ),
    _        = require( 'lodash' ),
    rootPath = process.env.domain || 'http://portal.mindseyesociety.org',
    navMap;

// Run nav object through a map to prepend root.
navMap = i => {
    if ( i.url && i.url.indexOf( '/' ) === 0 ) {
        i.url = rootPath + i.url;
    }
    if ( i.children ) {
        i.children.map( navMap );
    }
    return i;
};

nav.map( navMap );

module.exports = ( req, res ) => {
    res.locals.nav      = nav;
    res.locals.rootPath = rootPath;
    if ( req.user && req.user.firstName ) {
        res.locals.name = req.user.firstName;
    }
};
