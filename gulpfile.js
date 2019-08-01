var gulp = require('gulp');
var sass = require('gulp-sass');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var sourcemaps = require('gulp-sourcemaps');
var del = require('del');
var cleancss = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var browsersync = require('browser-sync').create();
var rename = require("gulp-rename");
var replace = require('gulp-replace');
var plumber = require('gulp-plumber');
var argv = require('yargs').argv;
var htmlmin = require('gulp-htmlmin');
var concat = require('gulp-concat');
var purgecss = require('gulp-purgecss');
var gcmq = require('gulp-group-css-media-queries');
var imagemin = require('gulp-imagemin');
var imageminpngquant = require('imagemin-pngquant');
var imageminmozjpeg = require('imagemin-mozjpeg');
var imageminwebp = require('imagemin-webp');
var webp = require('gulp-webp');
var favicon = require('gulp-favicons');
var svgstore = require('gulp-svgstore');
var pxtorem = require('postcss-pxtorem');
var cheerio = require('gulp-cheerio');
var notify = require("gulp-notify");
var debug = require('gulp-debug');
var newer = require('gulp-newer');

var paths = {
  views: {
    source: './source/views/**/*.html',
    build: './build/'
  },
  styles: {
    source: './source/styles/**/*.{css,sass,scss}',
    build: './build/styles/'
  },
  scripts: {
    source: './source/scripts/**/*.js',
    build: './build/scripts/'
  },
  images: {
    source: [
      './source/images/**/*.{gif,jpg,jpeg,png,svg}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!./source/images/svg/*.svg'
    ],
    build: './build/images/'
  },
  imageswebp: {
    source: [
      './source/images/**/*.{gif,jpg,jpeg,png}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}'
    ],
    build: './build/images/'
  },
  sprites: {
    source: './source/images/svg/*.svg',
    build: './build/images/sprites/'
  },
  favicons: {
    source: './source/images/favicons/*.{gif,jpg,jpeg,png}',
    build: './build/images/favicons/'
  },
  fonts: {
    source: './source/fonts/**/*.{woff,woff2}',
    build: './build/fonts/'
  }
};

function views() {
  return gulp.src(paths.views.source)
    .pipe(newer(paths.views.build))
    .pipe(plumber({errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      title: 'HTML Error',
      wait: true
      }),
      function() {
      this.emit('end');
      }
    }))
    .pipe(gulpif(argv.build, replace('.css', '.min.css')))
    .pipe(gulpif(argv.build, replace('.js', '.min.js')))
    .pipe(gulpif(argv.build, htmlmin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true
    })))
    .pipe(debug({
      title: 'HTML:'
    }))
    .pipe(gulp.dest(paths.views.build))
    .on('end', browsersync.reload);
}

function styles() {
  return gulp.src(paths.styles.source)
    .pipe(newer(paths.styles.build))
    .pipe(plumber({errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      title: 'CSS Error',
      wait: true
      }),
      function() {
      this.emit('end');
      }
    }))
    .pipe(gulpif(argv.dev, sourcemaps.init()))
    .pipe(sass())
    .pipe(gcmq())
    .pipe(purgecss({
      content: [paths.views.source],
      keyframes: true,
      whitelistPatterns: [/js/]
    }))
    .pipe(postcss([
      autoprefixer({
        grid: 'no-autoplace'
      }),
      pxtorem()
    ]))
    .pipe(gulpif(argv.build, cleancss({
      level: 2
      })
    ))
    .pipe(gulpif(argv.build, rename({
      suffix: '.min'
      })
    ))
    .pipe(gulpif(argv.dev, sourcemaps.write('./maps/', {
      addComment: false
      }
    )))
    .pipe(debug({
      title: 'CSS:'
    }))
    .pipe(gulp.dest(paths.styles.build))
    .pipe(browsersync.stream());
}

function scripts() {
  return gulp.src(paths.scripts.source)
    .pipe(newer(paths.scripts.build))
    .pipe(plumber({errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      title: 'JS Error',
      wait: true
      }),
      function() {
      this.emit('end');
      }
    }))
    .pipe(gulpif(argv.dev, sourcemaps.init()))
    .pipe(concat('main.js'))
    .pipe(gulpif(argv.build, uglify()))
    .pipe(gulpif(argv.build, rename({
      suffix: '.min'
      })
    ))
    .pipe(gulpif(argv.dev, sourcemaps.write('./maps/', {
      addComment: false
      }
    )))
    .pipe(debug({
      title: 'Scripts:'
    }))
    .pipe(gulp.dest(paths.scripts.build))
    .on('end', browsersync.reload);
}

function images() {
  return gulp.src(paths.images.source)
    .pipe(newer(paths.images.build))
    .pipe(gulpif(argv.build, imagemin([
      imageminmozjpeg({
        smooth: 10,
        quality: 70
      }),
      imagemin.gifsicle({
        interlaced: true,
        optimizationLevel: 3
      }),
      imagemin.svgo({
        plugins: [
          {cleanupAttrs: true},
          {cleanupNumericValues: {
            floatPrecision: 0
            }
          },
          {collapseGroups: true},
          {convertEllipseToCircle: true},
          {convertShapeToPath: true},
          {mergePaths: true},
          {minifyStyles: true},
          {removeComments: true},
          {removeDesc: true},
          {removeDoctype: true},
          {removeEditorsNSData: true},
          {removeEmptyAttrs: true},
          {removeEmptyContainers: true},
          {removeEmptyText: true},
          {removeHiddenElems: true},
          {removeMetadata: true},
          {removeTitle: true},
          {removeXMLProcInst: true}
        ]
      }),
      imageminpngquant({
        dithering: 0.4,
        speed: 1,
        strip: true,
        quality: [0, 1]
      })
    ])))
    .pipe(debug({
      title: 'Images:'
    }))
    .pipe(gulp.dest(paths.images.build))
}

function imageswebp() {
  return gulp.src(paths.imageswebp.source)
    .pipe(newer({
      dest: paths.imageswebp.build,
      ext: '.webp'
    }))
    .pipe(webp(gulpif(argv.build, imagemin([
      imageminwebp({
        alphaQuality: 70,
        lossless: true,
        method: 6,
        quality: 70
      })
    ]))))
    .pipe(debug({title: 'ImagesWebp:'}))
    .pipe(gulp.dest(paths.imageswebp.build))
}

function sprites() {
  return gulp.src(paths.sprites.source)
    .pipe(rename({
      prefix: 'icon_'
    }))
    .pipe(imagemin([
      imagemin.svgo({
        plugins: [
          {cleanupAttrs: true},
          {cleanupNumericValues: {
            floatPrecision: 0
            }
          },
          {collapseGroups: true},
          {convertEllipseToCircle: true},
          {convertShapeToPath: true},
          {mergePaths: true},
          {minifyStyles: true},
          {removeAttrs: {
            attrs: [
              'clip.*',
              'fill.*',
              'stroke.*'
            ]},
            preserveCurrentColor: true
          },
          {removeComments: true},
          {removeDesc: true},
          {removeDoctype: true},
          {removeEditorsNSData: true},
          {removeEmptyAttrs: true},
          {removeEmptyContainers: true},
          {removeEmptyText: true},
          {removeHiddenElems: true},
          {removeMetadata: true},
          {removeTitle: true},
          {removeXMLProcInst: true}
        ]
      })
    ]))
    .pipe(svgstore({
      inlineSvg: true
    }))
    .pipe(cheerio({
      run: function ($) {
        $('symbol').attr('fill', 'currentColor');
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe(rename('sprite.svg'))
    .pipe(debug({
      title: 'Sprites:'
    }))
    .pipe(gulp.dest(paths.sprites.build))
}

function favicons() {
  return gulp.src(paths.favicons.source)
    .pipe(newer(paths.favicons.build))
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
    .pipe(gulp.dest(paths.favicons.build))
}

function fonts() {
  return gulp.src(paths.fonts.source)
    .pipe(newer(paths.fonts.build))
    .pipe(debug({
      title: 'Fonts:'
    }))
    .pipe(gulp.dest(paths.fonts.build))
}

function clean() {
  return del('./build/*')
}

function watch() {
  if(argv.sync){
    browsersync.init({
      notify: false,
      port: 7000,
      server: './build/',
      tunnel: 'development-site',
      ui: false
    })
  };
  gulp.watch(paths.views.source, views);
  gulp.watch(paths.styles.source, styles);
  gulp.watch(paths.scripts.source, scripts);
  gulp.watch(paths.images.source, images);
  gulp.watch(paths.imageswebp.source, imageswebp);
  gulp.watch(paths.sprites.source, sprites);
  gulp.watch(paths.favicons.source, favicons);
  gulp.watch(paths.fonts.source, fonts);
}

gulp.task('default', gulp.series(clean, views, styles, scripts, images, imageswebp, sprites, favicons, fonts, watch));
