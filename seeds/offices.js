'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'offices' ).del(),

		// Inserts seed entries
		knex( 'offices' ).insert([
			{
				id: 1,
				name: 'Community Manager',
				type: 'Primary',
				email: 'community.manager@wpi.club',
				parentOrgID: 1,
				parentPath: '1',
				userID: 2,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'user_suspend', 'org_update', 'office_update', 'office_assign', 'office_create_assistants',
				'office_create_own_assistants', 'org_create_domain' ])
			},
			{
				id: 2,
				name: 'Creative Director',
				type: 'Primary',
				email: 'creative.director@wpi.club',
				parentOrgID: 1,
				parentPath: '2',
				userID: 1,
				roles: JSON.stringify([ 'user_read_private', 'office_assign', 'office_create_assistants', 'office_create_own_assistants', 'office_update' ])
			},
			{
				id: 5,
				name: 'Chapter Owner',
				type: 'Primary',
				parentOrgID: 2,
				parentOfficeID: 1,
				parentPath: '1.5',
				userID: 3,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants' ])
			},
			{
				id: 6,
				name: 'Chapter Storyteller',
				type: 'Primary',
				parentOrgID: 2,
				parentOfficeID: 2,
				parentPath: '2.6',
				userID: 3
			},
		])
	);
};
