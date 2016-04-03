'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'users' ).del(),

		// Inserts seed entries
		knex( 'users' ).insert({
			id: 1,
			firstName: 'Test',
			lastName: 'Admin',
			email: 'admin@test.com',
			membershipType: 'Full',
			membershipNumber: 'US2016010001',
			membershipExpiration: '2020-01-01',
			orgUnit: 7
		}),
		knex( 'users' ).insert({
			id: 2,
			firstName: 'Test',
			lastName: 'NC',
			email: 'nc@test.com',
			membershipType: 'Full',
			membershipNumber: 'US2016010002',
			membershipExpiration: '2020-01-01',
			orgUnit: 7
		}),
		knex( 'users' ).insert({
			id: 3,
			firstName: 'Test',
			lastName: 'RC',
			email: 'rc@test.com',
			membershipType: 'Full',
			membershipNumber: 'US2016010003',
			membershipExpiration: '2020-01-01',
			orgUnit: 3
		}),
		knex( 'users' ).insert({
			id: 4,
			firstName: 'Test',
			lastName: 'DST',
			email: 'dst@test.com',
			membershipType: 'Full',
			membershipNumber: 'US2016010004',
			membershipExpiration: '2020-01-01',
			orgUnit: 3
		}),
		knex( 'users' ).insert({
			id: 5,
			firstName: 'Test',
			lastName: 'User',
			email: 'test@test.com',
			membershipType: 'Full',
			membershipNumber: 'US2016010005',
			membershipExpiration: '2020-01-01',
			orgUnit: 3
		}),
		knex( 'users' ).insert({
			id: 6,
			firstName: 'Test',
			lastName: 'Expired',
			email: 'expired@test.com',
			membershipType: 'Full',
			membershipNumber: 'US2016010006',
			membershipExpiration: '2000-01-01',
			orgUnit: 3
		}),
		knex( 'users' ).insert({
			id: 7,
			firstName: 'Test',
			lastName: 'Trial',
			email: 'trial@test.com',
			membershipType: 'Trial',
			membershipNumber: 'US2016010007',
			membershipExpiration: '2020-01-01',
			orgUnit: 3
		}),
		knex( 'users' ).insert({
			id: 8,
			portalID: 375,
			firstName: 'Ephraim',
			lastName: 'Gregor',
			email: 'ephraimgregor@gmail.com',
			membershipNumber: 'US2012030038',
			membershipExpiration: '2015-09-05',
			orgUnit: 3
		})
	);
};
