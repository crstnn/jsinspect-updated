const expect  = require('expect.js');
const Parser  = require('../lib/parser');

describe('parse', function() {
  describe('on error', function() {
    const src = '[_, = [1, 2, 3];';
    const filePath = 'broken.js';

    it('includes the filename of the file that failed to parse', function() {
      const fn = () => Parser.parse(src, filePath);
      expect(fn).to.throwException((err) => {
        expect(err.message).to.contain(filePath);
      });
    });

    it('includes a caret pointing to the unexpected token', function() {
      const fn = () => Parser.parse(src, filePath);
      expect(fn).to.throwException((err) => {
        expect(err.message).to.contain(`${src}\n    ^`);
      });
    });

    it('does not include the src line if longer than 100 chars', function() {
      const src = ' '.repeat(100) + ']';
      const fn = () => Parser.parse(src, filePath);
      expect(fn).to.throwException((err) => {
        expect(err.message).not.to.contain(`^`);
      });
    });
  });
});
