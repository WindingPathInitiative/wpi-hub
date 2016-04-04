'use strict';

/**
 * User data routes.
 */

const router  = require( 'express' ).Router();
const OrgUnit = require( '../models/org_units' );
const token   = require( '../middlewares/token' );
const _       = require( 'lodash' );


/**
 * Gets node information for user.
 */
router.get( /([a-zA-Z]{2}[\-\d]*)\/?$/,
	token.validate(),
	( req, res, next ) => {
		queryOrgUnit({ code: req.params[0].toUpperCase() })
		.then( unit => {
			res.json( unit );
		})
		.catch( () => {
			next( new Error( 'Org unit not found' ) );
		});
	}
);


router.get( '/internal/:id',
	( req, res, next ) => {
		let id = parseInt( req.params.id );
		if ( NaN === id ) {
			next( new Error( 'Invalid org id' ) );
			return;
		}
		queryOrgUnit({ id: id })
		.then( unit => {
			res.json( unit );
		})
		.catch( () => {
			next( new Error( 'Org unit not found' ) );
		});
	}
);


/**
 * Queries the Org Unit table.
 * @param  {object} query The params to query.
 * @return {Promise}
 */
function queryOrgUnit( query ) {
	return new OrgUnit( query )
	.fetch({ require: true })
	.then( unit => {
		return [ unit, unit.getChain() ];
	})
	.spread( ( unit, chain ) => {
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
		return resp;
	});
}


module.exports = router;
