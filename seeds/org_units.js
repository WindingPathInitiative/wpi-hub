'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'org_units' ).del(),

		// Inserts seed entries
		knex( 'org_units' ).insert({
			id: 1,
			name: 'United States',
			code: 'US',
			website: 'http://mindseyesociety.org',
			type: 'Nation',
			lft: 1,
			rgt: 1000000000,
			depth: 0
		}),
		knex( 'org_units' ).insert({
			id: 2,
			name: 'North East',
			code: 'NE',
			type: 'Region',
			lft: 2,
			rgt: 10000000,
			depth: 1
		}),
		knex( 'org_units' ).insert({
			id: 3,
			name: 'Children of the Lost Eden',
			code: 'NY-004',
			type: 'Domain',
			website: 'http://www.mesnyc.org',
			location: 'New York, NY',
			defDoc: 'City of New York, NY, Nassau and Suffolk County, Long Island, NY',
			lft: 3,
			rgt: 100,
			depth: 2
		}),
		knex( 'org_units' ).insert({
			id: 4,
			name: 'The Bitten Apple',
			code: 'CL',
			type: 'Venue',
			lft: 4,
			rgt: 5,
			depth: 3
		}),
		knex( 'org_units' ).insert({
			id: 5,
			name: 'North Central',
			code: 'NC',
			type: 'Region',
			lft: 10000001,
			rgt: 20000000,
			depth: 1
		}),
		knex( 'org_units' ).insert({
			id: 6,
			name: 'Nuclear Winter',
			code: 'ND-001',
			type: 'Domain',
			lft: 10000002,
			rgt: 10000100,
			depth: 2
		}),
		knex( 'org_units' ).insert({
			id: 7,
			name: 'Domain of Pending Doom',
			code: 'ME-008',
			type: 'Domain',
			lft: 101,
			rgt: 200,
			depth: 2
		})
	);
};
