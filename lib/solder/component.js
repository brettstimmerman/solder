/*global exports: true, require: true */
/*jslint onevar: true, undef: true, nomen: true, eqeqeq: true, bitwise: true, newcap: true, immed: true */
var fs         = require('fs'),
    path       = require('path'),
    request    = require('request'),

    Compressor = require('solder/compressor'),
    version    = require('solder/version');

function Component(solderer, name, config) {
  this.solderer = solderer;
  this.name     = name;
  this.css      = config.css || [];
  this.js       = config.js || [];
  this.requires = config.requires || [];
  console.log(config);
  this.compressors = config.compressors || this.solderer.config.compressors;

  this.cdn = null;

  this.filenameCache = {};
}

Component.prototype.push = function (filename, type, options, callback) {
  var self = this;

  this.initCdn(type, function (err) {
    if (err) {
      return callback (err);
    }
    self.cdn.push(filename, type, options, function (err, url) {
      if (err) {
        return callback(err);
      }

      callback(null, url);
    });
  });
};

Component.prototype.compress = function (type, callback) {
  var compressors = this.compressors,
      compressor, compressorName, options;
     

  var handlers = [];
  
  if (compressors && compressors[type]) {
    
      //Just one compressor was given  
      if (compressors[type].name) {
          compressors[type] = [compressors[type]];
      }
  
      for (var i=0;i<compressors[type].length;i++) {
          handlers.push(Compressor.create(compressors[type][i].name, type, compressors[type][i].options || {}))
      }
  }
  
  this.merge(type, function (err, merged) {
    if (err) {
      return callback(err);
    }

    var doHandler=function(err,compressed,i) {
        if (err) {
            return callback(err);
        }
        
        //We've done all the handlers
        if (!handlers[i]) {
            return callback(null, compressed);
        }
        
        handlers[i].compress(compressed, function (_err,_compressed) {
            doHandler(_err,_compressed,++i);
        });
    }
    
    doHandler(null,merged,0);
    
  });
};

Component.prototype.merge = function (type, callback) {
  if (!({'js':1, 'css':1})[type]) {
    return callback(new Error('Unsupported file type: ' + type));
  }

  var content    = [],
      numResults = 0,
      self       = this,
      fileList   = this[type],
      numFiles   = fileList.length;

  fileList.forEach((function (numFiles) {
    return function (filename, index) {
      self.readFile(filename, function (err, data) {
        if (err) {
          return callback(err);
        }

        content[index] = data;
        numResults += 1;

        if (numResults === numFiles) {
          callback(null, content.join('\n'));
        }
      });
    };
  }(numFiles)));
};

// -- Protected --------------------------------------------------------------

Component.prototype.initCdn = function (type, callback) {
  if (this.cdn) {
    return callback(null);
  }

  var cdnConfig = this.solderer.config.cdn,
      cdnType   = cdnConfig.type;

  if (!(cdnConfig && cdnType)) {
    return callback(new Error('No CDN Configured'));
  }

  try {
    this.cdn = require('solder/cdn/' + cdnType).create(cdnConfig.options || {});
  } catch (err) {
    callback(err);
  }

  callback(null);
};

Component.prototype.readFile = function (filename, callback) {
  var self = this;
  this.resolveFilename(filename, function (err, filename) {
    if (err) {
      return callback(err);
    }

    if (/^(?:https?|ftp):\/\//.test(filename)) {
      self.solderer.cache.fetch(filename, function (err, value) {
        if (err) {
          return callback(err);
        }

        if (value) {
          return callback(null, value);
        }

        request({uri: filename, headers: {'User-Agent': version.userAgent() }},
            function (error, response, body) {
               var status  = response.statusCode,
                   expires = response.headers.expires;

               if (!error && status === 200) {
                 if (expires) {
                   expires = Math.floor((new Date(expires)).getTime / 1000);
                   self.solderer.cache.store(filename, body, expires,
                     function (err, value) { /* ignore for now */ }
                   );
                 }

                 callback(null, body);
               } else {
                 callback(new Error('Component URL returned HTTP status ' +
                    status + ': ' + filename));
               }
             }
        );
      });
    }
    else {
      fs.readFile(filename, 'utf-8', function (err, data) {
        if (err) {
          return callback(new Error('Unable to read file contents: ' +
              filename));
        }

        callback(null, data);
      });
    }
  });
};

Component.prototype.resolveFilename = function (filename, callback) {
  if (/^(?:https?|ftp):\/\//.test(filename)) {
    return callback(null, filename);
  }
  else {
    
    //Absolute path
    if (filename.charAt(0)=="/") {
        return callback(null, filename);
    }
      
    this.solderer.config.sourcePaths.forEach(function (sourcePath) {
      sourcePath = path.join(sourcePath, filename);

      fs.realpath(sourcePath, function (err, fullPath) {
        if (err) {
          return callback(err);
        }

        path.exists(fullPath, function (exists) {
          if (!exists) {
            return callback(new Error('Component file not found: ' + fullPath));
          }

          callback(null, fullPath);
        });
      });
    });
  }
};

// -- Exports ----------------------------------------------------------------

exports.create = function (solderer, name, config) {
  return new Component(solderer, name, config);
};
