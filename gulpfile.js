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
var pxtorem = require('postcss-pxtorem');
var focus = require('postcss-focus');
var notify = require("gulp-notify");
var debug = require('gulp-debug');
var newer = require('gulp-newer');
var fileinclude = require('gulp-file-include');
var svgSprite = require('gulp-svg-sprite');

var paths = {
  views: {
    source: './source/views/**/*.html',
    build: './build/',
    watch: [
      './source/components/**/*.html',
      './source/views/**/*.html'
    ]
  },
  styles: {
    source: './source/styles/main.{css,sass,scss}',
    build: './build/styles/',
    watch: [
      './source/components/**/*.{css,sass,scss}',
      './source/styles/**/*.{css,sass,scss}'
    ]
  },
  scripts: {
    source: './source/scripts/**/*.js',
    build: './build/scripts/',
    watch: [
      './source/components/**/*.js',
      './source/scripts/**/*.js'
    ]
  },
  images: {
    source: [
      './source/images/**/*.{gif,jpg,jpeg,png,svg}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!./source/images/svg/stack/*.svg',
      '!./source/images/svg/symbol/*.svg'
    ],
    build: './build/images/',
    watch: [
      './source/images/**/*.{gif,jpg,jpeg,png,svg}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!./source/images/svg/stack/*.svg',
      '!./source/images/svg/symbol/*.svg'
    ]
  },
  imageswebp: {
    source: [
      './source/images/**/*.{gif,jpg,jpeg,png}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}'
    ],
    build: './build/images/',
    watch: [
      './source/images/**/*.{gif,jpg,jpeg,png}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}'
    ]
  },
  favicons: {
    source: './source/images/favicons/*.{gif,jpg,jpeg,png}',
    build: './build/images/favicons/',
    watch: './source/images/favicons/*.{gif,jpg,jpeg,png}'
  },
  svgSpriteStack: {
    source: './source/images/svg/stack/*.svg',
    build: './build/images/sprites/',
    watch: './source/images/svg/stack/*.svg'
  },
  svgSpriteSymbol: {
    source: './source/images/svg/symbol/*.svg',
    build: './build/images/sprites/',
    watch: './source/images/svg/symbol/*.svg'
  },
  fonts: {
    source: './source/fonts/**/*.{woff,woff2}',
    build: './build/fonts/',
    watch: './source/fonts/**/*.{woff,woff2}'
  }
};

function views() {
  return gulp.src(paths.views.source)
    .pipe(plumber({errorHandler: notify.onError({
      message: 'Error: <%= error.message %>',
      title: 'HTML Error'
      }),
      function() {
      this.emit('end');
      }
    }))
    .pipe(fileinclude({
      prefix: '@'
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
      content: [
        './build/**.html'
      ],
      keyframes: true,
      whitelistPatterns: [/js/]
    }))
    .pipe(postcss([
      autoprefixer({
        grid: 'no-autoplace'
      }),
      pxtorem(),
      focus()
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
          {cleanupListOfValues: true},
          {cleanupNumericValues: {
            floatPrecision: 0
            }
          },
          {collapseGroups: true},
          {convertColors: true},
          {convertEllipseToCircle: true},
          {convertShapeToPath: true},
          {mergePaths: true},
          {minifyStyles: true},
          {moveElemsAttrsToGroup: true},
          {removeComments: true},
          {removeDesc: true},
          {removeDimensions: true},
          {removeDoctype: true},
          {removeEditorsNSData: true},
          {removeEmptyAttrs: true},
          {removeEmptyContainers: true},
          {removeEmptyText: true},
          {removeHiddenElems: true},
          {removeMetadata: true},
          {removeOffCanvasPaths: true},
          {removeScriptElement: true},
          {removeStyleElement: true},
          {removeTitle: true},
          {removeUnknownsAndDefaults: true},
          {removeUnusedNS: true},
          {removeUselessStrokeAndFill: true},
          {removeXMLProcInst: true},
          {sortAttrs: true}
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

function svgSpriteStack() {
  return gulp.src(paths.svgSpriteStack.source)
    .pipe(svgSprite({
      dest: './',
      mode: {
        stack: {
          bust: false,
          dest: './',
          prefix: '.',
          render: {
            scss: {
              dest: './../../../source/styles/helpers/mixins-sprite.scss',
              template: './source/styles/helpers/mixins-sprite.handlebars'
            }
          },
          sprite: 'sprite.stack.svg'
        }
      },
      svg: {
        xmlDeclaration: ''
      }
    }))
    .pipe(replace('@mixin .', '@mixin '))
    .pipe(replace('#.', '#'))
    .pipe(replace('-dims', ''))
    .pipe(debug({
      title: 'SVG Sprite Stack:'
    }))
    .pipe(gulp.dest(paths.svgSpriteStack.build))
}

function svgSpriteSymbol() {
  return gulp.src(paths.svgSpriteSymbol.source)
    .pipe(rename({
      prefix: 'icon_'
    }))
    .pipe(svgSprite({
      dest: './',
      mode: {
        symbol: {
          dest: './',
          inline: true,
          sprite: 'sprite.symbol.svg'
        }
      },
      svg: {
        dimensionAttributes: false
      }
    }))
    .pipe(debug({
      title: 'SVG Sprite Symbol:'
    }))
    .pipe(gulp.dest(paths.svgSpriteSymbol.build))
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
  gulp.watch(paths.views.watch, views);
  gulp.watch(paths.styles.watch, styles);
  gulp.watch(paths.scripts.watch, scripts);
  gulp.watch(paths.images.watch, images);
  gulp.watch(paths.imageswebp.watch, imageswebp);
  gulp.watch(paths.favicons.watch, favicons);
  gulp.watch(paths.svgSpriteStack.watch, svgSpriteStack);
  gulp.watch(paths.svgSpriteSymbol.watch, svgSpriteSymbol);
  gulp.watch(paths.fonts.watch, fonts);
}

gulp.task('default', gulp.series(clean, views, styles, scripts, images, imageswebp, favicons, svgSpriteStack, svgSpriteSymbol, fonts, watch));
