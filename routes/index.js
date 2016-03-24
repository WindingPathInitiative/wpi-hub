'use strict';

const router   = require( 'express' ).Router();
const _        = require( 'lodash' );

// Authentication.
router.use( '/auth', require( './auth.js' ) );

router.get( '/test', ( req, res ) => {
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
	res.send( html );
});

module.exports = router;
