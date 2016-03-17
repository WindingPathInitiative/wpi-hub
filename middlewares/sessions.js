'use strict';

const session = require( 'express-session' );
const _       = require( 'lodash' );
const config  = GLOBAL.config.get( 'db' );

let SessionStore = require( 'express-mysql-session' );
let store = new SessionStore( _.merge( config.global, config.sessions ) );

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
