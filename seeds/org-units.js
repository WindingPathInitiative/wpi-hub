'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'org_units' ).del(),

		// Inserts seed entries
		knex( 'org_units' ).insert([
			{
				id: 1,
				name: 'United States',
				code: 'US',
				website: 'https://wpi.club',
				type: 'Nation',
				parentPath: '1'
			},
			{
				id: 2,
				name: 'Role Initiative Philadelphia',
				code: 'PA-001',
				type: 'Domain',
				website: 'https://phillylarp.com/',
				location: 'Philadelphia, PA',
				defDoc: 'City of Philadelphia and metropolitan area, New Jersey',
				parentPath: '1.2'
			}
		])
	);
};
