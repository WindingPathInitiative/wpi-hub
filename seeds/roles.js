'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'roles' ).del(),

		// Inserts seed entries
		knex( 'roles' ).insert([
			{
				name: 'Read private user data',
				slug: 'user_read_private'
			},
			{
				name: 'Change user data',
				slug: 'user_update'
			},
			{
				name: 'Change user location',
				slug: 'user_assign'
			},
			{
				name: 'Change unit information',
				slug: 'org_update'
			},
			{
				name: 'Create or delete a region',
				slug: 'org_create_region'
			},
			{
				name: 'Create or delete a domain',
				slug: 'org_create_domain'
			},
			{
				name: 'Create or delete a venue',
				slug: 'org_create_venue'
			},
			{
				name: 'Change office information',
				slug: 'office_update'
			},
			{
				name: 'Assign an officeholder',
				slug: 'office_assign'
			},
			{
				name: 'Hire Assistants',
				slug: 'office_create_assistants'
			},
			{
				name: 'Hire Own Assistants',
				slug: 'office_create_own_assistants'
			}
		])
	);
};
