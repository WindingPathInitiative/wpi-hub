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
				parentPath: '1'
			},
			{
				id: 2,
				name: 'North East',
				code: 'NE',
				type: 'Region',
				parentPath: '1.2'
			},
			{
				id: 3,
				name: 'Children of the Lost Eden',
				code: 'NY-004',
				type: 'Domain',
				website: 'http://www.mesnyc.org',
				location: 'New York, NY',
				defDoc: 'City of New York, NY, Nassau and Suffolk County, Long Island, NY',
				parentPath: '1.2.3'
			},
			{
				id: 4,
				name: 'The Bitten Apple',
				venueType: 'CL',
				type: 'Venue',
				parentPath: '1.2.3.4'
			},
			{
				id: 5,
				name: 'North Central',
				code: 'NC',
				type: 'Region',
				parentPath: '1.5'
			},
			{
				id: 6,
				name: 'Nuclear Winter',
				code: 'ND-001',
				type: 'Domain',
				parentPath: '1.5.6'
			},
			{
				id: 7,
				name: 'Domain of Pending Doom',
				code: 'ME-008',
				type: 'Domain',
				parentPath: '1.2.7'
			}
		])
	);
};
