// borrowed from npm
//   http://github.com/isaacs/npm/blob/master/lib/utils/mkdir-p.js

/*
Copyright 2009, 2010 Isaac Zimmitti Schlueter. All rights reserved.
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to
deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.
*/
var fs   = require('fs'),
    path = require('path');

module.exports = mkdir

function mkdir (ensure, chmod, cb) {
  ensure = ensure.replace(/\/+$/, '')
  if (ensure.charAt(0) !== "/") ensure = path.join(process.cwd(), ensure)
  var dirs = ensure.split("/")
    , walker = []
  if (arguments.length < 3) {
    cb = chmod
    chmod = 0755
  }
  walker.push(dirs.shift()) // gobble the "/" first
  ;(function S (d) {
    if (d === undefined) return cb()
    walker.push(d)
    var dir = walker.join("/")
      // must be a real dir!
      , stat = (dir === ensure) ? "lstat" : "stat"
    fs[stat](dir, function STATCB (er, s) {
      if (er) {
        fs.mkdir(dir, chmod, function MKDIRCB (er, s) {
          if (er && er.message.indexOf("EEXIST") === 0) {
            // When multiple concurrent actors are trying to ensure the same directories,
            // it can sometimes happen that something doesn't exist when you do the stat,
            // and then DOES exist when you try to mkdir.  In this case, just go back to
            // the stat to make sure it's a dir and not a file.
            return fs.stat(dir, STATCB)
          }
          if (er) return cb(new Error(
            "Failed to make "+dir+" while ensuring "+ensure+"\n"+er.message))
          S(dirs.shift())
        })
      } else {
        if (s.isDirectory()) S(dirs.shift())
        else cb(new Error("Failed to mkdir "+dir+": File exists"))
      }
    })
  })(dirs.shift())
}

