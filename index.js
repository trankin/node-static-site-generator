'use strict';

var fs    = require('fs');
var map   = require('map-stream');
var vash  = require("vash");
var yaml  = require('js-yaml');
var gutil = require('gulp-util');
var path  = require('path');




module.exports = function (options) {
  var opts = options || {};
  opts.viewPath = opts.viewPath || path.resolve('./layouts');
  opts.renderedFileExtension = opts.renderedFileExtension || ".html";

  vash.config.settings = vash.config.settings || {};
  vash.config.settings.views = opts.viewPath;



  function renderContent (file, cb) {

    render(file.contents, function(err, fileContents){
      if(!err) {
        file.contents = fileContents;
        file.path = gutil.replaceExtension(file.path, opts.renderedFileExtension);
        cb(null, file);
      } else {
        cb(err, file);
      }
    });
  }

  return map(renderContent);
};


var render = function(content, callback) {

      content = content.toString();
      var metadata = '';
      var templateSrc = content;
      if (content.slice(0, 3) === '---') {
          var result = content.match(/^-{3,}\s([\s\S]*?)-{3,}(\s[\s\S]*|\s?)$/);
          if ((result != null ? result.length : void 0) === 3) {
              metadata = result[1];
              templateSrc = result[2];
          }
      } else if (content.slice(0, 12) === '```metadata\n') {
          end = content.indexOf('\n```\n');
          if (end !== -1) {
              metadata = content.substring(12, end);
              templateSrc = content.substring(end + 5);
          }
      }

      var model = {};
      if (metadata !== "") {
          model = yaml.load(metadata);
      }

      
      try {
          var tpl = vash.compile(templateSrc);
          var out = tpl(model, function sealLayout(err, ctx){
              ctx.finishLayout();
          });
        
          callback(null, new Buffer(out));  

      } catch(e) {
          callback(new gutil.PluginError("Template Render Error", e.toString()));
      }

}
