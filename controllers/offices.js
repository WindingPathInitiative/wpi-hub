'use strict';

/**
 * Office routes.
 */

const router    = require( 'express' ).Router();
const token     = require( '../middlewares/token' );
const network   = require( '../middlewares/network' );
const Office    = require( '../models/office' );
const Users     = require( '../models/user' );
const UserError = require( '../helpers/errors' );
const _         = require( 'lodash' );
const Promise   = require( 'bluebird' );
const perm      = require( '../helpers/permissions' );


/**
 * Gets an office by ID.
 */
router.get( '/:id(\\d+)',
	token.validate(),
	( req, res, next ) => {
		new Office({ id: req.params.id })
		.fetch({
			withRelated: [ 'parentOffice', 'orgUnit', 'user' ],
			require: true
		})
		.catch( err => {
			throw new UserError( 'Office not found', 404, err );
		})
		.tap( office => {
			return Promise.join(
				office.getParents(),
				office.getChildren(),
				( parents, children ) => {
					parents = parents.toArray();
					children = children.toArray();
					let filter = o => office.id === o.id;
					_.remove( parents, filter );
					_.remove( children, filter );
					office.set( 'parents', parents );
					office.set( 'children', children );
				}
			);
		})
		.then( office => {
			office.unset([ 'userID', 'parentOrgID', 'parentOfficeID', 'parentPath' ]);
			office.show();
			res.json( office.toJSON() );
		})
		.catch( err => {
			next( err );
		});
	}
);

/**
 * Gets the current user offices.
 */
router.get( '/internal',
	network.internal,
	token.validate(),
	( req, res, next ) => {
		new Office()
		.where( 'userID', '=', req.token.get( 'user' ) )
		.fetchAll()
		.then( offices => {
			offices.each( o => o.show() );
			res.json( offices.toJSON() );
		})
		.catch( err => {
			next( err );
		});
	}
);

/**
 * Assigns a user to an office, or vacates it.
 */
router.put( '/:id(\\d+)/assign/:user(\\d+)',
	token.validate(),
	( req, res, next ) => {

		var curUser = req.token.get( 'user' );
		var userID  = Number.parseInt( req.params.user );

		let officeQuery, userQuery;

		officeQuery = new Office({ id: req.params.id })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Office not found', 404, err );
		});

		if ( userID ) {
			userQuery = new Users({ id: userID })
			.fetch({
				require: true
			})
			.catch( err => {
				throw new UserError( 'User not found', 404, err );
			});
		} else {
			userQuery = false;
		}

		Promise.join( officeQuery, userQuery, ( office, user ) => {
			return office;
		})
		.tap( office => {

			// Sanity check.
			if ( office.get( 'userID' ) === userID ) {
				if ( userID ) {
					throw new UserError( 'User already officer' );
				} else {
					throw new UserError( 'Office already vacant' );
				}
			}

			// If the office belongs to the current user and they are quitting.
			if (
				curUser === office.get( 'userID' ) &&
				0 === office.user
			) {
				return;
			}
			// Check if we're a parent office.
			else {
				return perm.hasOverOffice( office, 'office_assign', curUser );
			}
		})
		.then( office => {

			// Let's change the officer now.
			office
			.save({ userID: userID }, { patch: true })
			.then( user => {
				res.json({ success: true });
			});
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 403, err ) );
			}
		});
	}
);


/**
 * Updates an office.
 */
router.put( '/:id(\\d+)',
	token.validate(),
	( req, res, next ) => {
		if ( _.isEmpty( req.body ) ) {
			return next( new UserError( 'No data provided', 400 ) );
		}

		new Office({ id: req.params.id })
		.fetch({
			require: true
		})
		.catch( err => {
			throw new UserError( 'Office not found', 404, err );
		})
		.tap( office => {
			return perm.hasOverOffice( office, 'office_update', req.token.get( 'user' ) );
		})
		.then( office => {
			const validate = require( '../helpers/validation' );
			let constraints = {
				name: { length: { minimum: 1 } },
				email: { email: true },
				roles: { isArray: true }
			};
			return validate.async( req.body, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			})
			.then( attributes => {
				return office.save( attributes );
			});
		})
		.then( office => {
			office.show();
			res.json( office.toJSON() );
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 403, err ) );
			}
		});
	}
);


/**
 * Creates an assistant office.
 */
router.post( '/:id(\\d+)/assistant',
	token.validate(),
	( req, res, next ) => {
		if ( _.isEmpty( req.body ) ) {
			return next( new UserError( 'No data provided', 400 ) );
		}

		new Office({ id: req.params.id })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Parent office not found', 404, err );
		})
		// Check for permissions.
		.tap( office => {
			return perm.prefetch( req.token.get( 'user' ) )
			.then( offices => {
				// If we're creating our own assistant, check that.
				let self = offices.filter( o => o.id === parseInt( req.params.id ) );
				if ( self.length ) {
					return perm.has( 'office_create_own_assistants', offices );
				}
				// Otherwise, make sure we're over the office.
				return perm.hasOverOffice(
					office,
					'office_create_assistants',
					offices
				);
			});
		})
		.then( office => {
			const validate = require( '../helpers/validation' );
			let constraints = {
				name: { length: { minimum: 1 }, presence: true },
				email: { email: true },
				roles: { isArray: true }
			};
			return validate.async( req.body, constraints )
			.tap( attributes => {
				if ( _.difference( attributes.roles, office.get( 'roles' ) ).length ) {
					throw new Error( 'role not in parent office' );
				}
			})
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			})
			.then( attributes => {
				attributes.type = 'Assistant';
				attributes.parentOfficeID = office.get( 'parentOfficeID' ) || office.id;
				attributes.parentPath = office.get( 'parentPath' ) + '.';
				attributes.parentOrgID = office.get( 'parentOrgID' );
				return attributes;
			});
		})
		.then( attributes => new Office( attributes ).insertWithPath() )
		.then( office => {
			office.show();
			res.json( office.toJSON() );
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 403, err ) );
			}
		});
	}
);


router.delete( '/:id(\\d+)/assistant',
	token.validate(),
	( req, res, next ) => {
		new Office({ id: req.params.id })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Parent office not found', 404, err );
		})
		// We're an assistant, right?
		.tap( office => {
			if ( 'Assistant' !== office.get( 'type' ) ) {
				throw new UserError( 'Office is not an assistant', 400 );
			}
		})
		// Check for permissions.
		.tap( office => {
			return perm.hasOverOffice(
				office,
				[ 'office_create_assistants', 'office_create_own_assistants' ],
				req.token.get( 'user' )
			);
		})
		.then( office => {
			return office.destroy();
		})
		.then( () => {
			res.json({ success: true });
		})
		.catch( err => {
			if ( err instanceof UserError ) {
				next( err );
			} else {
				next( new UserError( 'Authentication failed', 403, err ) );
			}
		});
	}
);

module.exports = router;
