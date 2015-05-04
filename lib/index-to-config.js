var cheerio = require('cheerio');

module.exports = {
  convert: function(value) {
    var $ = cheerio.load(value.toString());
    var exportJson = {};

    exportJson.scripts = getScripts($);
    exportJson.stylesheets = getStyleSheets($);
    exportJson.environment = getEnvironment($);
    return JSON.stringify(exportJson);
  }
};

function getScripts($) {
  var scripts = {};
  var $scripts = $('script');

  var src;
  for (var i = 0, len = $scripts.length; i < len; i++) {
    src = $scripts.eq(i).attr('src');
    if (src && /vendor/.test(src)) {
      scripts.vendor = src;
    } else if (src && /thescene-frontend/.test(src)) {
      scripts.app = src;
    }
  }
  return scripts;
}

function getStyleSheets($) {
  var links = {};
  var $links = $('link');

  var href;
  for (var i = 0, len = $links.length; i < len; i++) {
    href = $links.eq(i).attr('href');
    if (href && /vendor/.test(href)) {
      links.vendor = href;
    } else if (href && /thescene-frontend/.test(href)) {
      links.app = href;
    }
  }
  return links;
}

function getEnvironment($) {
  var env = {};
  var $metas = $('meta');

  var name;
  for (var i = 0, len = $metas.length; i < len; i++) {
    name = $metas.eq(i).attr('name');
    if (name && /thescene-frontend/.test(name)) {
      env.name = name;
      env.content = $metas.eq(i).attr('content');
    }
  }
  return env;
}
