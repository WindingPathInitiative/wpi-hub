'use strict';

/**
 * Org unit data routes.
 */
const router    = require( 'express' ).Router();
const OrgUnit   = require( '../models/org-unit' );
const token     = require( '../middlewares/token' );
const network   = require( '../middlewares/network' );
const _         = require( 'lodash' );
const UserError = require( '../helpers/errors' );
const perm      = require( '../helpers/permissions' );
const audit     = require( '../helpers/audit' );
const organizations = require( '../config/organizations.json' );

router.get('/types',
	//don't really need a valid token for this
	( req, res, next ) => {
		let types = OrgUnit.getTypes();
		res.json(types);
	}
);

router.get('/organizations',
	//don't really need a valid token for this
	( req, res, next ) => {
		res.json(organizations);
	}
);

/**
 * Lists units, optionally with filtering.
 */
router.get( '/',
	token.validate(),
	( req, res, next ) => {
		let params = _.omit( req.query, 'token' );

		params = _.mapValues( params, v => v.toLowerCase() );
		let types = OrgUnit.getTypes().map( m => m.toLowerCase() );

		// Must be a valid type.
		if ( params.type && -1 === types.indexOf( params.type ) ) {
			return next( new UserError( 'Invalid type specified', 400 ) );
		}
		let searchTypes = [];
		if(params.types){
			searchTypes = params.types.split(',');
			for(let i = 0; i < searchTypes.length; i++){
				if(-1 === types.indexOf( searchTypes[i] )){
					return next( new UserError( 'Invalid type specified', 400 ) );
				}
			}
		}

		// Must be a venue when specifying venue type.
		if ( params.venue && undefined === params.type ) {
			params.type = 'venue';
		} else if ( params.venue && 'venue' !== params.type ) {
			return next( new UserError( 'Invalid type with "venue" option', 400 ) );
		}

		// Venues never have codes.
		if ( params.code && ( params.venue || 'venue' === params.type ) ) {
			return next( new UserError( 'Venue type does not have codes', 400 ) );
		}

		let query = new OrgUnit();

		if ( params.name ) {
			query.where( 'name', 'LIKE', '%' + params.name + '%' );
		}
		if ( params.code ) {
			query.where( 'code', 'LIKE', '%' + params.code + '%' );
		}
		if ( params.type ) {
			query.where( 'type', '=', params.type );
		}
		if ( searchTypes && searchTypes.length ){
			query.where( 'type', 'in', searchTypes );
		}
		if(params.parent && !isNaN( Number.parseInt( params.parent ) )){
			//we want to get all org_units where the parent id is in the parentPath
			query.query(
				function(qb1){
					qb1.andWhere(function (qb2){
						qb2.where('parentPath','=', params.parent)
						.orWhere('parentPath', 'LIKE', params.parent + '.%')
						.orWhere('parentPath', 'LIKE', '%.' + params.parent)
						.orWhere('parentPath', 'LIKE', '%.' + params.parent + '.%');
					});
				}
			);
		}
		
		if ( params.venue ) {
			query.where( 'venueType', '=', params.venue );
		}
		if ( ! isNaN( Number.parseInt( params.limit ) ) ) {
			query.query( 'limit', Number.parseInt( params.limit ) );
		} else {
			query.query( 'limit', 100 );
		}
		if ( ! isNaN( Number.parseInt( params.offset ) ) ) {
			query.query( 'offset', Number.parseInt( params.offset ) );
		}

		query
		.fetchAll()
		.then( units => {
			res.json( units.toJSON() );
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Search failed', err ) );
			}
		});
	}
);


/**
 * Gets node information for org unit.
 */
router.get( '/:id',
	token.validate(),
	parseID,
	( req, res, next ) => {
		let related = [];
		if ( '0' !== req.query.users ) {
			related.push( 'users' );
		}
		if ( '0' !== req.query.offices ) {
			related.push({
				offices: query => {
					query
					.select([ 'offices.*', 'users.nickname', 'users.membershipNumber' ])
					.leftJoin( 'users', 'offices.userID', 'users.id' );
				}
			});
		}

		let query = new OrgUnit( req.where )
		.fetch({ withRelated: related })
		// Hides org unit, because why?
		.tap( unit => {
			if ( '0' === req.query.users ) {
				return;
			}
			let users = unit.related( 'users' );
			users.each( user => {
				user.unset( 'orgUnit' );
			});
		})
		// Sets user key for offices.
		.tap( unit => {
			if ( '0' === req.query.offices ) {
				return;
			}
			let offices = unit.related( 'offices' );
			offices.each( office => {
				let user = {};
				_.each([ 'membershipNumber', 'nickname', 'userID' ], field => {
					if ( office.has( field ) ) {
						user[ field ] = office.get( field );
					}
					office.unset( field );
				});
				if(user['userID']) user['id'] = user['userID']; //include id for user like everywhere else
				if ( _.isEmpty( user ) ) {
					user = null;
				}
				office
				.set( 'user', user );
			});
		});

		if ( '0' !== req.query.parents || '0' !== req.query.children ) {
			query = getChain( query );
		} else {
			query.then( unit => ({ unit: unit.show().toJSON() }) );
		}

		query
		.then( resp => {
			setDepth( resp, 'parents', req.query.parents );
			setDepth( resp, 'children', req.query.children );
			//we need the return to be an actual orgUnit, not a unit subproperty.
			let resp2 =resp.unit;
			resp2.parents = resp.parents;
			resp2.children = resp.children;
			res.json( resp2 );
		})
		.catch( err => {
			next( new UserError( 'Org unit not found', 404, err ) );
		});
	}
);


/**
 * Creates a new org unit
 */
router.post( '/',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		let data  = req.body;

		if ( _.isEmpty( data ) ) {
			return next( new UserError( 'No data provided', 400 ) );
		}

		if ( ! data.parentID ) {
			return next( new UserError( 'No parent provided', 400 ) );
		}

		let types = OrgUnit.getTypes();

		if ( -1 === types.indexOf( data.type ) || 'Nation' === data.type ) {
			return next( new UserError( 'Invalid org unit type', 400 ) );
		}

		new OrgUnit({ id: data.parentID })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Parent not found', 400 );
		})
		.tap( parent => {
			let role = 'org_create_' + data.type.toLowerCase();
			return perm.hasOverUnit( parent, role, req.token.get( 'user' ) );
		})
		.then( parent => {
			// Make sure the new org unit is smaller than the current one
			if ( types.indexOf( data.type ) <= types.indexOf( parent.get( 'type' ) ) ) {
				throw new UserError( 'Org type doesn\'t match expected type', 400 );
			}

			return parent.get( 'parentPath' );
		})
		.then( path => {
			const validate = require( '../helpers/validation' );
			data.parentPath = path;
			let constraints = {
				id: { numericality: { onlyInteger: true, strict: true } },
				name: { length: { minimum: 1 }, presence: true },
				code: { length: { minimum: 1 }, presence: true },
				venueType: { length: { minimum: 1 } },
				location: { isString: true },
				defDoc: { isString: true },
				website: { url: true },
				type: { inclusion: [ 'Venue', 'Chapter', 'Region' ], presence: true },
				parentPath: { length: { minimum: 1 }, presence: true }
			};
			if ( 'Venue' === data.type ) {
				constraints.venueType.presence = true;
			}
			return validate.async( data, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			});
		})
		.then( attributes => {
			let Bookshelf = require( '../helpers/db' ).Bookshelf;
			let Office = require( '../models/office' );
			let Promise = require( 'bluebird' );
			return Bookshelf.transaction( t => {
				return new OrgUnit( attributes )
				.insertWithPath( t )
				.tap( unit => {
					return Promise.join(
						Office.makeOfficeForUnit( unit, 'manager', t ),
						() => unit.load( 'offices', { transacting: t } )
					);
				});
			})
			.catch( err => {
				throw new UserError( 'There was an error creating the org unit', 500, err );
			});
		})
		.tap( unit => audit( req, 'Creating new org unit', unit ) )
		.then( unit => {
			unit.show();
			res.json( unit );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Updates org unit
 */
router.put( '/:id',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {
		if ( _.isEmpty( req.body ) ) {
			return next( new UserError( 'No data provided', 400 ) );
		}

		new OrgUnit( req.where )
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Org unit not found', 404, err );
		})
		.tap( unit => {
			return perm.hasOverUnit( unit, 'org_update', req.token.get( 'user' ) );
		})
		.tap( unit => {
			if(req.body.code && req.body.code != unit.get('code')){
				//if we're changing the code, make sure we have create control over this unit
				let role = 'org_create_' + unit.get( 'type' ).toLowerCase();
				req.body.code = req.body.code.toUpperCase();
				return perm.hasOverUnit( unit, role, req.token.get( 'user' ) );
			}
		})
		.then( unit => {
			const validate = require( '../helpers/validation' );
			let constraints = {
				name: { length: { minimum: 1 } },
				code: { length: { minimum: 1 } },
				location: { isString: true },
				defDoc: { isString: true },
				website: { url: true }
			};
			if ( 'Venue' === unit.get( 'type' ) ) {
				delete constraints.code;
			}
			return validate.async( req.body, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			})
			.tap( () => audit( req, 'Updating org unit', unit, {}, unit ) )
			.then( attributes => {
				return unit.save( attributes );
			});
		})
		.then( unit => {
			unit.show();
			res.json( unit.toJSON() );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Deletes an org unit.
 */
router.delete( '/:id',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {

		// No deleting National!
		if ( 1 === Number.parseInt( req.params.id ) ) {
			return next( new UserError( 'Cannot delete root org' ) );
		}

		new OrgUnit( req.where )
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Org unit not found', 404, err );
		})
		.tap( unit => {
			let role = 'org_create_' + unit.get( 'type' ).toLowerCase();
			return perm.hasOverUnit( unit, role, req.token.get( 'user' ) );
		})
		.tap( unit => {
			return unit.getChildren()
			.then( children => {
				if ( children.length ) {
					throw new UserError( 'Cannot delete org with children' );
				}
			});
		})
		.tap( unit => audit( req, 'Deleted org unit', unit, {}, unit.toJSON() ) )
		.tap( unit => {
			let Promise   = require( 'bluebird' );
			let Offices   = require( '../models/office' );
			let Users     = require( '../models/user' );
			let Bookshelf = require( '../helpers/db' ).Bookshelf;

			return Bookshelf.transaction( t => {
				let office = new Offices()
				.where({ parentOrgID: unit.id })
				.destroy({ transacting: t });

				let users  = Promise.resolve( unit.parents() )
				.then( parents => {
					let parent = parents.pop();
					if ( ! parent ) {
						throw new UserError( 'No parent found' );
					}

					return new Users()
					.where({ orgUnit: unit.id })
					.save( { orgUnit: parent }, { patch: true, transacting: t } );
				});

				let unitDel = unit
				.destroy({ transacting: t })
				.catch( err => {
					throw new UserError( 'Could not delete org', err );
				});

				return Promise.join(
					office,
					users,
					unitDel,
					() => null
				);
			});
		})
		.then( () => {
			res.json({ success: true });
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Parses an ID into the correct query.
 */
function parseID( req, res, next ) {
	let id = req.params.id;

	if ( ! id ) {
		next( new UserError( 'No ID provided', 400 ) );
	} else if ( 'me' === id ) {
		let User = require( '../models/user' );
		return new User({ id: req.token.get( 'user' ) })
		.fetch({ require: true })
		.catch( err => {
			next( new UserError( 'User not found', 404 ) );
		})
		.then( user => {
			if ( ! user.get( 'orgUnit' ) ) {
				next( new UserError( 'No org unit associated', 404 ) );
			} else {
				req.user = user;
				req.where = { id: user.get( 'orgUnit' ) };
				next();
			}
		});
	} else if ( -1 !== id.search( /^[a-z]{2}[\-\d]*$/i ) ) {
		req.where = { code: id.toUpperCase() };
		next();
	} else if ( Number.parseInt( id ) ) {
		req.where = { id: Number.parseInt( id ) };
		next();
	} else {
		next( new UserError( 'Invalid ID provided', 400 ) );
	}
}


/**
 * Gets and returns JSON response.
 * @param  {object} unit The unit model.
 * @return {Promise}
 */
function getChain( unit ) {
	return unit.then( unit => {
		return [ unit, unit.getChain() ];
	})
	.spread( ( unit, chain ) => {
		unit.show();
		let resp = {
			unit: unit.toJSON(),
			children: [],
			parents: []
		};

		// Splits chain into children and parents.
		if ( chain ) {

			let parents = unit.parents();

			let units = _.map( chain.toArray(), u => {
				let json = u.toJSON();
				return json;
			});
			let split = _.partition( units, u => -1 !== parents.indexOf( u.id ) );
			if ( 2 === split.length ) {
				resp.parents  = split[0];
				resp.children = split[1];
			}
		}

		// Sorts children.
		resp.children = sortChain( resp.children );
		return resp;
	});
}


/**
 * Makes chain heirarchical.
 * @param  {array} units Array of org units.
 * @return {array}
 */
function sortChain( units ) {
	let types = OrgUnit.getTypes();
	let depth = index => types.indexOf( units[ index ].type );
	_.each( units, unit => {
		unit.children = [];
	});
	for ( let i = units.length - 1; i > 0; i-- ) {
		let d1 = depth( i );
		for ( let u = i - 1; u >= 0; u-- ) {
			if ( depth( i ) > depth( u ) ) {
				units[ u ].children.push( units[ i ] );
				units[ i ] = false;
				break;
			}
		}
	}
	return _.compact( units );
}


/**
 * Sets how many levels of unit should be trimmed.
 * @param {Object} resp  Object to be mutated.
 * @param {String} type  Key to mutate.
 * @param {Number} depth Levels to keep, undefined means all.
 * @return {Object}
 */
function setDepth( resp, type, depth ) {
	if ( undefined === depth || '-1' === depth ) {
		return resp;
	}
	if ( 'string' === typeof depth ) {
		depth = Number.parseInt( depth );
	}

	let object = resp[ type ];
	if ( ! object || ! _.isArray( object ) ) {
		return resp;
	}

	if ( 0 === depth ) {
		_.unset( resp, type );
		return resp;
	}

	if ( ! object.length ) {
		return resp;
	}

	if ( 'parents' === type ) {
		resp.parents = object.slice( object.length - depth );
	} else {
		const iterate = ( obj, curDepth = 1 ) => {
			if ( curDepth < depth ) {
				obj.children.forEach( c => iterate( c, curDepth + 1 ) );
			} else {
				_.unset( obj, 'children' );
			}
		};
		object.forEach( c => iterate( c ) );
	}
	return resp;
}


module.exports = router;
