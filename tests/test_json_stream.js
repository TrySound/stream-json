'use strict';

const unit = require('heya-unit');

const StreamJsonObjects = require('../utils/StreamJsonObjects');

const ReadString = require('./ReadString');

unit.add(module, [
  function test_json_objects(t) {
    const async = t.startAsync('test_json_objects');

    const stream = StreamJsonObjects.withParser(),
      pattern = [1, 2, 3, true, false, '', 'Abc', [], [1], [1, []], {}, {a: 1}, {b: {}, c: [{}]}],
      result = [];

    stream.output.on('data', data => (result[data.index] = data.value));
    stream.output.on('end', () => {
      eval(t.TEST('t.unify(pattern, result)'));
      async.done();
    });

    new ReadString(pattern.map(value => JSON.stringify(value)).join(' ')).pipe(stream.input);
  },
  function test_no_json_objects(t) {
    const async = t.startAsync('test_no_json_objects');

    const stream = StreamJsonObjects.withParser(),
      result = [];

    stream.on('data', data => (result[data.index] = data.value));
    stream.on('end', () => {
      eval(t.TEST('!result.length'));
      async.done();
    });

    new ReadString('').pipe(stream);
  },
  function test_json_objects_filter(t) {
    const async = t.startAsync('test_json_objects_filter');

    const f = assembler => {
      if (assembler.depth == 1 && assembler.key === null) {
        if (assembler.current instanceof Array) {
          return false; // reject
        }
        switch (assembler.current.a) {
          case 'accept':
            return true; // accept
          case 'reject':
            return false; // reject
        }
      }
      // undecided
    };

    const stream = StreamJsonObjects.withParser({objectFilter: f}),
      input = [
        0,
        1,
        true,
        false,
        null,
        {},
        [],
        {a: 'reject', b: [[[]]]},
        ['c'],
        {a: 'accept'},
        {a: 'neutral'},
        {x: true, a: 'reject'},
        {y: null, a: 'accept'},
        {z: 1234, a: 'neutral'},
        {w: '12', a: 'neutral'}
      ],
      result = [];

    stream.output.on('data', object => result.push(object.value));
    stream.output.on('end', () => {
      result.forEach(o => {
        if (typeof o == 'object' && o) {
          eval(t.TEST('!(o instanceof Array)'));
          eval(t.TEST("o.a === 'accept'"));
        } else {
          eval(t.TEST('false')); // shouldn't be here
        }
      });
      async.done();
    });

    new ReadString(input.map(value => JSON.stringify(value)).join(' ')).pipe(stream.input);
  },
  function test_json_objects_filter_include(t) {
    const async = t.startAsync('test_json_objects_filter_include');

    const f = assembler => {
      if (assembler.depth == 1 && assembler.key === null) {
        if (assembler.current instanceof Array) {
          return false; // reject
        }
        switch (assembler.current.a) {
          case 'accept':
            return true; // accept
          case 'reject':
            return false; // reject
        }
      }
      // undecided
    };

    const stream = StreamJsonObjects.withParser({objectFilter: f, includeUndecided: true}),
      input = [
        0,
        1,
        true,
        false,
        null,
        {},
        [],
        {a: 'reject', b: [[[]]]},
        ['c'],
        {a: 'accept'},
        {a: 'neutral'},
        {x: true, a: 'reject'},
        {y: null, a: 'accept'},
        {z: 1234, a: 'neutral'},
        {w: '12', a: 'neutral'}
      ],
      result = [];

    stream.output.on('data', object => result.push(object.value));
    stream.output.on('end', () => {
      result.forEach(o => {
        if (typeof o == 'object' && o) {
          eval(t.TEST('!(o instanceof Array)'));
          eval(t.TEST("o.a !== 'reject'"));
        } else {
          eval(t.TEST("o === null || typeof o != 'object'"));
        }
      });
      async.done();
    });

    new ReadString(input.map(value => JSON.stringify(value)).join(' ')).pipe(stream.input);
  }
]);
