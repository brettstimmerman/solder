/*global require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var http     = require('http'),
    solder   = require('solder'),

    // By default Solder looks for a solder-config.js file in the current
    // directory unless one is specified.
    //
    //   solder.create('path/to/solder-config.js');
    //
    solderer = solder.create();

http.createServer(function (req, res) {
  // Use Solder's default URL matching regex, or create your own.
  var match = req.url.match(solder.urlPattern),
      options;

  if (match) {
    options = {
      name     : match[1],
      type     : match[2],
      nominify : /no\-?minify/.test(match[3])
    };

    solderer.solder(options, function (err, content, headers) {
      if (err) {
        res.writeHead(500);
        res.end(err.message);
      }
      else {
        res.writeHead(200, headers);
        res.end(content);
      }
    });
  }
  else {
    if (req.url !== '/favicon.ico') {
      res.writeHead(404);
      res.end(req.url + ' not found.');
    }
  }
}).listen(3000);

console.log('Solder HTTP example running at http://localhost:3000/');
