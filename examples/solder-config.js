/*global exports: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */

// This is a complete example of a Solder configuration file.

exports.config = {

  // Solder can push files to a CDN. Basic Amazon S3 support is built in.
  cdn: {
    type: 's3',

    options: {
      // Your Amazon Access Key ID and Secret Access Key can alternatively be
      // set using the AMAZON_ACCESS_KEY_ID and AMAZON_SECRET_ACCESS_KEY
      // environment variables.
      accessKeyId    : 'ABC123',
      secretAccessKey: 'XYZ789',

      bucket: 'my-bucket',

      gzip: true,

      // Optional path prefixes
      prefix: {
        css: 'css/',
        js : 'js/'
      },

      urlBase: 'http://my-bucket.s3.amazonaws.com'
    }
  },

  // Solder has built in support for YUI Compressor (CSS and JS) and Google
  // Closure Compiler (JS only). You'll need to provide your own jars.
  compressors: {
    css: {
      name   : 'yui',
      options: {
        jar: '/Users/brett/Library/Java/Extensions/yuicompressor.jar'
      }
    },

    js: {
      name   : 'yui',
      options: {
        jar: '/Users/brett/Library/Java/Extensions/yuicompressor.jar'
      }
    }

    // js: {
    //   name   : 'closure',
    //   options: {
    //     jar: '/Users/brett/Library/Java/Extensions/compiler.jar'
    //   }
    // }
  },

  // List of local paths to search (in order) for CSS and JS files referenced
  // by components.
  sourcePaths: [
    './public/css',
    './public/js'
  ],

  // A component is a group of CSS and/or JS files. Individual files can be on
  // the local file system or at remote URLs. Components can require other
  // components to create modular dependencies.
  //
  // If you reference remote URLs, Solder will attempt to cache them according
  // to any HTTP cache headers.
  components: {
    'yui-3.1.2': {
      js: [
        'http://yui.yahooapis.com/3.1.2/build/yui/yui.js',
        'http://yui.yahooapis.com/3.1.2/build/oop/oop-min.js',
        'http://yui.yahooapis.com/3.1.2/build/event-custom/event-custom-min.js',
        'http://yui.yahooapis.com/3.1.2/build/event/event-min.js',
        'http://yui.yahooapis.com/3.1.2/build/dom/dom-min.js',
        'http://yui.yahooapis.com/3.1.2/build/node/node-min.js'
      ]
    },

    'my-website': {
      requires: [ 'yui-3.1.2' ],

      css: [
        'my-website.css',
        'more-styles.css'
      ],

      js: [
        'my-website.js',
        'more-javascript.js'
      ]
    }
  }
};
