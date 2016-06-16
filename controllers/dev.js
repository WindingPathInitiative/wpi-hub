'use strict';

const router = require( 'express' ).Router();
const _      = require( 'lodash' );
const token  = require( '../middlewares/token' );
const User   = require( '../models/user' );

router.get( '/',
	token.parse( false ),
	( req, res ) => {
		let html;

		if ( req.user ) {
			html = `
			<h1>${ req.user.get( 'fullName' ) }!</h1>
			<h2>${ req.user.get( 'membershipNumber' ) }</h2>
			<p>Token: <code>${ req.token.id }</code></p>
			<ul>
				<li><a href="/v1/offices/internal">My offices</a></li>
				<li><a href="/v1/users/me">My profile</a></li>
				<li><a href="/dev/list/users">List Users</a></li>
				<li><a href="/dev/switch">Switch user</a></li>
				<li><a href="/v1/auth/signout">Log out</a></li>
			</ul>
			`;
		} else {
			html = `<script src="https://code.jquery.com/jquery-2.2.2.min.js"   integrity="sha256-36cp2Co+/62rEAAYHLmRCPIych47CvdM+uTBJwSzWjI="   crossorigin="anonymous"></script>
			<button>Login</button>
			<script>
			$( "button" ).on( "click", function() {
				$.get( "/v1/auth/signin/test", function( resp ) {
					if ( resp.url ) {
						location.assign( resp.url );
					}
				});
			});
			</script>`;
		}

		res.send( html );
	}
);

router.get( '/switch', ( req, res ) => {
	User.fetchAll()
	.then( users => {
		let html = '<h1>Switch to user:</h1><ul>';
		_.each( users.toJSON(), user => {
			html += `<li><a href="/dev/switch/${ user.id }">${ user.fullName }</a></li>`;
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
			res.redirect( '/dev' );
		});
	}
);

router.get( '/list/users',
	( req, res ) => {
		User.fetchAll()
		.then( users => {
			let html = '<h1>Users</h1><ul>';
			users.each( user => {
				user = user.toJSON();
				html += `<li><a href="/v1/users/${ user.membershipNumber }">${ user.fullName }</a></li>`;
			});
			html += '</li>';
			res.send( html );
		});
	}
);

router.get( '/auth',
	( req, res ) => {
		res.redirect( req.query.redirect_uri + '?code=test' );
	}
);

router.post( '/auth/token',
	( req, res ) => {
		res.json({
			access_token: 'fakeaccesstoken',
			scope: null,
			token_type: 'bearer',
			expires_in: 3600,
			refresh_token: 'fakerefreshtoken'
		});
	}
);

router.get( '/auth/user',
	( req, res ) => {
		res.json({
			remoteId: 375
		});
	}
);

module.exports = router;
