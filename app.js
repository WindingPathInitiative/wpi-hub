'use strict';

const express    = require( 'express' );
const path       = require( 'path' );
const bodyParser = require( 'body-parser' );
const stylus     = require( 'stylus' );

const app        = express();

// View engine setup.
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

// Middleware.
app.use( require( 'serve-favicon' )(
	path.join( __dirname, 'public/images', 'favicon.png' ) )
);
app.use( require( 'morgan' )( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( require( 'cookie-parser' )() );
app.use( stylus.middleware({
	src: path.join( __dirname, 'public' ),
	compile: ( str, path ) => {
		return stylus( str )
			.set( 'filename', path )
			.use( require( 'nib' )() )
			.import( 'nib' );
	}
}) );

// Sets the main configuration options.
GLOBAL.config = require( './config' );

// Main logic.
const common  = require( './common' );
const modules = require( './modules' );

// Central login and auth logic.
common.init( app );
modules.init( app );

app.use( express.static( path.join( __dirname, 'public' ) ) );

// Routing.
modules.routes( app );
app.use( '/', common.route );

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
	app.use( ( err, req, res, next ) => {
		res.status( err.status || 500 );
		res.render( 'error', {
			message: err.message,
			error: err
		});
	});
}

// Production error handler
// No stacktraces leaked to user
app.use( ( err, req, res, next ) => {
	res.status( err.status || 500 );
	res.render( 'error', {
		message: err.message,
		error: {}
	});
});

module.exports = app;
