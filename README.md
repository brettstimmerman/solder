# Solder

Solder combines and minifies groups of CSS and/or JavaScript files in
real-time for easy development and debugging.

When you're ready to build a release, Solder creates combined and minified files for production.

Solder is a port of [Weld](http://github.com/rgrove/weld) to work with
[Node](http://nodejs.org).

## Installation

    $ npm install solder

## Usage

    $ solder --help

### Components

Components are groups of CSS and/or JS files. Individual files can be on
the local file system or at remote URLs. Components can require other
components to create modular dependencies.

### CSS & JS Compressors

Solder has built in support for
[YUI Compressor](http://developer.yahoo.com/yui/compressor/) for CSS and JS,
and  [Google Closure Compiler](http://code.google.com/closure/compiler/) for
JS only. However, you must provide your own jars.

### Configuration

Solder looks in the current directory for a configuration file named
`solder-config.js` unless an alternate configuration file is specified.

See `examples/solder-config.js` for a simple complete Solder configuration.

### App Integration

Solder can be used directly from your app to serve components during
development.

#### Express

Most [Express](http://expressjs.com) applications can benefit from Solder's
Express Route one-liner. In fact, the following example is a complete Solder
server.

    var server = require('express').createServer(),
        solder = require('solder');

    solder.expressRoute(server);

    server.listen(3000);

#### Other

If you're not using Express, Solder can be used directly from within any
application. Just match request URLs against Solder's `urlPattern` regular
expression -- or your own regex -- and then process the matches.

See `examples/http.js` directory for an example of a custom setup.

### Stand-alone Server

The `solder` command-line tool includes a stand-alone Solder server. Just run
`solder` with no arguments. The Solder server will listen on port 8675 unless
a port is specified.

    $ solder
    Solder server started at http://localhost:8675/

### Solder URLs

At runtime, Solder acts on URLs beginning with `/solder`.

    http://example.com/solder/foo.css

The filename `foo.css` tells Solder to serve the `css` portion of the
component named `foo`.

If you don't want Solder to minify your components, add the `no-minify` query
parameter.

    http://example.com/solder/foo.css?no-minify

### Build Time

Use the `solder` command-line tool to concatenate and compress one or more
components in a single step.

    $ solder foo
    --> foo-201009042022.css
    --> foo-201009042022.js

Use the `-o` (`--output-dir`) option to save soldered files to a specific
directory.

#### CDN

Use the `-p` (`--push`) option to push soldered files to the configured CDN
instead of saving them locally. Basic Amazon S3 support is built in.

## Contributors

   * Brett Stimmerman &lt;brettstimmerman@gmail.com>
   * Ryan Grove &lt;ryan@wonko.com> (Original author of Weld)

## License

Solder is licensed under the same terms as Weld, the MIT License.
