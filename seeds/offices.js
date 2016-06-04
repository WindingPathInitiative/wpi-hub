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
				name: 'Regional Coordinator',
				type: 'Primary',
				parentOrgID: 2,
				parentPath: '1.2',
				userID: 3,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				id: 3,
				name: 'DST',
				type: 'Primary',
				parentOrgID: 3,
				parentPath: '3',
				userID: 4
			},
			{
				id: 4,
				name: 'aDST Vacant',
				type: 'Assistant',
				parentOfficeID: 3,
				parentPath: '3.4',
				parentOrgID: 3,
				userID: null
			},
			{
				id: 5,
				name: 'DC',
				type: 'Primary',
				parentOrgID: 3,
				parentPath: '1.2.5',
				userID: 8,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				id: 6,
				name: 'Admin',
				type: 'Primary',
				parentOrgID: 1,
				parentPath: '6',
				userID: 1,
				roles: JSON.stringify([ 'admin' ])
			}
		])
	);
};
