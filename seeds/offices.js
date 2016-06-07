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
				parentPath: '1',
				userID: 2,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants',
				'office_create_own_assistants', 'org_create_domain' ])
			},
			{
				id: 2,
				name: 'National Storyteller',
				type: 'Primary',
				email: 'nst@mindseyesociety.org',
				parentOrgID: 1,
				parentPath: '2',
				roles: JSON.stringify([ 'user_read_private', 'office_assign', 'office_create_assistants', 'office_create_own_assistants', 'office_update' ])
			},
			{
				id: 3,
				name: 'Regional Coordinator',
				type: 'Primary',
				parentOrgID: 2,
				parentPath: '1.3',
				userID: 3,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				id: 4,
				name: 'Regional Storyteller',
				type: 'Primary',
				parentOrgID: 2,
				parentPath: '2.4',
				roles: JSON.stringify([ 'user_read_private', 'office_assign', 'office_create_assistants', 'office_create_own_assistants', 'office_update' ])
			},
			{
				id: 5,
				name: 'DST',
				type: 'Primary',
				parentOrgID: 3,
				parentPath: '2.4.5',
				userID: 4
			},
			{
				id: 6,
				name: 'aDST Vacant',
				type: 'Assistant',
				parentOfficeID: 5,
				parentPath: '2.4.5.6',
				parentOrgID: 3,
				userID: null
			},
			{
				id: 7,
				name: 'DC',
				type: 'Primary',
				parentOrgID: 3,
				parentPath: '1.3.7',
				userID: 8,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				id: 8,
				name: 'Admin',
				type: 'Primary',
				parentOrgID: 1,
				parentPath: '8',
				userID: 1,
				roles: JSON.stringify([ 'admin' ])
			},
			{
				id: 9,
				name: 'aRC Membership',
				type: 'Assistant',
				parentOrgID: 2,
				parentPath: '1.3.9',
				parentOfficeID: 3,
				userID: 10,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'office_create_own_assistants' ])
			}
		])
	);
};
