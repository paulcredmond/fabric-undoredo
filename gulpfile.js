/**
 * @file ./gulpfile.js
 * @file Fabric Undo/Redo
 * @version 1.0.0
 * @author Paul Redmond, paul.c.redmond@gmail.com
 */

// Run command 'gulp watch' for compilation and browser injection

var gulp        = require('gulp');
var pump        = require('pump');
var browserSync = require('browser-sync').create();
var ts          = require("gulp-typescript");

/****************** */
/* BrowerSync
/****************** */

// Static server + watching files
gulp.task('watch', ['ts', 'css'], function() {

    browserSync.init({
        server: {
            baseDir: "./",
            directory: true
        }
    });

    gulp.watch("./ts/*.ts", ['ts']);
    gulp.watch("./css/*.css", ['css']);
    gulp.watch("./*.html").on('change', browserSync.reload);
});

/****************** */
/* Compiler
/****************** */

// Compile TypeScript into JavaScript
gulp.task('ts', function () {
    return gulp.src(['ts/fabric-undoredo.ts'])
        .pipe(ts())
        .pipe(gulp.dest("js/"))
        .pipe(browserSync.stream());
});

// Inject CSS changes
gulp.task('css', function () {
    return gulp.src(['css/fabric-undoredo.css'])
        .pipe(browserSync.stream());
});