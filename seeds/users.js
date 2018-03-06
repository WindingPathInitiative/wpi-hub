'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'users' ).del(),

		// Inserts seed entries
		knex( 'users' ).insert([
			{
				id: 1,
				portalID: '69dfb3c2-d61d-49da-b8b0-98b18ef18a54',
				firstName: 'Joe',
				lastName: 'Terranova',
				email: 'joeterranova@gmail.com',
				membershipType: 'Full',
				membershipNumber: 'WPI2018020001',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			},
			{
				id: 2,
				firstName: 'Jeremy',
				lastName: 'White',
				email: 'smackhammer@gmail.com',
				membershipType: 'Full',
				membershipNumber: 'WPI2018020002',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			},
			{
				id: 3,
				firstName: 'Jaclyn',
				lastName: 'Terranova',
				email: 'jaclyn.terranova@gmail.com ',
				membershipType: 'Full',
				membershipNumber: 'WPI2018020003',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			}
		])
	);
};
