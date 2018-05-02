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
const moment   = require( 'moment' );

const organizations = require( '../config/organizations.json' );

module.exports = bookshelf.model( 'User', Base.extend({
	tableName: 'users',

	publicAttrs: [
		'id',
		'membershipNumber',
		'nickname',
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
			if(!model.has('membershipType')){ //set the defaults
				model.set('membershipType','None');
				model.set('membershipNumber','');
				model.set('membershipExpiration','0000-00-00');
			}

			if(!model.has('nickname')) model.set('nickname',model.get('firstName')+' '+model.get('lastName'));
			
			model.unset(['aud','auth_time','birthdate','cognito:username', 'custom:preferred_name','email_verified', 'event_id','exp','iat','iss','name','sub','token_use']);
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
	},
	prepareApproveMember: async function(organizationId){
		let attributes = {};
		console.log('organizationId',organizationId);
		console.log('organizations',organizations);
		//let's get the org we're making a number for
		if(organizations==null || organizations.length == 0) throw new Error("Cannot find organizations to generate member number");
		
		let organization = null;
		if(!organizationId){
			if(organizations.length>1) throw new Error("No organization ID provided");
			else organization = organizations[0];
		}else{
			for(let i = 0; i < organizations.length; i++){
				if(organizations[i].id == organizationId){
					organization = organizations[i];
					break;
				}
			}
		}
		if(organization == null) throw new Error("Organization not found");
		attributes.membershipNumber = await this.makeMembershipNumber(organization);
		if(organization.hasOwnProperty('approvalState')) attributes.membershipType=organization.approvalState;
		let membershipExpiration = moment(new Date());
		if(organization.hasOwnProperty('initialMembershipLength')){
			let initialDuration = moment.duration(organization.initialMembershipLength);
			membershipExpiration.add(initialDuration);
		}
		attributes.membershipExpiration=membershipExpiration.format();  
		return attributes;
	},
	makeMembershipNumber: async function(organization){
		
		if(!organization.hasOwnProperty('numberFormat')) throw new Error('No number format definition for organization');
		let tries = 0;
		let finishedMembershipNumber = null;
		let membershipNumber ='';
		let numberFormat = organization.numberFormat;
		let date = new Date();
		while(!finishedMembershipNumber && tries < 20){
			membershipNumber = '';
			for(let i = 0; i < numberFormat.length; i++){
				switch(numberFormat[i].type){
					case 'string':
						membershipNumber+=numberFormat[i].value;
						break;
					case 'year':
						let year = String(date.getFullYear());
						if(numberFormat[i]['length']){
							if(numberFormat[i]['length'] < 4){
								year = year.slice(4-numberFormat[i]['length']);
							}else if(numberFormat[i]['length'] > 4){
								year = _.padStart(year,numberFormat[i]['length'],'0');
							}
						}
						membershipNumber+=year;
						break;
					case 'month':
						let month = String(parseInt(date.getMonth())+1);
						if(numberFormat[i]['length']){
							if(numberFormat[i]['length'] < month.length){
								month = month.slice(month.length-numberFormat[i]['length']);
							}else if(numberFormat[i]['length'] > month.length){
								month = _.padStart(month,numberFormat[i]['length'],'0');
							}
						}
						membershipNumber+=month;
						break;
					case 'max':
						//we need to find the current max from the database and add 1
						let maxString ='';
						let maxNumber=1;
						let maxuser = await this.query(
							(qb) => {
								qb.where('membershipNumber', 'LIKE', membershipNumber+'%')
								.orderByRaw('CAST(SUBSTRING(membershipNumber,'+(membershipNumber.length+1)+') as unsigned) desc');
							}
						)
						.fetch({});
						if(maxuser){ //we have a matching user, grab it and increment
							console.log('max user found', maxuser);
							maxString = String(maxuser.get('membershipNumber')).slice(membershipNumber.length);
							if(isNaN(maxString)) throw new Error('Membership max found is not valid number');
							maxNumber = parseInt(maxString)+1;
						}
						maxString = String(maxNumber);
						maxString = _.padStart(maxString,numberFormat[i]['length'],0);
						console.log('maxString',maxString);
						membershipNumber += maxString;
						break;
				}
			}
			finishedMembershipNumber = membershipNumber;
		}
		if(!finishedMembershipNumber) throw new Error('Unable to generate membership number');
		return finishedMembershipNumber;
	}
}) );
