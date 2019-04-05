module.exports = function (grunt) {

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-bump');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    meta: {
      banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
        '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
    },
    watch: {
      scripts: {
        files: ['Gruntfile.js', 'angiviti/**/*.js']
      }
    },
    concat: {
      angiviti: {
        src: ['angiviti/angiviti.js', 'angiviti/**/*.js'],
        dest: 'dist/angular-angiviti-<%= pkg.version %>.js'
      }
    },
    uglify: {
      angiviti: {
        files: {
          'dist/angular-angiviti-<%= pkg.version %>.min.js': '<%= concat.angiviti.dest %>'
        }
      }
    }
  });

  grunt.registerTask('build', ['concat', 'uglify']);
};
