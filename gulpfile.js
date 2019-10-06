var gulp = require('gulp');
var sass = require('gulp-sass');
var postCSS = require('gulp-postcss');
var autoPrefixer = require('autoprefixer');
var sourceMaps = require('gulp-sourcemaps');
var del = require('del');
var cleanCSS = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var gulpIf = require('gulp-if');
var browserSync = require('browser-sync').create();
var rename = require("gulp-rename");
var replace = require('gulp-replace');
var plumber = require('gulp-plumber');
var argv = require('yargs').argv;
var htmlMin = require('gulp-htmlmin');
var concat = require('gulp-concat');
var purgeCSS = require('gulp-purgecss');
var gcmq = require('gulp-group-css-media-queries');
var imageMin = require('gulp-imagemin');
var imageMinPngQuant = require('imagemin-pngquant');
var imageMinMozJpeg = require('imagemin-mozjpeg');
var imageMinWebp = require('imagemin-webp');
var webp = require('gulp-webp');
var favicon = require('gulp-favicons');
var pxToRem = require('postcss-pxtorem');
var focus = require('postcss-focus');
var notify = require("gulp-notify");
var debug = require('gulp-debug');
var newer = require('gulp-newer');
var fileInclude = require('gulp-file-include');
var svgSprite = require('gulp-svg-sprite');
var spriteSmith = require('gulp.spritesmith');
var merge = require('merge-stream');
var buffer = require('vinyl-buffer');
var critical = require('critical').stream;

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
      './source/images/content/*.{gif,jpg,jpeg,png,svg}',
      './source/images/background/*.{gif,jpg,jpeg,png,svg}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!./source/images/png/*.png',
      '!./source/images/svg/stack/*.svg',
      '!./source/images/svg/symbol/*.svg'
    ],
    build: './build/images/',
    watch: [
      './source/images/content/*.{gif,jpg,jpeg,png,svg}',
      './source/images/background/*.{gif,jpg,jpeg,png,svg}',
      '!./source/images/favicons/*.{gif,jpg,jpeg,png}',
      '!./source/images/png/*.png',
      '!./source/images/svg/stack/*.svg',
      '!./source/images/svg/symbol/*.svg'
    ]
  },
  imagesWebp: {
    source: './source/images/content/*.{gif,jpg,jpeg,png}',
    build: './build/images/',
    watch: './source/images/content/*.{gif,jpg,jpeg,png}'
  },
  favicons: {
    source: './source/images/favicons/*.{gif,jpg,jpeg,png}',
    build: './build/images/favicons/',
    watch: './source/images/favicons/*.{gif,jpg,jpeg,png}'
  },
  pngSprite: {
    source: './source/images/png/*.png',
    build: './build/images/sprites/',
    watch: './source/images/png/*.png'
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
    .pipe(fileInclude({
      prefix: '@'
    }))
    .pipe(gulpIf(argv.build, replace('.css', '.min.css')))
    .pipe(gulpIf(argv.build, replace('.js', '.min.js')))
    .pipe(gulpIf(argv.build, htmlMin({
      collapseWhitespace: true,
      minifyCSS: true,
      minifyJS: true,
      removeComments: true
    })))
    .pipe(gulpIf(argv.build, critical({
      inline: true,
      base: 'paths.views.build',
      css: [
        './build/styles/main.min.css'
      ],
      dimensions: [{
        width: 320,
        height: 568
        },
        {
        width: 768,
        height: 1024
        },
        {
        width: 1920,
        height: 1280
        }
      ],
      minify: true
    })))
    .pipe(debug({
      title: 'HTML:'
    }))
    .pipe(gulp.dest(paths.views.build))
    .on('end', browserSync.reload)
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
    .pipe(gulpIf(argv.dev, sourceMaps.init()))
    .pipe(sass())
    .pipe(gcmq())
    .pipe(purgeCSS({
      content: [
        './source/**/*.html'
      ],
      keyframes: true,
      whitelistPatterns: [/js/]
    }))
    .pipe(postCSS([
      autoPrefixer({
        grid: 'no-autoplace'
      }),
      pxToRem(),
      focus()
    ]))
    .pipe(gulpIf(argv.build, cleanCSS({
      level: 2
      })
    ))
    .pipe(gulpIf(argv.build, rename({
      suffix: '.min'
      })
    ))
    .pipe(gulpIf(argv.dev, sourceMaps.write('./maps/', {
      addComment: false
      }
    )))
    .pipe(debug({
      title: 'CSS:'
    }))
    .pipe(gulp.dest(paths.styles.build))
    .pipe(browserSync.stream())
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
    .pipe(gulpIf(argv.dev, sourceMaps.init()))
    .pipe(concat('main.js'))
    .pipe(gulpIf(argv.build, uglify()))
    .pipe(gulpIf(argv.build, rename({
      suffix: '.min'
      })
    ))
    .pipe(gulpIf(argv.dev, sourceMaps.write('./maps/', {
      addComment: false
      }
    )))
    .pipe(debug({
      title: 'Scripts:'
    }))
    .pipe(gulp.dest(paths.scripts.build))
    .on('end', browserSync.reload)
}

function images() {
  return gulp.src(paths.images.source)
    .pipe(newer(paths.images.build))
    .pipe(gulpIf(argv.build, imageMin([
      imageMinMozJpeg({
        smooth: 10,
        quality: 70
      }),
      imageMin.gifsicle({
        interlaced: true,
        optimizationLevel: 3
      }),
      imageMin.svgo({
        plugins: [
          {cleanupAttrs: true},
          {cleanupListOfValues: true},
          {collapseGroups: true},
          {convertColors: true},
          {convertEllipseToCircle: true},
          {convertPathData: true},
          {convertShapeToPath: true},
          {convertTransform: true},
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
          {removeNonInheritableGroupAttrs: true},
          {removeOffCanvasPaths: true},
          {removeScriptElement: true},
          {removeTitle: true},
          {removeUnknownsAndDefaults: true},
          {removeUnusedNS: true},
          {removeUselessStrokeAndFill: true},
          {removeXMLProcInst: true},
          {sortAttrs: true}
        ]
      }),
      imageMinPngQuant({
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
    .pipe(debug({title: 'ImagesWebp:'}))
    .pipe(gulp.dest(paths.imagesWebp.build))
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

function pngSprite() {
  var spriteData = gulp.src(paths.pngSprite.source)
    .pipe(spriteSmith({
      algorithm: 'top-down',
      cssName: 'spritePng.scss',
      cssTemplate: './source/styles/helpers/spritePng.handlebars',
      imgName: 'sprite.png'
    }))
  var imgStream = spriteData.img
    .pipe(buffer())
    .pipe(imageMin([
      imageMinPngQuant({
        dithering: 0.4,
        padding: 30,
        speed: 1,
        strip: true,
        quality: [0, 1]
      })
    ]))
    .pipe(gulp.dest(paths.pngSprite.build))
  var cssStream = spriteData.css
    .pipe(gulp.dest('./source/styles/helpers/'))
  return merge(imgStream, cssStream)
}

function svgSpriteStack() {
  return gulp.src(paths.svgSpriteStack.source)
    .pipe(imageMin([
      imageMin.svgo({
        plugins: [
          {cleanupAttrs: true},
          {cleanupListOfValues: true},
          {collapseGroups: true},
          {convertColors: true},
          {convertEllipseToCircle: true},
          {convertPathData: true},
          {convertShapeToPath: true},
          {convertTransform: true},
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
          {removeNonInheritableGroupAttrs: true},
          {removeOffCanvasPaths: true},
          {removeScriptElement: true},
          {removeTitle: true},
          {removeUnknownsAndDefaults: true},
          {removeUnusedNS: true},
          {removeUselessStrokeAndFill: true},
          {removeXMLNS: true},
          {removeXMLProcInst: true},
          {sortAttrs: true}
        ]
      })
    ]))
    .pipe(svgSprite({
      dest: './',
      mode: {
        stack: {
          bust: false,
          dest: './',
          prefix: '.',
          render: {
            scss: {
              dest: './../../../source/styles/helpers/spriteSvg.scss',
              template: './source/styles/helpers/spriteSvg.handlebars'
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
    .pipe(imageMin([
      imageMin.svgo({
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
          {convertPathData: true},
          {convertShapeToPath: true},
          {convertTransform: true},
          {mergePaths: true},
          {minifyStyles: true},
          {moveElemsAttrsToGroup: true},
          {removeAttrs: {
            attrs: [
              'clip.*',
              'fill.*',
              'stroke.*'
            ]}
          },
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
          {removeNonInheritableGroupAttrs: true},
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
      })
    ]))
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
    browserSync.init({
      notify: false,
      port: 7000,
      server: './build/',
      tunnel: 'development-site',
      ui: false
    })
  }
  gulp.watch(paths.views.watch, views)
  gulp.watch(paths.styles.watch, styles)
  gulp.watch(paths.scripts.watch, scripts)
  gulp.watch(paths.images.watch, images)
  gulp.watch(paths.imagesWebp.watch, imagesWebp)
  gulp.watch(paths.favicons.watch, favicons)
  gulp.watch(paths.pngSprite.watch, pngSprite)
  gulp.watch(paths.svgSpriteStack.watch, svgSpriteStack)
  gulp.watch(paths.svgSpriteSymbol.watch, svgSpriteSymbol)
  gulp.watch(paths.fonts.watch, fonts)
}

gulp.task('default', gulp.series(clean, pngSprite, svgSpriteStack, svgSpriteSymbol, styles, views,scripts, images, imagesWebp, favicons, fonts, watch))
