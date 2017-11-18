import autoprefixer from 'gulp-autoprefixer';
import babel from 'gulp-babel';
import cleanCss from 'gulp-clean-css';
import concat from 'gulp-concat';
import connect from 'gulp-connect';
import del from 'del'
import gulp from 'gulp'
import header from 'gulp-header';
import htmlmin from 'gulp-htmlmin';
import iconfont from 'gulp-iconfont';
import imagemin from 'gulp-imagemin'
import less from 'gulp-less'
import merge from 'merge-stream';
import pkg from './package.json'
import rename from 'gulp-rename';
import sketch from 'gulp-sketch';
import template from 'gulp-template';

const config = {
  dist: 'dist',
  base: {
    src: 'base/**/*',
    dest: 'dist/',
  },
  styles: {
    all: 'styles/**/*',
    dest: 'dist/styles/',
    main: 'main.css',
    normalize: 'styles/normalize.css',
    src: 'styles/main.less',
  },
  fonts: {
    src: 'fonts/**/*',
    dest: 'dist/fonts/',
  },
  symbols: {
    className: 'Symbols',
    fontDest: 'fonts/',
    fontName: 'symbols',
    fontPath: '../fonts/',
    sketchFile: 'symbols/glyph-font.sketch',
    tmplDest: 'styles/',
    tmplSrc: 'symbols/template.less',
  },
  server: {
    port: 9000,
  },
  banner: `/*! ${pkg.name} v${pkg.version} | (c) ${(new Date()).getFullYear()} ${pkg.author} */\n`,
}

const cleanDist = () => del(['dist'])

const cleanRelease = () => del(['../**/*', '!../_site', '!../_site/**/*'], { force: true })

const copy = (src, dest) => gulp.src(src).pipe(gulp.dest(dest))

const copyBase = () => copy(config.base.src, `${config.dist}/`)

const copyFonts = () => copy(config.fonts.src, config.fonts.dest)

const copyRelease = () => copy('dist/**/*', '../')

const html = () => gulp
  .src(`${config.base.dest}*.html`)
  .pipe(htmlmin({
    removeComments: true,
    collapseWhitespace: true,
  }))
  .pipe(gulp.dest(config.base.dest))

const styles = () =>
  merge(
    gulp
      .src(config.styles.normalize),
    gulp
      .src(config.styles.src)
      .pipe(less())
      .pipe(autoprefixer())
      .pipe(cleanCss())
  )
  .pipe(concat(config.styles.main))
  .pipe(cleanCss({
    level: {
      1: {
        all: false,
        removeWhitespace: true,
        specialComments: 0,
      },
    },
  }))
  .pipe(header(config.banner))
  .pipe(gulp.dest(config.styles.dest))

const symbols = () => gulp
  .src(config.symbols.sketchFile)
  .pipe(sketch({
    export: 'artboards',
    formats: 'svg',
    clean: true,
    verbose: true,
  }))
  .pipe(iconfont({
    fontName: config.symbols.fontName,
    formats: ['ttf', 'eot', 'woff', 'woff2', 'svg'],
  }))
  .on('glyphs', (glyphs) => gulp
    .src(config.symbols.tmplSrc)
    .pipe(template({
      className: config.symbols.className,
      fontName: config.symbols.fontName,
      fontPath: config.symbols.fontPath,
      glyphs: glyphs.map((glyph) => ({
        name: glyph.name,
        codepoint: glyph.unicode[0].charCodeAt(0),
      })),
    }))
    .pipe(rename({ basename: config.symbols.fontName }))
    .pipe(gulp.dest(config.symbols.tmplDest))
  )
  .pipe(gulp.dest(config.symbols.fontDest))

const build = gulp.series(
  cleanDist,
  gulp.parallel(copyBase, copyFonts, styles),
  html,
)

const images = () => gulp
  .src(`${config.dist}/**/*.{png,jpg,jpeg,gif}`)
  .pipe(imagemin({ verbose: true }))
  .pipe(gulp.dest(`${config.dist}/`))

const reload = () => gulp
  .src(`${config.dist}/*.html`)
  .pipe(connect.reload())

const server = () => {
  connect.server({
    root: config.dist,
    port: config.server.port,
    livereload: true,
  })
}

const watch = () => gulp
  .watch(
    [config.base.src, config.styles.all],
    gulp.series(build, reload),
  )

const dev = gulp.series(
  build,
  gulp.parallel(server, watch),
)

const release = gulp.series(
  cleanRelease,
  build,
  images,
  copyRelease,
)

export {
  build,
  cleanDist,
  cleanRelease,
  copyRelease,
  dev,
  images,
  release,
  symbols,
}

export default build
