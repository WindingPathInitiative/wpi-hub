
exports.seed = ( knex, Promise ) => {
	return Promise.join(
		// Deletes ALL existing entries
		knex( 'org_units' ).del(),

		// Inserts seed entries
		knex( 'org_units' ).insert({
			id: 1,
			name: 'United States',
			code: 'US-001-N',
			website: 'http://mindseyesociety.org',
			type: 'Nation'
		}),
		knex( 'org_units' ).insert({
			id: 2,
			name: 'North East Region',
			code: 'NE',
			parentID: 1,
			type: 'Region'
		}),
		knex( 'org_units' ).insert({
			id: 3,
			name: 'Children of the Lost Eden',
			code: 'NY-004-D',
			parentID: 2,
			type: 'Domain',
			website: 'http://www.mesnyc.org',
			location: 'New York, NY',
			defDoc: 'City of New York, NY, Nassau and Suffolk County, Long Island, NY'
		}),
		knex( 'org_units' ).insert({
			id: 4,
			name: 'The Bitten Apple',
			parentID: 3,
			code: 'CL',
			type: 'Venue'
		})
	);
};
