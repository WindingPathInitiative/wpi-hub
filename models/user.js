'use strict';

/**
 * User model.
 *
 * Stores information about an individual member, with an eye for
 * abstracting this infromation out in the future.
 */
const bookshelf = require( '../helpers/db' ).Bookshelf;
const _         = require( 'lodash' );
const Base      = require( './base' );

module.exports = bookshelf.model( 'User', Base.extend({
	tableName: 'users',

	publicAttrs: [
		'id',
		'membershipNumber',
		'firstName',
		'lastName',
		'nickname',
		'fullName',
		'membershipType',
		'membershipExpiration'
	],

	initialize: function( attrs, options ) {
		this.on( 'saving', this.saving );
	},

	parse: function( attrs ) {
		attrs.fullName = attrs.firstName + ' ' + attrs.lastName;
		return attrs;
	},

	saving: function( model, attrs, options ) {
		console.log('saving user');
		if(model.has('sub')){ // Convert from Cognito data format
			model.set('portalID', model.get('sub'));
			var name = model.get('name');
			var nameSplit = name.lastIndexOf(' ');
			if(nameSplit!=-1){
				model.set('firstname',name.slice(0,nameSplit));
				model.set('lastname',name.slice(nameSplit+1,name.length));
			}else model.set('firstname',name);
			
			console.log('cognito address', model.get('address'));
			var addressformat = model.get('address');
			if(addressformat.formatted){
				var address = JSON.parse(addressformat.formatted);
				if(address){
					model.set('address', address['street_address'] + ', '
						+ address['locality']+', ' + address['region'] + ' '
						+ address['postal_code'] + ', ' + address['country']);
				}
			}
			model.set('membershipType','None');
			model.set('membershipNumber','');
			model.set('membershipExpiration','0000-00-00');
			
			model.unset(['aud','auth_time','birthdate','cognito:username','email_verified', 'event_id','exp','iat','iss','name','sub','token_use']);
		}
		if ( ! model.has( 'email' ) ) {
			model.set( 'email', model.get( 'emailAddress' ) );
		}
		if ( ! model.has( 'portalID' ) && model.has( 'remoteId' ) ) {
			model.set( 'portalID', model.get( 'remoteId' ) );
		}
		model.unset([ 'emailAddress', 'remoteId', 'affiliateId', 'affiliateName', 'fullName' ]);
	},

	serialize: function( options ) {
		let attrs = Base.prototype.serialize.apply( this, arguments );
		if ( ! this.showPrivate ) {
			attrs = _.omit( attrs, [ 'email', 'address' ] );
		}
		delete attrs.portalID;
		return attrs;
	},

	orgUnit: function() {
		return this.belongsTo( 'OrgUnit', 'orgUnit' );
	},

	offices: function() {
		return this.hasMany( 'Office', 'userID' );
	},

	makeToken: function() {
		let Token = bookshelf.model( 'Token' );
		return new Token({ user: this.id }).save();
	}
}, {
	getByPortalId: function( id ) {
		if ( ! id ) {
			throw new Error( 'No Portal ID provided' );
		}
		return new this({ portalID: id }).fetch();
	}
}) );
