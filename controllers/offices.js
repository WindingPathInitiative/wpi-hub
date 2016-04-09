'use strict';

/**
 * Office routes.
 */

const router  = require( 'express' ).Router();
const token   = require( '../middlewares/token' );
const network = require( '../middlewares/network' );
const Office  = require( '../models/offices' );

/**
 * Gets an office by ID.
 */
router.get( '/:id(\\d+)',
	token.validate(),
	( req, res ) => {
		new Office({ id: req.params.id })
		.fetch({
			withRelated: [ 'parentOffice', 'orgUnit', 'user' ]
		})
		.then( office => {
			office.unset([ 'userID', 'parentOrgID', 'parentOfficeID' ]);
			res.json( office.toJSON() );
		});
	}
);

/**
 * Gets the current user offices.
 */
router.get( '/internal',
	network.internal,
	token.validate(),
	( req, res ) => {
		new Office()
		.where( 'userID', '=', req.token.get( 'user' ) )
		.fetchAll()
		.then( offices => {
			res.json( offices.toJSON() );
		});
	}
);

module.exports = router;
