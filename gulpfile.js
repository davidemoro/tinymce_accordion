var gulp = require('gulp');

var dest = '.tmp';

gulp.task('copy-vendor', function () {
  gulp.src(['./node_modules/tinymce/tinymce.js',
    './node_modules/tinymce/tinymce.jquery.js',
    './node_modules/tinymce/plugins/**/*.*',
    './node_modules/tinymce/skins/**/*.*',
    './node_modules/tinymce/themes/**/*.*'],
    {base: './node_modules/tinymce/'})
  .pipe(gulp.dest(dest));
});

gulp.task('copy-plugins', function() {
  gulp.src(['./js/**/*'])
  .pipe(gulp.dest(dest + '/plugins/tinymce_accordion'));
});

// Default task
gulp.task(
  'default', [
    'copy-vendor',
    'copy-plugins'
  ]
);
