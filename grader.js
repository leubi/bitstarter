#!/usr/bin/env node

var fs = require('fs'),
  program = require('commander'),
  cheerio = require('cheerio'),
  rest = require('restler'),
  url = require('url'),
  HTMLFILE_DEFAULT = "index.html",
  CHECKSFILE_DEFAULT = "checks.json",
  URL_DEFAULT = 'http://google.com',
  assertFileExists = function (infile) {
    var instr = infile.toString();

    if (!fs.existsSync(instr)) {
      console.log("%s does not exist. Exiting.", instr);
      process.exit(1);
    }

    return instr;
  },
  cheerioHtmlFile = function (htmlFile) {
    return cheerio.load(fs.readFileSync(htmlFile));
  },
  loadChecks = function (checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
  },
  checkUrlFile = function (url, checksfile, cb) {
    rest.get(url).on('complete', function (res) {
      if (res instanceof Error) {
        console.log("%s does not seem to a valid reachable url. Exiting", url);
        process.exit(1);
      }

      var $ = cheerio.load(res.toString()),
        checks = loadChecks(checksfile).sort(),
        out = {};

      for (var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
      }

      cb(out);
    });
  },
  checkHtmlFile = function (htmlfile, checksfile) {
    var $ = cheerioHtmlFile(htmlfile),
      checks = loadChecks(checksfile).sort(),
      out = {};

    for (var ii in checks) {
      var present = $(checks[ii]).length > 0;
      out[checks[ii]] = present;
    }

    return out;
  },
  clone = function(fn) {
    return fn.bind({});
  };

if (require.main == module) {
  var checkJson = {}, outJson = {};

  program
    .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
    .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
    .option('-u, --url <url>', 'URI to a html file to check')
    .parse(process.argv);

  if(program.url) {
    checkUrlFile(program.url, program.checks, function (checkJson) {
      outJson = JSON.stringify(checkJson, null, 4);
      console.log(outJson);
    });
  } else {
    checkJson = checkHtmlFile(program.file, program.checks);
    outJson = JSON.stringify(checkJson, null, 4);
    console.log(outJson);
  }
} else {
  exports.checkHtmlFile = checkHtmlFile;
}
