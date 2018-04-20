'use strict';

/**
 * User data routes.
 */

const router        = require( 'express' ).Router();
const _             = require( 'lodash' );
const Promise       = require( 'bluebird' );
const Moment        = require( 'moment' );

const token         = require( '../middlewares/token' );
const network       = require( '../middlewares/network' );
const User          = require( '../models/user' );
const UserError     = require( '../helpers/errors' );
const normalizeBool = require( '../helpers/validation' ).normalizeBool;
const perm          = require( '../helpers/permissions' );
const audit         = require( '../helpers/audit' );



/**
 * Gets a list of users, optionally with filtering.
 */
router.get( '/',
	token.validate(),
	( req, res, next ) => {
		let params = _.omit( req.query, 'token' );
		let query = new User();

		if ( params.name ) {
			let like = '%' + params.name + '%';
			query.where( q => {
				q.where( 'firstName', 'LIKE', like )
				.orWhere( 'lastName', 'LIKE', like )
				.orWhere( 'nickname', 'LIKE', like );
			});
		} else if ( params.email ) {
			query.where( 'email', params.email );
		} else if ( params.mes ) {
			query.where( 'membershipNumber', params.mes );
		}

		if ( undefined !== params.type ) {
			query.where( 'membershipType', params.type );
		}

		if ( undefined !== params.expired ) {
			let type = normalizeBool( params.expired ) ? '<' : '>=';
			query.where( 'membershipExpiration', type, Moment.utc().format( 'YYYY-MM-DD' ) );
		}

		if ( ! isNaN( Number.parseInt( params.limit ) ) ) {
			query.query( 'limit', Number.parseInt( params.limit ) );
		} else {
			query.query( 'limit', 100 );
		}
		if ( ! isNaN( Number.parseInt( params.offset ) ) ) {
			query.query( 'offset', Number.parseInt( params.offset ) );
		}

		new Promise( res => res( query ) )
		.tap( query => {
			// Gets a list of IDs of desired org unit.
			if ( parseInt( params.orgUnit ) ) {
				let id = parseInt( params.orgUnit );
				const OrgUnit = require( '../models/org-unit' );

				return new OrgUnit({ id: id })
				.fetch({ require: true })
				.catch( err => {
					throw new UserError( 'Org unit not found', 404, err );
				})
				.then( unit => {
					return unit.getChildren();
				})
				.then( units => {
					let ids = units.map( u => u.id ).concat( id );
					query.query( 'whereIn', 'orgUnit', ids );
				});
			}
		})
		.then( query => {
			query
			.fetchAll()
			.then( users => {
				res.json( users.toJSON() );
			});
		})
		.catch( err => UserError.catch( err, next, 'List failed' ) );
	}
);


/**
 * Gets user data, optionally with private info.
 */
router.get( '/:id',
	token.validate(),
	parseID,
	// Checks membership expiration for private query.
	( req, res, next ) => {
		let showPrivate = normalizeBool( req.query.private );
		if ( showPrivate ) {
			new User({ id: req.token.get( 'user' ) })
			.fetch({ require: true })
			.catch( err => next( new UserError( 'User not found', err, 500 ) ) )
			.then( user => {
				req.user = user;
				token.expired( req, res, next );
			});
		} else {
			next();
		}
	},
	( req, res, next ) => {

		let showPrivate = normalizeBool( req.query.private );
		let showOffices = normalizeBool( req.query.offices );

		let withRelated = [ 'orgUnit' ];
		if ( showOffices ) {
			withRelated.push( 'offices' );
		}

		new User( req.id )
		.fetch({
			require: true,
			withRelated
		})
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		})
		.tap( user => {
			if ( req.token.get( 'user' ) === user.id ) {
				showPrivate = true;
			} else if ( showPrivate ) {
				return perm
				.hasOverUser( user, 'user_read_private', req.token.get( 'user' ) )
				.catch( err => {
					// If the check fails, just don't show private data.
					showPrivate = false;
				});
			}
		})
		.tap( user => {
			if ( ! showOffices ) {
				return;
			}

			user.related( 'offices' ).each( o => o.show() );
		})
		.then( user => {
			user.show();
			user.showPrivate = showPrivate;
			return user.toJSON();
		})
		.then( user => {
			if ( ! normalizeBool( req.query.children ) || ! user.offices ) {
				return user;
			}
			const OrgUnit = require( '../models/org-unit' );
			return Promise.map( user.offices, office => {
				return new OrgUnit({ id: office.parentOrgID })
				.fetch({ require: true })
				.tap( unit => {
					office.unit = unit.toJSON();
					return unit.getChildren()
					.then( children => {
						office.children = children.pluck( 'id' );
					});
				})
				.then( () => office );
			})
			.then( offices => {
				user.offices = offices;
				return user;
			});
		})
		.then( user => res.json( user ) )
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Updates a user.
 */
router.put( '/:id',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {
		let body = req.body;
		const validate = require( '../helpers/validation' );
		let constraints = {
			firstName: { length: { minimum: 1 } },
			lastName: { length: { minimum: 1 } },
			nickname: { isString: true },
			address: { isString: true },
			email: { email: true }
		};

		// Attribute validation.
		let attrPromise = validate.async( body, constraints )
		.catch( errs => {
			throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
		})
		.then( attributes => {
			if ( _.isEmpty( attributes ) ) {
				throw new UserError( 'No data provided', 400 );
			}
			return attributes;
		});

		var userJSON;

		// User checking.
		let userPromise = new User( req.id )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		})
		.tap( user => {
			userJSON = user.toJSON();
			if ( req.token.get( 'user' ) === user.id ) {
				return;
			} else {
				return perm.hasOverUser( user, 'user_update', req.token.get( 'user' ) );
			}
		});

		// If both check out, update and display.
		Promise.join(
			attrPromise,
			userPromise,
			( attributes, user ) => {
				return user.save( attributes );
			}
		)
		.tap( user => audit( req, 'Updated user data', user, {}, userJSON ) )
		.then( user => {
			user.show();
			user.showPrivate = true;
			res.json( user.toJSON() );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Updates user chapter assignment.
 */
router.put( '/:id/assign/:chapter(\\d+)',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {
		const OrgUnit = require( '../models/org-unit' );

		// Get the user.
		let userQuery = new User( req.id )
		.fetch({
			require: true,
			withRelated: 'orgUnit'
		})
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		});

		// Get the target org unit.
		let orgQuery = new OrgUnit({ id: req.params.chapter })
		.fetch({
			require: true
		})
		.catch( err => {
			throw new UserError( 'Chapter not found', 404, err );
		})
		.then( unit => {
			if ( 'Chapter' !== unit.get( 'type' ) ) {
				throw new UserError( 'Assigning to non-chapter' );
			}
			return unit;
		});

		Promise.join( userQuery, orgQuery, ( user, org ) => {

			// Wasting everyone's time here.
			if ( user.get( 'orgUnit' ) === org.id ) {
				throw new UserError( 'User already member of chapter' );
			}

			user.targetChapter = org;
			return user;
		})
		.tap( user => {
			let curOrg = user.related( 'orgUnit' );

			// If the user is trying to move themselves.
			if ( req.token.get( 'user' ) === user.id ) {

				// If the user is assigned to National or nothing, go right ahead.
				if ( ! user.has( 'orgUnit' ) || 1 === curOrg.id ) {
					return;
				}

				// If the current org unit is a chapter,
				// the user can't do this!
				if ( 'Chapter' === curOrg.get( 'type' ) ) {
					throw new UserError( 'Cannot leave chapter', 403 );
				}

				// Otherwise, check if the chapter is under the current org unit.
				return user.targetChapter
				.isChild( curOrg )
				.then( result => {
					if ( ! result ) {
						throw new UserError( 'Chapter not under current region', 403 );
					}
				});
			}
			// Otherwise, check permissions.
			else {
				return perm.prefetch( req.token.get( 'user' ) )
				.then( offices => {
					return Promise.any([
						perm.hasOverUser( user, 'user_assign', offices ),
						perm.hasOverUnit( user.targetChapter, 'user_assign', offices )
					]);
				});
			}
		})
		.tap( user => audit( req, 'Updated user chapter', user, { curOrg: user.get( 'orgUnit' ) } ) )
		.then( user => {
			// Validation passed, move the user now.
			user
			.save({ orgUnit: user.targetChapter.id }, { patch: true })
			.then( user => {
				res.json({ success: true });
			});
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Sets a user to be suspended or not.
 */
router.put( '/:id/suspend',
	token.parse(),
	token.expired,
	parseID,
	( req, res, next ) => {
		new User( req.id )
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		})
		.tap( user => perm.hasOverUser( user, 'user_suspend', req.token.get( 'user' ) ) )
		.then( user => {
			let status = 'Suspended';
			if ( normalizeBool( req.query.restore ) ) {
				status = 'Full'; // We're assuming the user isn't a Trial member.
			}
			return user.save( { membershipType: status }, { patch: true } );
		})
		.tap( user => audit( req, 'Suspended user', user ) )
		.then( user => {
			user.show();
			user.showPrivate = true;
			res.json( user.toJSON() );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Updates a user based off the Portal changing.
 */
router.post( '/portal',
	network.internal,
	( req, res, next ) => {
		if ( ! _.has( req, 'body.changes' ) || ! _.has( req, 'body.id' ) ) {
			return next( new UserError( 'Invalid POST', 400 ) );
		}
		let changes = req.body.changes;
		return new User({ portalID: req.body.id })
		.fetch()
		.then( query => {
			let member = query || new User({ portalID: req.body.id });
			let expiration = changes.membership_expiration.date;
			return member.save({
				membershipNumber: changes.membership_number,
				firstName: changes.firstname,
				lastName: changes.lastname,
				nickname: changes.nickname,
				email: changes.email,
				address: `${changes.address}\n${changes.city}, ${changes.state} ${changes.zip}`,
				membershipExpiration: Moment( expiration ).format( 'YYYY-MM-DD' ),
				membershipType: changes.type
			});
		})
		.then( member => member.refresh() )
		.then( member => {
			member.show();
			member.showPrivate = true;
			res.json( member.toJSON() );
		});
	}
);


/**
 * Shows a user's private information. Internal only.
 */
router.get( '/:id/internal',
	network.internal,
	( req, res, next ) => {
		let query;
		let id = req.params.id;
		if ( ! id ) {
			return next( new UserError( 'No ID provided', 400 ) );
		} else if ( -1 !== id.search( /^[a-z]{2}\d{10}$/i ) ) {
			query = { membershipNumber: id.toUpperCase() };
		} else if ( Number.parseInt( id ) ) {
			query = { id: Number.parseInt( id ) };
		}

		return new User( query )
		.fetch({ require: true, withRelated: [ 'orgUnit', 'offices' ] })
		.catch( err => {
			throw new UserError( 'User not found', 404, err );
		})
		.then( user => {
			user.show();
			user.showPrivate = true;
			return res.json( user.toJSON() );
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
	} else if ( -1 !== id.search( /^[a-z]{2}\d{10}$/i ) ) {
		req.id = { membershipNumber: id.toUpperCase() };
		next();
	} else if ( Number.parseInt( id ) ) {
		req.id = { id: Number.parseInt( id ) };
		next();
	} else if ( 'me' === id ) {
		req.id = { id: req.token.get( 'user' ).id };
		console.log('getting user for me!');
		console.log(req.id);
		next();
	} else {
		next( new UserError( 'Invalid ID provided', 400 ) );
	}
}


module.exports = router;
