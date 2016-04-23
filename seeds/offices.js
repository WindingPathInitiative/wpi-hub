'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'offices' ).del(),

		// Inserts seed entries
		knex( 'offices' ).insert([
			{
				id: 1,
				name: 'National Coordinator',
				type: 'Primary',
				email: 'nc@mindseyesociety.org',
				parentOrgID: 1,
				userID: 2,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants', 'org_create_domain' ])
			},
			{
				id: 2,
				name: 'Regional Coordinator',
				type: 'Primary',
				parentOrgID: 2,
				userID: 3,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				id: 3,
				name: 'DST',
				type: 'Primary',
				parentOrgID: 3,
				userID: 4
			},
			{
				id: 4,
				name: 'aDST Vacant',
				type: 'Assistant',
				parentOfficeID: 3,
				parentOrgID: 3,
				userID: null
			},
			{
				name: 'DC',
				type: 'Primary',
				parentOrgID: 3,
				userID: 8,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				name: 'Admin',
				type: 'Other',
				parentOrgID: 1,
				userID: 1,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'org_create_region', 'org_create_domain', 'office_update', 'office_assign', 'office_create_assistants' ])
			}
		])
	);
};
