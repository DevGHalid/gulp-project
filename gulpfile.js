const gulp = require("gulp"),
  sass = require("gulp-sass"),
  browserSync = require("browser-sync"),
  del = require("del"),
  autoprefixer = require("gulp-autoprefixer"),
  nunjucks = require("gulp-nunjucks-render"),
  prettify = require("gulp-html-prettify"),
  concat = require("gulp-concat"),
  uglify = require("gulp-uglifyjs"),
  cssnano = require("gulp-cssnano"),
  rename = require("gulp-rename"),
  imagemin = require("gulp-imagemin"),
  pngquant = require("imagemin-pngquant"),
  imageminJpegRecompress = require("imagemin-jpeg-recompress"),
  cache = require("gulp-cache"),
  ftp = require("vinyl-ftp"),
  gutil = require("gulp-util"),
  mainBowerFiles = require("main-bower-files"),
  minifyCSS = require("gulp-csso");

// NUNJUCKS

// test

gulp.task("nunjucks", function() {
  return gulp
    .src("app/njk/*.njk")
    .pipe(nunjucks())
    .pipe(
      prettify({
        indent_size: 4
      }).pipe(gulp.dest("app"))
    )
    .pipe(browserSync.reload({ stream: true }));
});

// SASS

gulp.task("sass", function() {
  return gulp
    .src("app/sass/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(
      autoprefixer(["last 15 versions", "> 1%", "ie 8", "ie 7"], {
        cascade: true
      })
    )
    .pipe(gulp.dest("app/css"))
    .pipe(browserSync.reload({ stream: true }));
});

// BROWSER SYNC

gulp.task("browser-sync", function() {
  browserSync({
    server: {
      baseDir: "app"
    },
    notify: false
  });
});

// MAIN BOWER FILES

gulp.task("main-files", function() {
  return gulp
    .src(
      mainBowerFiles({
        base: "app/bower",
        includeDev: true
      })
    )
    .pipe(gulp.dest("app/libs"));
});

// SCRIPTS

gulp.task("scripts", ["main-files"], function() {
  return gulp
    .src(["app/libs/jquery.js", "app/libs/*.js"])
    .pipe(concat("libs.js"))
    .pipe(gulp.dest("app/js"));
});

// CSS LIBS

gulp.task("css-libs", ["main-files"], function() {
  return gulp
    .src("app/libs/*.css")
    .pipe(concat("libs.css"))
    .pipe(cssnano())
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest("app/css"));
});

// IMG

gulp.task("img", ["uploads"], function() {
  return gulp
    .src("app/img/**/*")
    .pipe(
      cache(
        imagemin(
          [
            imageminJpegRecompress({
              min: 65,
              max: 70
            }),
            pngquant({
              quality: "65-70",
              speed: 5
            })
          ],
          { verbose: true }
        )
      )
    )
    .pipe(gulp.dest("dist/img"));
});

gulp.task("uploads", function() {
  return gulp
    .src("app/uploads/**/*")
    .pipe(
      cache(
        imagemin(
          [
            imageminJpegRecompress({
              min: 65,
              max: 70
            }),
            pngquant({
              quality: "65-70",
              speed: 5
            })
          ],
          { verbose: true }
        )
      )
    )
    .pipe(gulp.dest("dist/uploads"));
});

// WATCH

gulp.task(
  "watch",
  ["browser-sync", "nunjucks", "sass", "scripts", "css-libs", "img"],
  function() {
    gulp.watch("app/**/*.njk", ["nunjucks"]);
    gulp.watch("app/*.html", browserSync.reload);
    gulp.watch("app/sass/**/*.scss", ["sass"]);
    gulp.watch("app/js/**/*.js", browserSync.reload);
  }
);

// CLEAN DIST

gulp.task("clean", function() {
  return del.sync("dist");
});

// BUILD PROJECT

const ALL_TASK = ["clean", "nunjucks", "sass", "scripts", "css-libs", "img"];

gulp.task("build", ALL_TASK, function() {
  var buildHtml = gulp.src("app/*.html").pipe(gulp.dest("dist"));

  gulp
    .src("app/css/**/*.css")
    .pipe(minifyCSS())
    .pipe(gulp.dest("dist/css"));

  gulp
    .src(["app/js/**/*.js"])
    .pipe(uglify())
    .pipe(gulp.dest("dist/js"));

  gulp.src("app/fonts/**/*").pipe(gulp.dest("dist/fonts"));
});

// DEPLOY

//test tag

gulp.task("deploy", function() {
  var dir = "ksr.rasel.site",
    conn = ftp.create({
      host: "rasel.site",
      user: "raselsit",
      password: "935S8NDQy8",
      parallel: 1,
      log: gutil.log
    });

  return gulp
    .src("dist/**/*", { buffer: false })
    .pipe(conn.newer("/" + dir))
    .pipe(conn.dest("/" + dir));
});

// CLEAR CACHE

gulp.task("clear", function() {
  return cache.clearAll();
});

// SET COMMAND GULP FOR WATCH

gulp.task("default", ["watch"]);
