'use strict';

const router  = require( 'express' ).Router();
const _       = require( 'lodash' );
const modules = require( '../modules' ).prefix;

router.get( '/', ( req, res ) => {
	res.render( 'index', { modules: modules } );
});

module.exports = router;
