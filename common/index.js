'use strict';

module.exports = ( app ) => {

    // Sessions.
    require( './sessions' )( app );

    // Authentication.
    require( './auth' )( app );

    // Navigation.
    app.use( require( './nav' ) );

};
