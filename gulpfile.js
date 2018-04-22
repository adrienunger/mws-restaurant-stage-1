var gulp = require('gulp');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var concat = require('gulp-concat');
var uglify = require('gulp-uglify-es').default;
var babel = require('gulp-babel');
var sourcemaps = require('gulp-sourcemaps');
var imagemin = require('gulp-imagemin');


gulp.task('copy-libs', function() {
	return gulp.src('./lib/**/*')
		.pipe(gulp.dest('./dist/lib'));
});

gulp.task('copy-html', function() {
	return gulp.src('./*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-sw', function() {
	return gulp.src('./sw.js')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-images', function() {
	return gulp.src('img_resp/*')
		.pipe(imagemin([imagemin.jpegtran({progressive: true})]))
		.pipe(gulp.dest('dist/img_resp'));
});

gulp.task('styles', function() {
	return gulp.src('sass/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({
			outputStyle: 'compressed'
		}).on('error', sass.logError))
		.pipe(autoprefixer({
			browsers: ['last 2 versions']
		}))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});

gulp.task('scripts-index', function() {
	return gulp.src(['js/dbhelper.js', 'js/main.js', 'js/off_canvas.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_index.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-restaurant', function() {
	return gulp.src(['js/dbhelper.js', 'js/restaurant_info.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_restaurant.js'))
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist-index', function() {
	return gulp.src(['js/dbhelper.js', 'js/main.js', 'js/off_canvas.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_index.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist-restaurant', function() {
	return gulp.src(['js/dbhelper.js', 'js/restaurant_info.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_restaurant.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});


gulp.task('default', gulp.series(gulp.parallel('copy-libs','copy-html', 'copy-images', 'copy-sw', 'styles', 'scripts-index', 'scripts-restaurant'), function() {
	gulp.watch('sass/**/*.scss').on('all', gulp.parallel('styles'));
	gulp.watch('./*.html').on('all', gulp.parallel('copy-html'));
	gulp.watch('./sw.js').on('all', gulp.parallel('copy-sw'));
	gulp.watch('./dist/*.html').on('change', browserSync.reload);

	browserSync.init({
		server: './dist',
		// Open the site in Chrome
		browser: "Chrome",
		port: 8000
	});
}));

gulp.task('dist', gulp.parallel(
	'copy-libs',
	'copy-html',
	'copy-images',
	'copy-sw',
	'styles',
	'scripts-dist-index',
	'scripts-dist-restaurant'
));