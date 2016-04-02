'use strict';

/**
 * User data routes.
 */

const router  = require( 'express' ).Router();
const OrgUnit = require( '../models/org_units' );
const Promise = require( 'bluebird' );

const omitFields = [ 'lft', 'rgt', 'depth' ];

/**
 * Gets node information and parents.
 */
router.get( '/:code',
	( req, res, next ) => {

		let code  = req.params.code;
		let query = {};
		if ( isNaN( code ) ) {
			query.code = code.toUpperCase();
		} else {
			query.id = code;
		}

		new OrgUnit( query )
		.fetch({ require: true })
		.then( unit => {
			Promise.join( unit.getParents(), unit.getChildren() )
			.then( results => {

				let resp = {
					unit: unit.omit( omitFields ),
					children: [],
					parents: []
				};

				if ( results[0] ) {
					resp.parents = results[0].invoke( 'omit', omitFields );
				}
				if ( results[1] ) {
					resp.children = results[1].invoke( 'omit', omitFields );
				}
				res.json( resp );
			});
		})
		.catch( () => {
			next( new Error( 'Org unit not found.' ) );
		});
	}
);


module.exports = router;
