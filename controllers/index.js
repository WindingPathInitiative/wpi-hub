'use strict';

const router   = require( 'express' ).Router();
const _        = require( 'lodash' );

// Authentication.
router.use( '/auth', require( './auth' ) );

// Users.
router.use( '/user', require( './user' ) );

// Org Units.
router.use( '/orgunit', require( './org-units' ) );

// Test code!
let token = require( '../middlewares/token' );

router.get( '/test',
token.parse(),
( req, res ) => {
	let html = `<script src="https://code.jquery.com/jquery-2.2.2.min.js"   integrity="sha256-36cp2Co+/62rEAAYHLmRCPIych47CvdM+uTBJwSzWjI="   crossorigin="anonymous"></script>
	<button>Login</button>
	<script>
	$( "button" ).on( "click", function() {
		$.get( "/auth/test", function( resp ) {
			if ( resp.url ) {
				location.assign( resp.url );
			}
		});
	});
	</script>
	`;

	if ( req.user ) {
		html += `
		<h1>${ req.user.get( 'firstName' ) }!</h1>
		<h2>${ req.user.get( 'membershipNumber' ) }</h2>
		`;
	}

	res.send( html );
});

router.get( '/tokens', ( req, res ) => {
	let Tokens = require( '../models' ).Tokens;
	Tokens.removeExpired()
	.then( result => {
		Tokens.fetchAll()
		.then( tokens => {
			res.json( tokens.toJSON() );
		});
	});
});

module.exports = router;
