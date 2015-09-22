'use strict';

module.exports.init = ( app ) => {

    // Sessions.
    require( './sessions' )( app );

    // Authentication.
    require( './auth' )( app );

    // Navigation.
    app.use( require( './nav' ) );

    // Database.
    app.set( 'bookshelf', require( './db' ).Bookshelf );
};

module.exports.route = ( app ) => {
    app.use( '/auth', require( './routes/auth' ) );
};
