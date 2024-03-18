const babelParser = require("@babel/parser");
const debug = require('./debug');

/**
 * Parses the specified src string with babel/parser, returning the resulting AST
 * and skipping the undocumented File root node, which is neither babel/parser AST
 * nor ESTree spec compliant.
 *
 * @param {string} src      Source to parse
 * @param {string} filePath Path to the file
 */
exports.parse = function (src, filePath) {
  debug(`parsing ${filePath}`);
  try {
    return attempt(
      () => _parse(src, filePath, 'script'),
      () => _parse(src, filePath, 'module')
    );
  } catch (err) {
    const ctx = getErrorContext(err, src);
    throw new Error(`Couldn't parse ${filePath}: ${err.message}${ctx}`);
  }
};

function attempt(...fns) {
  for (let i = 0; i < fns.length; i++) {
    try {
      return fns[i]();
    } catch (err) {
      if (i === fns.length - 1) throw err;
    }
  }
}

function _parse(src, filePath, sourceType) {
  return babelParser.parse(src, {
    allowReturnOutsideFunction: true,
    allowImportExportEverywhere: true,
    sourceType: sourceType,
    sourceFilename: filePath,
    plugins: ['jsx', 'typescript', 'doExpressions', 'decorators',
      'asyncGenerators', 'functionBind', 'functionSent', 'dynamicImport']
  }).program;
}

function getErrorContext(err, src) {
  if (!err.loc || !err.loc.line || err.loc.column >= 100) return '';

  const line = src.split('\n')[err.loc.line - 1];
  const caret = ' '.repeat(err.loc.column) + '^';

  return `\n${line}\n${caret}`;
}
