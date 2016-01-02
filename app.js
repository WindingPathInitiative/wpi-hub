'use strict';

var express      = require( 'express' ),
    path         = require( 'path' ),
    favicon      = require( 'serve-favicon' ),
    logger       = require( 'morgan' ),
    cookieParser = require( 'cookie-parser' ),
    bodyParser   = require( 'body-parser' ),
    stylus       = require( 'stylus' ),

    common       = require( './common' ),

    routes       = require( './routes/' ),

    app          = express();

// View engine setup.
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

// Middleware.
app.use( favicon( path.join( __dirname, 'public/images', 'favicon.png' ) ) );
app.use( logger( 'dev' ) );
app.use( bodyParser.json() );
app.use( bodyParser.urlencoded({ extended: false }) );
app.use( cookieParser() );
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
app.locals.config = require( './config' );

// Central login and auth logic.
common.init( app );

app.use( express.static( path.join( __dirname, 'public' ) ) );

// Sets up common routes.
common.route( app );

app.use( '/', routes );

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
