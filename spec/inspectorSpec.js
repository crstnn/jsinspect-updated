var expect       = require('expect.js');
var EventEmitter = require('events').EventEmitter;
var Inspector    = require('../lib/inspector');
var fixtures     = require('./fixtures');

describe('Inspector', function() {
  // Used to test emitted events
  var found;
  var listener = function(match) {
    found.push(match);
  };

  beforeEach(function() {
    found = [];
  });

  describe('constructor', function() {
    it('inherits from EventEmitter', function() {
      expect(new Inspector()).to.be.an(EventEmitter);
    });

    it('accepts an array of file paths', function() {
      var filePaths = ['path1.js', 'path2.js'];
      var inspector = new Inspector(filePaths);
      expect(inspector._filePaths).to.be(filePaths);
    });

    it('assigns a default threshold of 30', function() {
      var inspector = new Inspector([]);
      expect(inspector._threshold).to.be(30);
    });

    it('accepts an options object', function() {
      var opts = {threshold: 12};
      var inspector = new Inspector([], opts);
      expect(inspector._threshold).to.be(opts.threshold);
    });
  });

  describe('run', function() {
    it('emits a start event', function() {
      var emitted;
      var inspector = new Inspector([fixtures.intersection]);
      inspector.on('start', function() {
        emitted = true;
      });

      inspector.run();
      expect(emitted).to.be(true);
    });

    it('emits an end event', function() {
      var emitted;
      var inspector = new Inspector([fixtures.intersection]);
      inspector.on('end', function() {
        emitted = true;
      });

      inspector.run();
      expect(emitted).to.be(true);
    });

    it('emits the "match" event when a match is found', function() {
      var inspector = new Inspector([fixtures.intersection], {
        threshold: 10
      });

      inspector.on('match', listener);
      inspector.run();
      expect(found).to.have.length(1);
    });
  });

  it('can find an exact match between instances', function() {
    var inspector = new Inspector([fixtures.intersection], {
      threshold: 15
    });

    inspector.on('match', listener);
    inspector.run();

    var match = found[0];
    expect(found).to.have.length(1);
    expect(match.instances).to.have.length(2);
    expect(match.instances[0].start).to.eql({line: 1, index: 0, column: 0});
    expect(match.instances[0].end).to.eql({line: 5, index: 114, column: 1});
    expect(match.instances[1].start).to.eql({line: 7, index: 116, column: 0});
    expect(match.instances[1].end).to.eql({line: 11, index: 230, column: 1});
  });

  it('can find the largest match between two instances', function() {
    var inspector = new Inspector([fixtures.redundantIntersection], {
      threshold: 11
    });

    inspector.on('match', listener);
    inspector.run();

    var match = found[0];
    expect(found).to.have.length(1);
    expect(match.instances).to.have.length(2);
    expect(match.instances[0].start).to.eql({line: 1, index: 0, column: 0});
    expect(match.instances[0].end).to.eql({line: 9, index: 186, column: 1});
    expect(match.instances[1].start).to.eql({line: 11, index: 188, column: 0});
    expect(match.instances[1].end).to.eql({line: 19, index: 374, column: 1});
  });

  it('supports ES6', function() {
    var inspector = new Inspector([fixtures.es6ClassExport], {
      threshold: 20
    });

    inspector.on('match', listener);
    inspector.run();

    var match = found[0];
    expect(found).to.have.length(1);
    expect(match.instances).to.have.length(2);
    expect(match.instances[0].start).to.eql({line: 2, index: 54, column: 2});
    expect(match.instances[0].end).to.eql({line: 6, index: 167, column: 3});
    expect(match.instances[1].start).to.eql({line: 8, index: 171, column: 2});
    expect(match.instances[1].end).to.eql({line: 12, index: 284, column: 3});
  });

  it('supports JSX', function() {
    var inspector = new Inspector([fixtures.jsxTodo], {
      threshold: 20
    });

    inspector.on('match', listener);
    inspector.run();

    var match = found[0];
    expect(found).to.have.length(1);
    expect(match.instances).to.have.length(2);
    expect(match.instances[0].start).to.eql({line: 3, index: 34, column: 0});
    expect(match.instances[0].end).to.eql({line: 9, index: 165, column: 1});
    expect(match.instances[1].start).to.eql({line: 11, index: 167, column: 0});
    expect(match.instances[1].end).to.eql({line: 17, index: 299, column: 1});
  });

  it('supports TS', function() {
    var inspector = new Inspector([fixtures.tsIntersection], {
      threshold: 20
    });

    inspector.on('match', listener);
    inspector.run();

    var match = found[0];
    expect(found).to.have.length(1);
    expect(match.instances).to.have.length(2);
    expect(match.instances[0].start).to.eql({line: 1, index: 0, column: 0});
    expect(match.instances[0].end).to.eql({line: 5, index: 143, column: 1});
    expect(match.instances[1].start).to.eql({line: 7, index: 145, column: 0});
    expect(match.instances[1].end).to.eql({line: 11, index: 288, column: 1});
  });

  it('includes the lines with the match', function() {
    var inspector = new Inspector([fixtures.intersection], {
      threshold: 11,
    });

    inspector.on('match', listener);
    inspector.run();

    var match = found[0];
    expect(found).to.have.length(1);
    expect(match.instances).to.have.length(2);
    expect(match.instances[0].lines).to.be(
      'function intersectionA(array1, array2) {\n' +
      '  array1.filter(function(n) {\n' +
      '    return array2.indexOf(n) != -1;\n' +
      '  });\n' +
      '}'
    );
    expect(match.instances[1].lines).to.be(
      'function intersectionB(arrayA, arrayB) {\n' +
      '  arrayA.filter(function(n) {\n' +
      '    return arrayB.indexOf(n) != -1;\n' +
      '  });\n' +
      '}'
    );
  });

  it('ignores matches with less than the supplied minimum', function() {
    var inspector = new Inspector([fixtures.matches], {
      threshold: 2,
      minInstances: 3
    });

    inspector.on('match', listener);
    inspector.run();
    expect(found).to.have.length(1);
    expect(found[0].instances).to.have.length(3);
  });

  it('ignores CommonJS require statements', function() {
    var inspector = new Inspector([fixtures.commonjs], {
      threshold: 3
    });

    inspector.on('match', listener);
    inspector.run();
    expect(found).to.have.length(0);
  });

  it('ignores AMD define expressions', function() {
    var inspector = new Inspector([fixtures.amd], {
      threshold: 5
    });

    inspector.on('match', listener);
    inspector.run();
    expect(found).to.have.length(0);
  });
});
