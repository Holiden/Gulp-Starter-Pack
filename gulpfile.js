const gulp = require('gulp');
const del = require('del');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const fileInclude = require('gulp-file-include');
const sourceMaps = require('gulp-sourcemaps');
const gulpIf = require('gulp-if');
const argv = require('yargs').argv;
const browserSync = require('browser-sync').create();
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const debug = require('gulp-debug');
const newer = require('gulp-newer');

const htmlMin = require('gulp-htmlmin');

const sass = require('gulp-sass');
const gmq = require('gulp-group-css-media-queries');
const postCSS = require('gulp-postcss');
const autoPrefixer = require('autoprefixer');
const cssMin = require('gulp-clean-css');

const uglify = require('gulp-uglify');

const imageMin = require('gulp-imagemin');
const imageMinJpeg = require('imagemin-mozjpeg');
const imageMinPng = require('imagemin-pngquant');
const imageMinWebp = require('imagemin-webp');
const webp = require('gulp-webp');
const svgSprite = require('gulp-svg-sprite');
const favicon = require('gulp-favicons');

const paths = {
  views: {
    source: 'source/views/**/*.html',
    build: 'build/',
    watch: [
      'source/blocks/**/*.html',
      'source/components/**/*.html',
      'source/views/**/*.html'
    ]
  },
  styles: {
    source: 'source/styles/main.{css,scss}',
    build: 'build/styles/',
    watch: [
      'source/blocks/**/*.{css,scss}',
      'source/components/**/*.{css,scss}',
      'source/styles/**/*.{css,scss}'
    ]
  },
  scripts: {
    source: 'source/scripts/main.js',
    build: 'build/scripts/',
    watch: [
      'source/blocks/**/*.js',
      'source/components/**/*.js',
      'source/scripts/**/*.js'
    ]
  },
  images: {
    source: [
      'source/images/*.{gif,jpg,jpeg,png,svg}',
      '!source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!source/images/svg/*.svg'
    ],
    build: 'build/images/',
    watch: [
      'source/images/*.{gif,jpg,jpeg,png,svg}',
      '!source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!source/images/svg/*.svg'
    ]
  },
  imagesWebp: {
    source: 'source/images/*.{gif,jpg,jpeg,png}',
    build: 'build/images/',
    watch: 'source/images/*.{gif,jpg,jpeg,png}'
  },
  sprite: {
    source: 'source/images/svg/*.svg',
    build: 'build/images/sprites/',
    watch: 'source/images/svg/*.svg'
  },
  favicons: {
    source: [
      'source/images/favicons/*.{jpg,jpeg,png,svg}',
      '!source/images/favicons/favicon.{jpg,jpeg,png,svg}'
    ],
    build: 'build/images/favicons/',
    watch: 'source/images/favicons/*.{jpg,jpeg,png,svg}'
  },
  fonts: {
    source: 'source/fonts/**/*.{woff,woff2}',
    build: 'build/fonts/',
    watch: 'source/fonts/**/*.{woff,woff2}'
  }
};

function views() {
  return gulp.src(paths.views.source)
    .pipe(plumber({
      errorHandler: notify.onError({
        message: 'Error: <%= error.message %>',
        title: 'HTML Error'
      }),
      function() {
        this.emit('end');
      }
    }))
    .pipe(fileInclude({
      prefix: '//='
    }))
    .pipe(gulpIf(argv.build, replace('.css', '.min.css')))
    .pipe(gulpIf(argv.build, replace('.js', '.min.js')))
    .pipe(gulpIf(argv.build, htmlMin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true
    })))
    .pipe(debug({
      title: 'HTML:'
    }))
    .pipe(gulp.dest(paths.views.build))
    .on('end', browserSync.reload);
}

function styles() {
  return gulp.src(paths.styles.source)
    .pipe(plumber({
      errorHandler: notify.onError({
        message: 'Error: <%= error.message %>',
        title: 'CSS Error'
      }),
      function() {
        this.emit('end');
      }
    }))
    .pipe(gulpIf(argv.dev, sourceMaps.init()))
    .pipe(sass())
    .pipe(gmq())
    .pipe(postCSS([
      autoPrefixer()
    ]))
    .pipe(gulpIf(argv.build, cssMin({
      level: 2
    })))
    .pipe(gulpIf(argv.build, rename({
      suffix: '.min'
    })))
    .pipe(gulpIf(argv.dev, sourceMaps.write('maps/', {
      addComment: false
    })))
    .pipe(debug({
      title: 'CSS:'
    }))
    .pipe(gulp.dest(paths.styles.build))
    .pipe(browserSync.stream());
}

function scripts() {
  return gulp.src(paths.scripts.source)
    .pipe(plumber({
      errorHandler: notify.onError({
        message: 'Error: <%= error.message %>',
        title: 'JS Error'
      }),
      function() {
        this.emit('end');
      }
    }))
    .pipe(fileInclude({
      prefix: '//='
    }))
    .pipe(gulpIf(argv.dev, sourceMaps.init()))
    .pipe(gulpIf(argv.build, uglify()))
    .pipe(gulpIf(argv.build, rename({
      suffix: '.min'
    })))
    .pipe(gulpIf(argv.dev, sourceMaps.write('maps/', {
      addComment: false
    })))
    .pipe(debug({
      title: 'JS:'
    }))
    .pipe(gulp.dest(paths.scripts.build))
    .on('end', browserSync.reload);
}

function images() {
  return gulp.src(paths.images.source)
    .pipe(newer(paths.images.build))
    .pipe(gulpIf(argv.build, imageMin([
      imageMin.gifsicle({
        interlaced: true,
        optimizationLevel: 3
      }),
      imageMinJpeg({
        smooth: 10,
        quality: 70
      }),
      imageMinPng({
        dithering: 0.4,
        speed: 1,
        strip: true,
        quality: [0, 1]
      }),
      imageMin.svgo({
        plugins: [
          { cleanupListOfValues: true },
          { removeOffCanvasPaths: true },
          { removeScriptElement: true },
          { sortAttrs: true }
        ]
      })
    ])))
    .pipe(debug({
      title: 'Images:'
    }))
    .pipe(gulp.dest(paths.images.build));
}

function imagesWebp() {
  return gulp.src(paths.imagesWebp.source)
    .pipe(newer({
      dest: paths.imagesWebp.build,
      ext: '.webp'
    }))
    .pipe(webp(gulpIf(argv.build, imageMin([
      imageMinWebp({
        alphaQuality: 70,
        lossless: true,
        method: 6,
        quality: 70
      })
    ]))))
    .pipe(debug({
      title: 'ImagesWebp:'
    }))
    .pipe(gulp.dest(paths.imagesWebp.build));
}

function sprite() {
  return gulp.src(paths.sprite.source)
    .pipe(gulpIf(argv.build, imageMin([
      imageMin.svgo({
        plugins: [
          { cleanupListOfValues: true },
          { removeOffCanvasPaths: true },
          { removeScriptElement: true },
          { sortAttrs: true }
        ]
      })
    ])))
    .pipe(svgSprite({
      mode: {
        stack: {
          dest: '',
          prefix: '',
          render: {
            scss: {
              dest: '../../../source/styles/helpers/sprite.scss',
              template: 'source/styles/helpers/sprite.hbs'
            }
          },
          sprite: 'sprite.svg'
        }
      },
      svg: {
        xmlDeclaration: ''
      }
    }))
    .pipe(replace('-dims', ''))
    .pipe(debug({
      title: 'Svg sprite:'
    }))
    .pipe(gulp.dest(paths.sprite.build));
}

function favicons() {
  return gulp.src(paths.favicons.source)
    .pipe(newer(paths.favicons.build))
    .pipe(gulp.dest(paths.favicons.build))
    .pipe(favicon({
      icons: {
        android: false,
        appleIcon: false,
        appleStartup: false,
        coast: false,
        favicons: true,
        firefox: false,
        windows: false,
        yandex: false
      }
    }))
    .pipe(debug({
      title: 'Favicons:'
    }))
    .pipe(gulp.dest(paths.favicons.build));
}

function fonts() {
  return gulp.src(paths.fonts.source)
    .pipe(newer(paths.fonts.build))
    .pipe(debug({
      title: 'Fonts:'
    }))
    .pipe(gulp.dest(paths.fonts.build));
}

function clean() {
  return del('build/*');
}

function watch() {
  if (argv.sync) {
    browserSync.init({
      host: '192.168.1.38',
      notify: false,
      online: true,
      port: 7000,
      server: 'build/',
      ui: false
    });
  }

  gulp.watch(paths.views.watch, views);
  gulp.watch(paths.styles.watch, styles);
  gulp.watch(paths.scripts.watch, scripts);
  gulp.watch(paths.images.watch, images);
  gulp.watch(paths.imagesWebp.watch, imagesWebp);
  gulp.watch(paths.sprite.watch, sprite);
  gulp.watch(paths.favicons.watch, favicons);
  gulp.watch(paths.fonts.watch, fonts);
}

gulp.task('default', gulp.series(clean, sprite, views, styles, scripts, images, imagesWebp, favicons, fonts, watch));
