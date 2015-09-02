var gulp = require('gulp');
var gutil = require('gulp-util');
var path = require("path");
var sass = require('gulp-sass');
var autoprefixer = require("gulp-autoprefixer");
var csso = require('gulp-csso');
var sourcemaps = require('gulp-sourcemaps');
var livereload = require('gulp-livereload');
var webpack = require("webpack");
var jshint = require('gulp-jshint');

var getWebpackConfig = function() {
  return {
    context: __dirname + "/src/scripts",
    entry: {
      Core: "./Core",
      Editor: "./Editor",
    },
    devtool: "source-map",
    externals: [
      'd3',
      'spectrum',
      {
        'js-signals': {
          root: 'signals',
          commonjs: './signals',
          amd: 'signals'
        },
        'draggable-number.js': {
          root: 'DraggableNumber',
          commonjs: 'DraggableNumber',
          commonjs2: 'DraggableNumber',
          amd: 'DraggableNumber'
        },
        'gsap': {
          root: 'TweenMax',
          commonjs: 'TweenMax',
          commonjs2: 'TweenMax',
          amd: 'TweenMax'
        },
        'jquery': {
          root: '$',
          commonjs: 'jquery',
          commonjs2: 'jquery',
          amd: 'jquery'
        },
        'lodash': {
          root: '_',
          commonjs: "lodash",
          commonjs2: "lodash",
          amd: "lodash"
        }
      }
    ],
    output: {
        path: path.join(__dirname, "dist/scripts"),
        filename: "TweenTime.[name].js",
        libraryTarget: "umd",
        library: ["TweenTime", "[name]"]
    },
    module: {
      loaders: [
        { test: /\.js$/, exclude: [/bower_components/, /node_modules/, /dist/], loader: 'babel-loader'},
        { test: /\.tpl.html$/, loader: 'mustache'},
      ],
    },
    plugins: [
      new webpack.ResolverPlugin(
          new webpack.ResolverPlugin.DirectoryDescriptionFilePlugin("bower.json", ["main"])
      )
    ],
  };
};

gulp.task('lint-scripts', function() {
  gulp.src([
    'src/scripts/**/*.js',
    '!src/scripts/bower_components/**'
    ])
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('scripts', function(cb) {
  var conf = getWebpackConfig();
  webpack(conf, function(err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
        chunks: false
    }));
    cb();
  });
});

gulp.task('scripts:dist', ['lint-scripts'], function(cb) {
  var conf = getWebpackConfig();
  // Add .min.js to output filename.
  conf.output.filename = "TweenTime.[name].min.js";
  // Add minification with UglifyJs.
  conf.plugins.push(new webpack.optimize.UglifyJsPlugin({
    mangle: true,
    output: {
      comments: false
    },
    compress: {
      drop_debugger: false,
      sequences: true,
      //dead_code: true,
      conditionals: true,
      booleans: true,
      unused: true,
      if_return: true,
      join_vars: true,
      drop_console: false
    }
  }));
  webpack(conf, function(err, stats) {
    if(err) throw new gutil.PluginError("webpack", err);
    gutil.log("[webpack]", stats.toString({
        chunks: false
    }));
    cb();
  });
});

gulp.task('styles', function() {
  gulp.src('src/styles/editor.sass')
    .pipe(sourcemaps.init())
    .pipe(sass({
      sourceComments: false,
      omitSourceMapUrl: true,
      errLogToConsole: true
    }))
    .pipe(sourcemaps.write({includeContent: false}))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(autoprefixer({
      browsers: ['> 5%', 'last 2 versions'],
      cascade: false
    }))
    //.pipe(csso()) ... still no sourcemaps support https://github.com/ben-eb/gulp-csso/issues/4
    .pipe(sourcemaps.write('./maps'))
    .pipe(gulp.dest('./dist/styles/'));
});

gulp.task('livereload', function() {
  livereload.listen();
});

gulp.task('watch', function() {
  gulp.watch(['examples/*.html'], livereload.changed);
  gulp.watch(['dist/styles/*.css', 'dist/scripts/*.js'], livereload.changed);
  gulp.watch('src/styles/**', ['styles']);
  gulp.watch(['src/scripts/**', '!src/scripts/bower_components/**'], ['scripts:dist']);
});

gulp.task('default', ['watch', 'livereload', 'styles', 'scripts:dist']);
gulp.task('build', ['styles', 'scripts', 'scripts:dist']);
