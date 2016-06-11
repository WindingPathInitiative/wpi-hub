'use strict';

const express    = require( 'express' );
const bodyParser = require( 'body-parser' );

const app        = express();

app.set( 'version', '0.1' );

// Initializes the DB.
require( './helpers/db' );

// Middleware.
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( require( 'cookie-parser' )() );
app.use( require( 'passport' ).initialize() );

if ( 'development' === app.get( 'env' ) ) {
	app.use( require( 'morgan' )( 'dev' ) );
}

// Runs token maintenance.
app.use( require( './middlewares/token' ).normalize );

// Sets up CORS.
app.use( require( './middlewares/cors' ) );

// Load routes.
app.use( require( './controllers' ) );

// Catch 404 and forward to error handler
app.use( ( req, res, next ) => {
	var err = new Error( 'Not Found' );
	err.status = 404;
	next( err );
});

// Error handlers

// Development error handler
// Will print stacktrace
if ( 'development' === app.get( 'env' ) ) {
	require( 'pretty-error' ).start();
	app.use( ( err, req, res, next ) => {
		if ( err.dev ) {
			console.error( err.dev.stack );
		}
		res.status( err.status || 500 );
		res.json({
			message: err.message,
			status: err.status || 500
		});
	});
}

// Production error handler
// No stacktraces leaked to user
app.use( ( err, req, res, next ) => {
	res.status( err.status || 500 );
	res.json({
		message: err.message,
		status: err.status || 500
	});
});

module.exports = app;
