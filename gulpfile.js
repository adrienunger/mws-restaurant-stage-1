let gulp = require('gulp');
let sass = require('gulp-sass');
let autoprefixer = require('gulp-autoprefixer');
let browserSync = require('browser-sync').create();
let concat = require('gulp-concat');
let uglify = require('gulp-uglify-es').default;
let babel = require('gulp-babel');
let sourcemaps = require('gulp-sourcemaps');
let imagemin = require('gulp-imagemin');
let webp = require('gulp-webp');
let cleanCSS = require('gulp-clean-css');


gulp.task('copy-libs', function() {
	return gulp.src('./lib/**/*')
		.pipe(gulp.dest('./dist/lib'));
});

gulp.task('copy-manifest', function() {
	return gulp.src('./manifest.json')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-html', function() {
	return gulp.src('./*.html')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-sw', function() {
	return gulp.src('./sw.js')
		.pipe(gulp.dest('./dist'));
});

gulp.task('copy-pngs', function() {
	return gulp.src('img_resp/*.png')
		.pipe(gulp.dest('dist/img_resp'));
});

gulp.task('copy-images', function() {
	return gulp.src('img/*')
		.pipe(imagemin([imagemin.jpegtran({progressive: true})]))
		.pipe(webp({method:6}))
		.pipe(gulp.dest('dist/img'));
});

gulp.task('copy-resp-images', function() {
	return gulp.src('img_resp/*.jpg')
		.pipe(imagemin([imagemin.jpegtran({progressive: true})]))
		.pipe(webp({method:6}))
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
		.pipe(cleanCSS())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/css'))
		.pipe(browserSync.stream());
});

gulp.task('scripts-index', function() {
	return gulp.src(['js/dbhelper.js', 'js/main.js', 'js/off_canvas.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_index.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-restaurant', function() {
	return gulp.src(['js/dbhelper.js', 'js/restaurant_info.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_restaurant.js'))
		.pipe(uglify())
		.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist-index', function() {
	return gulp.src(['js/dbhelper.js', 'js/main.js', 'js/off_canvas.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		//.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_index.js'))
		.pipe(uglify())
		//.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});

gulp.task('scripts-dist-restaurant', function() {
	return gulp.src(['js/dbhelper.js', 'js/restaurant_info.js', 'js/googleMapsFocus.js', 'js/registerServiceWorker.js', 'js/idbData.js'])
		//.pipe(sourcemaps.init())
		.pipe(babel())
		.pipe(concat('all_restaurant.js'))
		.pipe(uglify())
		//.pipe(sourcemaps.write())
		.pipe(gulp.dest('dist/js'));
});


gulp.task('default', gulp.series(gulp.parallel('copy-manifest','copy-libs','copy-html', 'copy-images','copy-resp-images', 'copy-sw', 'styles', 'scripts-index', 'scripts-restaurant'), function() {
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
	'copy-manifest',
	'copy-libs',
	'copy-html',
	'copy-pngs',
	'copy-images',
	'copy-resp-images',
	'copy-sw',
	'styles',
	'scripts-dist-index',
	'scripts-dist-restaurant'
));