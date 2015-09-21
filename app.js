'use strict';

var express      = require( 'express' ),
    path         = require( 'path' ),
    favicon      = require( 'serve-favicon' ),
    logger       = require( 'morgan' ),
    cookieParser = require( 'cookie-parser' ),
    bodyParser   = require( 'body-parser' ),
    stylus       = require( 'stylus' ),
    session      = require( 'express-session' ),
    passport     = require( 'passport' ),

    dbConfig     = require( './common/config/db.json' ),

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
}));
app.use( express.static( path.join( __dirname, 'public' ) ) );
app.use( session({
    secret: 'diablerie ftw', // TODO: Make this a config option.
    resave: false,
    saveUninitialized: false
}));
app.use( passport.initialize() );
app.use( passport.session() );

app.use( common );

app.use( '/auth', require( './routes/auth' ) );
app.use( '/', routes );

// catch 404 and forward to error handler
app.use( ( req, res, next ) => {
    var err = new Error( 'Not Found' );
    err.status = 404;
    next( err );
});

// error handlers

// development error handler
// will print stacktrace
if ( app.get( 'env' ) === 'development' ) {
    app.use( ( err, req, res, next ) => {
        res.status( err.status || 500 );
        res.render( 'error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use( ( err, req, res, next ) => {
    res.status( err.status || 500 );
    res.render( 'error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
