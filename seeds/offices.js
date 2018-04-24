'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'offices' ).del(),

		// Inserts seed entries
		knex( 'offices' ).insert([
			{
				id: 1,
				name: 'Club Manager',
				type: 'Primary',
				email: 'club.manager@windingpath.club',
				parentOrgID: 1,
				parentPath: '1',
				userID: 2,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'user_suspend', 'org_update', 'office_update', 'office_assign', 'office_create_assistants',
				'office_create_own_assistants', 'org_create_chapter', 'org_create_venue' ])
			},
			{
				id: 2,
				name: 'Creative Director',
				type: 'Assistant',
				email: 'creative.director@windingpath.club',
				parentOrgID: 1,
				parentOfficeID: 1,
				parentPath: '1.2',
				userID: 1,
				roles: JSON.stringify([ 'user_read_private', 'office_create_assistants', 'office_create_own_assistants' ])
			},
			{
				id: 5,
				name: 'Chapter Owner',
				type: 'Primary',
				parentOrgID: 2,
				parentOfficeID: 1,
				parentPath: '1.5',
				userID: 3,
				roles: JSON.stringify([ 'user_read_private', 'user_update', 'user_assign', 'org_update', 'office_update', 'office_assign', 'office_create_assistants', 'org_create_venue' ])
			}
		])
	);
};
