'use strict';

const router = require( 'express' ).Router();
const _      = require( 'lodash' );
const token  = require( '../middlewares/token' );
const User   = require( '../models/user' );

router.get( '/',
	token.parse( false ),
	( req, res ) => {
		let html;

		if ( req.user ) {
			html = `
			<h1>${ req.user.get( 'fullName' ) }!</h1>
			<h2>${ req.user.get( 'membershipNumber' ) }</h2>
			<p>Token: <code>${ req.token.id }</code></p>
			<ul>
				<li><a href="/v1/office/me">My offices</a></li>
				<li><a href="/v1/user/me">My profile</a></li>
				<li><a href="/dev/list/users">List Users</a></li>
				<li><a href="/dev/switch">Switch user</a></li>
				<li><a href="/v1/auth/signout">Log out</a></li>
			</ul>
			`;
		} else {
			html = `<script src="https://code.jquery.com/jquery-2.2.2.min.js"   integrity="sha256-36cp2Co+/62rEAAYHLmRCPIych47CvdM+uTBJwSzWjI="   crossorigin="anonymous"></script>
			<button>Login</button>
			<script>
			$( "button" ).on( "click", function() {
				location.assign( '/v1/auth/signin/test' );
			});
			</script>`;
		}

		res.send( html );
	}
);

router.get( '/switch', ( req, res ) => {
	User.fetchAll()
	.then( users => {
		let html = '<h1>Switch to user:</h1><ul>';
		_.each( users.toJSON(), user => {
			html += `<li><a href="/dev/switch/${ user.id }">${ user.fullName }</a></li>`;
		});
		html += '</ul>';
		res.send( html );
	});
});

router.get( '/switch/:id',
	token.validate(),
	( req, res ) => {
		req.token
		.save( 'user', req.params.id, { patch: true } )
		.then( () => {
			res.redirect( '/dev' );
		});
	}
);

router.get( '/list/users',
	( req, res ) => {
		User.fetchAll()
		.then( users => {
			let html = '<h1>Users</h1><ul>';
			users.each( user => {
				user = user.toJSON();
				html += `<li><a href="/v1/user/${ user.membershipNumber }">${ user.fullName }</a></li>`;
			});
			html += '</li>';
			res.send( html );
		});
	}
);

router.get( '/auth',
	( req, res ) => {
		res.redirect( req.query.redirect_uri + '?code=test' );
	}
);

router.post( '/auth/token',
	( req, res ) => {
		res.json({
			access_token: 'fakeaccesstoken',
			scope: null,
			token_type: 'bearer',
			expires_in: 3600,
			refresh_token: 'fakerefreshtoken'
		});
	}
);

router.get( '/auth/user',
	( req, res ) => {
		res.json({
			remoteId: 375
		});
	}
);

router.get( '/migrate',
	( req, res ) => {
		let config = require( '../config/db.json' );
		config.global.database = 'crd';
		let crd = require( 'knex' )({
			client: 'mysql',
			connection: _.defaults( config.global, { charset: 'utf8' }, config.knex )
		});

		let locationTypes = {
			2: 'Nation',
			3: 'Region',
			4: 'Domain'
		};

		let Promise = require( 'bluebird' );
		let knex = require( '../helpers/db' ).Knex;

		let regionMap = {};
		let codeList  = [];

		knex( 'org_units' ).del()
		.then( () => knex.raw( 'ALTER TABLE org_units AUTO_INCREMENT = 1' ) )
		.then( () => crd.select().from( 'tbl_location' )
			.whereNotIn( 'location_type', [ 1, 2, 5 ] )
			.where( 'id_parent_location', 'like', '1,2%' )
			.leftJoin( 'tbl_loc_www', 'tbl_location.id_location', '=', 'tbl_loc_www.id_location' )
			.leftJoin( 'tbl_loc_address', 'tbl_location.id_location', '=', 'tbl_loc_address.id_location' )
		)
		.then( resp => Promise.filter( resp, row => {
			if ( -1 === codeList.indexOf( row.location_code ) ) {
				codeList.push( row.location_code );
				return true;
			}
			return false;
		}) )
		.then( resp => Promise.map( resp, ( row, index ) => {
			if ( 3 === row.location_type ) {
				regionMap[ row.id_location ] = index + 2;
			}
			return row;
		}) )
		.then( resp => Promise.map( resp, ( row, index ) => {
			let data = {
				id: index + 2,
				name: row.location_name,
				code: row.location_code,
				website: row.site_address,
				type: locationTypes[ row.location_type ],
				parentPath: row.id_parent_location.replace( /,/gi, '.' ),
				defDoc: row.location_bounds
			};

			if ( 'Domain' === data.type ) {
				data.code = data.code.substring( 0, data.code.length - 2 );
			}

			let addrArray = _.filter( [ row.laddr_line_1, row.laddr_line_2, row.laddr_city, row.laddr_state, row.laddr_zip ] );
			if ( addrArray.length ) {
				data.location = addrArray.join( ', ' );
			}

			if ( '1.2' === data.parentPath.substr( 0, 3 ) ) {
				data.parentPath = '1' + data.parentPath.substr( 3 );
			}
			if ( 1 !== data.parentPath.length ) {
				let oldParent = data.parentPath.substr( 2 );
				let newParent = regionMap[ oldParent ];
				data.parentPath = data.parentPath.replace( oldParent, newParent );
			}
			data.parentPath += '.' + data.id;

			return data;
		}) )
		.then( rows => [{
			id: 1,
			name: 'United States',
			type: 'Nation',
			website: 'https://www.mindseyesociety.org',
			code: 'US',
			parentPath: '1'
		}].concat( rows ) )
		.then( rows => knex.insert( rows ).into( 'org_units' ) )
		.then( () => knex.select().from( 'org_units' ) )
		.then( resp => {
			res.json( resp );
		});
	}
);

router.get( '/migrate/vss',
	( req, res ) => {
		let config = require( '../config/db.json' );
		config.global.database = 'apps';
		let apps = require( 'knex' )({
			client: 'mysql',
			connection: _.defaults( config.global, { charset: 'utf8' }, config.knex )
		});
		let Promise = require( 'bluebird' );
		let knex = require( '../helpers/db' ).Knex;

		let venueTypes = {
			9: 'None',
			21: 'VR',
			25: 'WF',
			28: 'MA',
			31: 'CL',
			35: 'VC',
			36: 'AC',
			39: 'NZ',
			37: 'WA',
			38: 'VS'
		};
		let idOffset;

		let appQuery = apps.select([ 'venue_id', 'name', 'domain', 'region', 'vss' ])
		.from( 'vsss' )
		.leftJoin( 'organizations', 'vsss.org_id', '=', 'organizations.id' )
		.whereNot( 'region', 'CAN' )
		.whereNot( 'region', '' )
		.then( resp => Promise.map( resp, row => {
			row.venue = venueTypes[ row.venue_id ];
			if ( row.domain ) {
				row.domain = row.domain.substring( 0, row.domain.length - 2 );
			}
			return _.omit( row, 'venue_id' );
		}) );

		let domainQuery = knex.select([ 'id', 'parentPath', 'code' ]).from( 'org_units' )
		.whereIn( 'type', [ 'Domain', 'Region' ] )
		.then( resp => _.keyBy( resp, 'code' ) );

		Promise.join(
			appQuery,
			domainQuery,
			knex.count( '* as c' ).from( 'org_units' ).first(),
			( vsses, domains, count ) => {
				idOffset = count.c + 1;
				return Promise.map( vsses, row => {

					let parent;
					if ( domains[ row.domain ] ) {
						parent = domains[ row.domain ];
					} else if ( domains[ row.region ] ) {
						parent = domains[ row.region ];
					}

					if ( parent ) {
						row.parentPath = parent.parentPath + '.';
						return _.omit( row, [ 'region', 'domain' ] );
					}
					return null;
				});
			}
		)
		.then( rows => Promise.filter( rows, r => r ) )
		.then( rows => Promise.map( rows, ( row, index ) => ({
			id: index + idOffset,
			name: row.name,
			venueType: row.venue,
			type: 'Venue',
			defDoc: row.vss,
			parentPath: row.parentPath + ( index + idOffset )
		}) ) )
		.then( rows => knex.batchInsert( 'org_units', rows, 10 ) )
		.then( () => knex.select().from( 'org_units' ).where( 'type', 'Venue' ) )
		.then( resp => res.json( resp ) )
		.catch( err => {
			res.json( err );
		});
	}
);

module.exports = router;
