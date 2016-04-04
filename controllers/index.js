'use strict';

const router   = require( 'express' ).Router();
const _        = require( 'lodash' );

// Authentication.
router.use( '/auth', require( './auth' ) );

// Users.
router.use( '/users', require( './user' ) );

// Org Units.
router.use( '/orgunits', require( './org-units' ) );

// Permissions.
router.use( '/permissions', require( './permissions' ) );

// Test code!
let token = require( '../middlewares/token' );

router.get( '/',
	token.parse( false ),
	( req, res ) => {
		let html = `<script src="https://code.jquery.com/jquery-2.2.2.min.js"   integrity="sha256-36cp2Co+/62rEAAYHLmRCPIych47CvdM+uTBJwSzWjI="   crossorigin="anonymous"></script>
		<button>Login</button>
		<script>
		$( "button" ).on( "click", function() {
			$.get( "/auth/signin/test", function( resp ) {
				if ( resp.url ) {
					location.assign( resp.url );
				}
			});
		});
		</script>`;

		if ( req.user ) {
			html += `
			<h1>${ req.user.get( 'fullName' ) }!</h1>
			<h2>${ req.user.get( 'membershipNumber' ) }</h2>
			<ul>
				<li><a href="/permissions">Permissions</a></li>
				<li><a href="/users/me">My profile</a></li>
				<li><a href="/switch">Switch user</a></li>
				<li><a href="/auth/signout">Log out</a></li>
			</ul>
			`;
		}

		res.send( html );
	}
);

router.get( '/switch', ( req, res ) => {
	let Users = require( '../models' ).Users;
	Users.fetchAll()
	.then( users => {
		let html = '<h1>Switch to user:</h1><ul>';
		_.each( users.toJSON(), user => {
			html += `<li><a href="/switch/${ user.id }">${ user.fullName }</a></li>`;
		});
		html += '</ul>';
		res.send( html );
	});
});

router.get( '/switch/:id',
	token.validate(),
	( req, res ) => {
		req.token
		.save( 'user', req.params.id, { patch: true } )
		.then( () => {
			res.redirect( '/' );
		});
	}
);

router.get( '/tokens', ( req, res ) => {
	let Tokens = require( '../models' ).Tokens;
	Tokens.fetchAll()
	.then( tokens => {
		res.json( tokens.toJSON() );
	});
});

module.exports = router;
