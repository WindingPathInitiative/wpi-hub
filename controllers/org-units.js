'use strict';

/**
 * User data routes.
 */

const router  = require( 'express' ).Router();
const OrgUnit = require( '../models/org_units' );
const _       = require( 'lodash' );


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

		var unit; // The solo unit.

		new OrgUnit( query )
		.fetch({ require: true })
		.then( model => {
			unit = model;
			return unit.getChain();
		})
		.then( chain => {

			let resp = {
				unit: unit.toJSON(),
				children: [],
				parents: []
			};

			if ( chain ) {
				let left  = unit.get( 'lft' );
				let units = _.map( chain.toArray(), u => {
					let json = u.toJSON();
					json.lft = u.get( 'lft' );
					json.rgt = u.get( 'rgt' );
					return json;
				});
				let split = _.partition( units, r => r.lft < left );
				if ( 2 === split.length ) {
					let map = m => _.omit( m, [ 'lft', 'rgt' ] );
					resp.parents = _.map( split[0], map );
					resp.children = _.map( split[1], map );
				}
			}
			res.json( resp );
		});
	}
);


module.exports = router;
