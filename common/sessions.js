'use strict';

var session      = require( 'express-session' ),
    SessionStore = require( 'express-mysql-session' ),
    _            = require( 'lodash' ),
    config       = require( './config/db' ),
    store;

store = new SessionStore( _.merge( config.global, config.sessions ) );

module.exports = ( app ) => {
	app.use(
		session({
			key: config.sessions.key,
			secret: config.sessions.secret,
			store: store,
			resave: true,
			saveUninitialized: true
		})
	);
};
