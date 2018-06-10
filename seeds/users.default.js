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
				nickname: 'Joe Terranova',
				email: 'joeterranova@gmail.com',
				membershipType: 'Full',
				membershipNumber: 'WPI20180004',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			},
			{
				id: 2,
				firstName: 'Jeremy',
				lastName: 'White',
				nickname: 'Jeremy White',
				email: 'smackhammer@gmail.com',
				membershipType: 'Full',
				membershipNumber: 'WPI20180002',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			},
			{
				id: 3,
				firstName: 'Jaclyn',
				lastName: 'Terranova',
				nickname: 'Jaclyn Terranova',
				email: 'jaclyn.terranova@gmail.com ',
				membershipType: 'Full',
				membershipNumber: 'WPI20180003',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			},
			{
				id: 4,
				firstName: 'Emily',
				lastName: 'Mentrek',
				nickname: 'Emily Mentrek',
				email: 'emilymentrek@gmail.com ',
				membershipType: 'Full',
				membershipNumber: 'WPI20180006',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			},
			{
				id: 5,
				firstName: 'Sarah',
				lastName: 'Farley',
				nickname: 'Sarah Farley',
				email: 'sarahfarley@gmail.com ',
				membershipType: 'Full',
				membershipNumber: 'WPI20180008',
				membershipExpiration: '2020-01-01',
				orgUnit: 2
			}
		])
	);
};
