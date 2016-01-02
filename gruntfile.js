/**
 * Grunt dev helper and validator.
 * @author Ephraim Gregor
 */

module.exports = ( grunt ) => {
	'use strict';

	grunt.initConfig({
		watch: {
			options: {
				spawn: false,
				livereload: true
			},
			js: {
				files: [ '**/*.js', '!node_modules' ],
				tasks: [ 'jshint', 'jscs' ]
			},
			css: {
				files: 'public/stylesheets/*.css',
				tasks: [ 'csslint' ]
			}
		},

		jshint: {
			app: {
				options: {
					esnext: true,
					node: true
				},
				files: {
					src: [ '*.js', 'routes/*.js' ]
				}
			},
			frontend: {
				options: {
					browser: true
				},
				files: {
					src: [ 'public/javascripts/*.js' ]
				}
			},
			options: {
				strict: true,
				reporter: require( 'jshint-stylish' )
			}
		},
		jscs: {
			all: [ '**/*.js' ]
		},

		csslint: {
			all: {
				options: {
					import: 2,
					csslintrc: '.csslintrc'
				},
				src: [ 'public/stylesheets/*.css' ]
			}
		}
	});

	// Sets watch to prevent exit.
	grunt.event.on( 'watch', function() {
		grunt.option( 'force', true );
	});

	require( 'load-grunt-tasks' )( grunt );

	grunt.registerTask( 'default', [ 'watch' ] );
};
