
exports.seed = ( knex, Promise ) => {
	return Promise.join(
		// Deletes ALL existing entries
		knex( 'roles' ).del(),

		// Inserts seed entries
		knex( 'roles' ).insert({
			id: 1,
			name: 'Hire Assistants'
		}),
		knex( 'roles' ).insert({
			id: 2,
			name: 'Elect Coordinators'
		}),
		knex( 'roles' ).insert({
			id: 3,
			name: 'Elect Storytellers'
		}),
		knex( 'roles' ).insert({
			id: 4,
			name: 'Change User Domain'
		})
	);
};
