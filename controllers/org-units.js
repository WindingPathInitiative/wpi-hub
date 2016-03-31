'use strict';

/**
 * User data routes.
 */

const router  = require( 'express' ).Router();
const OrgUnit = require( '../models/org_units' );

/**
 * Gets node information and parents.
 */
router.get( '/:code',
	( req, res ) => {

		let code  = req.params.code;
		let query = {};
		if ( isNaN( code ) ) {
			query.code = code.toUpperCase();
		} else {
			query.id = code;
		}

		new OrgUnit( query )
		.fetch()
		.then( unit => {
			OrgUnit.getParents( unit.get( 'parents' ) ).then( parents => {

				let resp = { unit: unit.toJSON() };

				if ( parents ) {
					resp.parents = parents.toArray();
				}
				res.json( resp );
			});
		});
	}
);


router.get( '/children/:code',
	( req, res ) => {
		let code  = req.params.code;
		let query = {};
		if ( isNaN( code ) ) {
			query.code = code.toUpperCase();
		} else {
			query.id = code;
		}

		new OrgUnit( query )
		.fetch()
		.then( unit => {
			OrgUnit.getParents( unit.get( 'parents' ) ).then( parents => {

				let resp = { unit: unit.toJSON() };

				if ( parents ) {
					resp.parents = parents.toArray();
				}
				res.json( resp );
			});
		});
	}
);


module.exports = router;
