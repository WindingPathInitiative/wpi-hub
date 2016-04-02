'use strict';

/**
 * User data routes.
 */

const router  = require( 'express' ).Router();
const OrgUnit = require( '../models/org_units' );
const _       = require( 'lodash' );

const omitFields = [ 'lft', 'rgt' ];

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
			unit.getChain()
			.then( results => {

				let resp = {
					unit: unit.omit( omitFields ),
					children: [],
					parents: []
				};

				if ( results ) {
					let left  = unit.get( 'lft' );
					let split = _.partition( results.toJSON(), r => r.lft < left );
					if ( 2 === split.length ) {
						let map = m => _.omit( m, omitFields );
						resp.parents = _.map( split[0], map );
						resp.children = _.map( split[1], map );
					}
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
