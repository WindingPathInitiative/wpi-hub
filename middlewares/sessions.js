'use strict';

const session = require( 'express-session' );
const config  = GLOBAL.config.get( 'db' );
const pgSess  = require( 'connect-pg-simple' )( session );

module.exports = ( app ) => {
	let db = config.global;

	app.use(
		session({
			secret: config.sessions.secret,
			store: new pgSess({
				conString: db,
				tableName: 'sessions'
			}),
			name: 'mes-session',
			resave: false,
			saveUninitialized: true
		})
	);
};
