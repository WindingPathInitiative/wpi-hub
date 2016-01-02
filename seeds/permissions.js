
exports.seed = ( knex, Promise ) => {
	return Promise.join(

		// Deletes ALL existing entries
		knex( 'permissions' ).del(),

		// Inserts seed entries
		knex( 'permissions' ).insert({
			id: 1,
			officeID: 1,
			roleID: 1
		}),
		knex( 'permissions' ).insert({
			id: 2,
			officeID: 1,
			roleID: 2
		}),
		knex( 'permissions' ).insert({
			id: 3,
			officeID: 1,
			roleID: 4
		}),
		knex( 'permissions' ).insert({
			id: 4,
			officeID: 2,
			roleID: 1
		}),
		knex( 'permissions' ).insert({
			id: 5,
			officeID: 2,
			roleID: 2
		}),
		knex( 'permissions' ).insert({
			id: 6,
			officeID: 2,
			roleID: 4
		}),
		knex( 'permissions' ).insert({
			id: 7,
			officeID: 3,
			roleID: 1
		}),
		knex( 'permissions' ).insert({
			id: 8,
			officeID: 3,
			roleID: 3
		})
	);
};
