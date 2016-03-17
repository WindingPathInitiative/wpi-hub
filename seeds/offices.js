'use strict';

exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'offices' ).del(),

		// Inserts seed entries
		knex( 'offices' ).insert({
			id: 1,
			name: 'National Coordinator',
			type: 'Primary',
			parentOrgID: 1,
			userID: 2
		}),
		knex( 'offices' ).insert({
			id: 2,
			name: 'Regional Coordinator',
			type: 'Primary',
			parentOrgID: 2,
			userID: 3
		}),
		knex( 'offices' ).insert({
			id: 3,
			name: 'DST',
			type: 'Primary',
			parentOrgID: 3,
			userID: 4
		}),
		knex( 'offices' ).insert({
			id: 4,
			name: 'aDST Vacant',
			type: 'Assistant',
			parentOfficeID: 3,
			parentOrgID: 3,
			userID: null
		})
	);
};
