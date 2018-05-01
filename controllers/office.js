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
const validate  = require( '../helpers/validation' );
const audit     = require( '../helpers/audit' );


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
 * Creates a new office.
 */
router.post( '/',
	token.validate(),
	( req, res, next ) => {
		let constraints = {
			name: { length: { minimum: 1 }, presence: true },
			email: { email: true },
			roles: { isArray: true, presence: true },
			userID: { numericality: { onlyInteger: true, strict: true } }
		};

		perm.hasOverUnit( 1, 'admin', req.token.get( 'user' ) )
		.then( () => {
			return validate.async( req.body, constraints )
			.catch( errs => {
				throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
			});
		})
		.then( attrs => Object.assign( attrs, {
			type: 'Primary',
			parentOrgID: 1,
			parentPath: ''
		}) )
		.then( attrs => new Office().save( attrs ) )
		.then( office => office.save({ parentPath: office.id }, { patch: true }) )
		.then( office => office.refresh() )
		.then( office => {
			office.show();
			res.json( office.toJSON() );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);

/**
 * Gets the current user offices.
 */
router.get( '/me',
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
 * Gets the allowed roles.
 */
router.get( '/roles',
	( req, res, next ) => {
		let roles = require( '../config/roles.json' );
		res.json( roles );
	}
);

/**
 * Assigns a user to an office, or vacates it.
 */
router.put( '/:id(\\d+)/assign/:user(\\d+)',
	token.parse(),
	token.expired,
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
		.tap( office => audit( req, 'Updated user in office', office, { curUser } ) )
		.then( office => {

			// Let's change the officer now.
			office
			.save({ userID: userID }, { patch: true })
			.then( user => {
				res.json({ success: true });
			});
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Updates an office.
 */
router.put( '/:id(\\d+)',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		let attributes  = {}; // Whitelisted attributes.
		let body        = req.body;
		if(body.roles && typeof body.roles ==='string'){
			body.roles = [body.roles];
		}
		let constraints = {
			name: { length: { minimum: 1 } },
			email: { email: true },
			roles: { isArray: true }
		};
		
		let primaryRoles = null;
		let officeRoles = null;

		validate.async( body, constraints )
		.catch( errs => {
			throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
		})
		.then( attr => {
			if ( _.isEmpty( attr ) ) {
				throw new UserError( 'No data provided', 400 );
			}

			attributes = attr;
		})
		.then( () => {
			//get the office we're editing
			return new Office({ id: req.params.id })
			.fetch({
				require: true
			})
			.catch( err => {
				throw new UserError( 'Office not found', 404, err );
			});
		})
		.tap( office => {
			//get the office we're editing with
			return perm.hasOverOffice( office, 'office_update', req.token.get( 'user' ) )
				.tap((usingOffice) => {
					//get the roles for the office we're using to edit
					officeRoles = usingOffice[0].get('roles');
				});
		}).tap( office => {
			if(!body.roles) return false;
			//Get the parent office if this is an assistant
			if(office.parentOfficeID){
				return new Office({ id: req.params.id })
				.fetch({
						require: true
					})
				.then( (parentOffice) => { primaryRoles = parentOffice.get('roles')});
			}else return false;
		}).tap(office => {
			if(!body.roles) return false;
			//check to make sure the roles we're setting are kosher
			return perm.checkOfficeRoles(body.roles, officeRoles,office.get('roles'),primaryRoles);
		})
		.tap( office => audit( req, 'Updated office', office, {}, office.toJSON() ) )
		.then( office => office.save( attributes ) )
		.then( office => {
			office.show();
			res.json( office.toJSON() );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Creates an assistant office.
 */
router.post( '/:id(\\d+)/assistant',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		let attributes  = {}; // Whitelisted attributes.
		let body        = req.body;
		let constraints = {
			name: { length: { minimum: 1 }, presence: true },
			email: { email: true },
			roles: { isArray: true }
		};

		validate.async( body, constraints )
		.catch( errs => {
			throw new UserError( 'Invalid data provided: ' + validate.format( errs ), 400 );
		})
		.then( attrs => {
			if ( _.isEmpty( attrs ) ) {
				throw new UserError( 'No data provided', 400 );
			}

			attributes = attrs;
		})
		.then( () => {
			return new Office({ id: req.params.id })
			.fetch({ require: true })
			.catch( err => {
				throw new UserError( 'Parent office not found', 404, err );
			});
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
		// Make sure the roles are kosher.
		.tap( office => {
			if ( _.difference( attributes.roles, office.get( 'roles' ) ).length ) {
				throw new UserError( 'Role not in parent office', 400 );
			}
		})
		// Configures the attributes.
		.then( office => {
			attributes.type = 'Assistant';
			attributes.parentOfficeID = office.get( 'parentOfficeID' ) || office.id;
			attributes.parentPath = office.get( 'parentPath' ) + '.';
			attributes.parentOrgID = office.get( 'parentOrgID' );
			return attributes;
		})
		// Create and show.
		.then( attributes => new Office( attributes ).insertWithPath() )
		.tap( office => audit( req, 'Created assistant office', office, { parent: req.params.id } ) )
		.then( office => {
			office.show();
			res.json( office.toJSON() );
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Deletes an assistant office.
 */
router.delete( '/:id(\\d+)/assistant',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		new Office({ id: req.params.id })
		.fetch({ require: true })
		.catch( err => {
			throw new UserError( 'Office not found', 404, err );
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
		.tap( office => audit( req, 'Deleted assistant office', office, {}, office.toJSON() ) )
		.then( office => {
			return office.destroy();
		})
		.then( () => {
			res.json({ success: true });
		})
		.catch( err => UserError.catch( err, next ) );
	}
);


/**
 * Verifies a user is an officer over a given Org Unit.
 * Internal only.
 */
router.get( '/verify/orgunit/:unit(\\d+)',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		if ( ! req.query.roles ) {
			return next( new UserError( 'Missing required "roles" param', 400 ) );
		}
		let roles = req.query.roles.split( ',' );
		perm.hasOverUnit( Number.parseInt( req.params.unit ), roles, req.token.get( 'user' ) )
		.then( offices => res.json({ success: true, offices }) )
		.catch( err => next( new UserError( err.message, 403 ) ) );
	}
);


/**
 * Verifies a user is an officer over a given user.
 * Internal only.
 */
router.get( '/verify/user/:user(\\d+)',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		if ( ! req.query.roles ) {
			return next( new UserError( 'Missing required "roles" param', 400 ) );
		}
		let roles = req.query.roles.split( ',' );
		perm.hasOverUser( Number.parseInt( req.params.user ), roles, req.token.get( 'user' ) )
		.then( offices => res.json({ success: true, offices }) )
		.catch( err => next( new UserError( err.message, 403 ) ) );
	}
);


/**
 * Verifies a user is an officer over a given office.
 * Internal only.
 */
router.get( '/verify/office/:office(\\d+)',
	token.parse(),
	token.expired,
	( req, res, next ) => {
		if ( ! req.query.roles ) {
			return next( new UserError( 'Missing required "roles" param', 400 ) );
		}
		let roles = req.query.roles.split( ',' );
		perm.hasOverOffice( Number.parseInt( req.params.office ), roles, req.token.get( 'user' ) )
		.then( offices => res.json({ success: true, offices }) )
		.catch( err => next( new UserError( err.message, 403 ) ) );
	}
);


module.exports = router;
