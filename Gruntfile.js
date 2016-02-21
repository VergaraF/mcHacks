module.exports = function(grunt) {
	grunt.initConfig({
	  sass: {
	    dist: {
	      files: {
	        './static/css/materialize.css': './static/sass/sass/materialize.scss'
	      }
	    }
	  }
	});

	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.registerTask('default', ['sass']);
};