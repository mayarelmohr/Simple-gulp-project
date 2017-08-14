// Configurable paths
var config = {
  app: 'app',
  dist: 'dist'
};
// generated on 2017-06-06 using generator-webapp 2.4.1
const gulp = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserSync = require('browser-sync').create();
const del = require('del');
const wiredep = require('wiredep').stream;
const runSequence = require('run-sequence');
const svgSprite = require('gulp-svg-sprite');

const $ = gulpLoadPlugins();
const reload = browserSync.reload;

var dev = true;

gulp.task('styles', () => {
  return gulp.src('app/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({ browsers: ['> 1%', 'last 2 versions', 'Firefox ESR'] }))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(reload({ stream: true }));
});

gulp.task('scripts', () => {
  return gulp.src('app/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(reload({ stream: true }));
});

function lint(files) {
  return gulp.src(files)
    .pipe($.eslint({ fix: true }))
    .pipe(reload({ stream: true, once: true }))
    .pipe($.eslint.format())
    .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}

gulp.task('lint', () => {
  return lint('app/scripts/**/*.js')
    .pipe(gulp.dest('app/scripts'));
});
gulp.task('lint:test', () => {
  return lint('test/spec/**/*.js')
    .pipe(gulp.dest('test/spec'));
});

gulp.task('views', () => {
  return gulp.src('app/*.pug')
    .pipe($.plumber())
    .pipe($.pug({ pretty: true }))
    .pipe(gulp.dest('.tmp'))
    .pipe(reload({ stream: true }));
});

gulp.task('html', ['views', 'styles', 'scripts'], () => {
  return gulp.src('.tmp/*.html')
    .pipe($.useref({ searchPath: ['.tmp', 'app', '.'] }))
    .pipe($.if(/\.js$/, $.uglify({ compress: { drop_console: true } })))
    .pipe($.if(/\.css$/, $.cssnano({ safe: true, autoprefixer: false })))
    .pipe($.if(/\.html$/, $.htmlmin({
      collapseWhitespace: false,
      minifyCSS: true,
      minifyJS: { compress: { drop_console: true } },
      processConditionalComments: true,
      removeComments: true,
      removeEmptyAttributes: false,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true
    })))
    .pipe(gulp.dest('dist'));
});

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe($.cache($.imagemin([
      $.imagemin.gifsicle({interlaced: true}),
      $.imagemin.jpegtran({progressive: true}),
      $.imagemin.optipng({optimizationLevel: 5}),
    ],{
      verbose: true
    })))
    .pipe(gulp.dest('dist/images'));
});

gulp.task('svgSprite', () => {
  config = {
    mode: {
      defs: { // Activate the «defs» mode
        sprite: '../svg-defs.svg', //Hack to
        prefix: 'shape',
      }
    }
  };
  return gulp.src('app/images/svg-sprite/*.svg')
    .pipe(svgSprite(config))
    .pipe(gulp.dest('app/images/'));
});

gulp.task('fonts', () => {
  return gulp.src(require('main-bower-files')('**/*.{eot,svg,ttf,woff,woff2}', function (err) { })
    .concat('app/fonts/**/*'))
    .pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
});

gulp.task('modernizr', () => {
  gulp.src([
    'dist/scripts/{,*/}*.js',
    'dist/styles/{,*/}*.css',
    '!dist/scripts/vendor/*'
  ])
    .pipe($.modernizr())
    .pipe($.uglify())
    .pipe(gulp.dest('dist/scripts/vendor/'))
});

gulp.task('extras', () => {
  return gulp.src([
    'app/*',
    '!app/*.html',
    '!app/*.pug'
  ], {
      dot: true
    }).pipe(gulp.dest('dist'));
});


// I dont need to clean dist as the clean task is called on serve only
// gulp.task('clean', del.bind(null, ['.tmp', 'dist']));
gulp.task('clean', del.bind(null, ['.tmp']));

gulp.task('serve', () => {
  runSequence(['clean', 'wiredep'], ['views', 'styles', 'scripts', 'fonts', 'svgSprite'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'app'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });

    gulp.watch([
      '.tmp/*.html',
      'app/images/**/*',
      '.tmp/fonts/**/*'
    ]).on('change', reload);
    gulp.watch('app/**/*.pug', ['views']);
    gulp.watch('app/styles/**/*.scss', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/fonts/**/*', ['fonts']);
    gulp.watch('bower.json', ['wiredep', 'fonts']);
  });
});

gulp.task('serve:dist', ['default'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('serve:test', ['scripts'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    ui: false,
    server: {
      baseDir: 'test',
      routes: {
        '/scripts': '.tmp/scripts',
        '/bower_components': 'bower_components'
      }
    }
  });

  gulp.watch('app/scripts/**/*.js', ['scripts']);
  gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
  gulp.watch('test/spec/**/*.js', ['lint:test']);
});

// inject bower components
gulp.task('wiredep', () => {
  gulp.src('app/styles/*.scss')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)+/
    }))
    .pipe(gulp.dest('app/styles'));

  gulp.src(['app/includes/_head.pug', 'app/includes/_scripts.pug'])
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./,
      fileTypes: {
        pug: {
          block: /(([ \t]*)\/\/-?\s*bower:*(\S*))(\n|\r|.)*?(\/\/-?\s*endbower)/gi,
          detect: {
            js: /script\(.*src=['"]([^'"]+)/gi,
            css: /link\(.*href=['"]([^'"]+)/gi
          },
          replace: {
            js: 'script(src=\'{{filePath}}\')',
            css: 'link(rel=\'stylesheet\', href=\'{{filePath}}\')'
          }
        }
      }
    }))
    .pipe(gulp.dest('app/includes'));
});

gulp.task('build', ['lint', 'html', 'svgSprite', 'images', 'fonts', 'extras'], () => {
  return gulp.src('dist/**/*').pipe($.size({ title: 'build', gzip: true }));
});

gulp.task('default', () => {
  return new Promise(resolve => {
    dev = false;
    runSequence(['clean', 'wiredep'], 'build', 'modernizr', resolve);
  });
});

//svgs
// gulp.task('default', function () {
//   return gulp.src('<%= config.app %>/images/svg-sprite/*.svg')
//   .pipe(svgmin(function getOptions (file) {
//       var prefix = path.basename(file.relative, path.extname(file.relative));
//       return {
//           plugins: [{
//               cleanupIDs: {
//                   prefix: prefix + '-',
//                   minify: true
//               }
//           }]
//       }
//   }))
//   .pipe(svgstore())
//   .pipe(gulp.dest('<%= config.dist %>/images/svg-defs.svg'));
// });
// Basic configuration example
