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
				website: 'http://mindseyesociety.org',
				type: 'Nation',
				lft: 0,
				rgt: 1000000000
			},
			{
				id: 2,
				name: 'North East',
				code: 'NE',
				type: 'Region',
				lft: 1,
				rgt: 10000000
			},
			{
				id: 3,
				name: 'Children of the Lost Eden',
				code: 'NY-004',
				type: 'Domain',
				website: 'http://www.mesnyc.org',
				location: 'New York, NY',
				defDoc: 'City of New York, NY, Nassau and Suffolk County, Long Island, NY',
				lft: 2,
				rgt: 100
			},
			{
				id: 4,
				name: 'The Bitten Apple',
				venueType: 'CL',
				type: 'Venue',
				lft: 3,
				rgt: 4
			},
			{
				id: 5,
				name: 'North Central',
				code: 'NC',
				type: 'Region',
				lft: 10000001,
				rgt: 20000000
			},
			{
				id: 6,
				name: 'Nuclear Winter',
				code: 'ND-001',
				type: 'Domain',
				lft: 10000002,
				rgt: 10000100
			},
			{
				id: 7,
				name: 'Domain of Pending Doom',
				code: 'ME-008',
				type: 'Domain',
				lft: 101,
				rgt: 200
			}
		])
	);
};
