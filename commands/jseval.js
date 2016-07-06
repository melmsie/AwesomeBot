var vm = require('vm')

var stringify = o => JSON.stringify(o, null, 2)
var fixargs = args => Array.prototype.slice.call(args)

function safer_eval(code) {
  // global context exposed to the sandboxed code.
  // needs to be recreated every call or the context will get polluted
  var ctx = {};
  Object.defineProperty(ctx, 'log', {
    enumerable: false, configurable: false, writable: false,
    value: log
  })
  Object.defineProperty(ctx, 'console', {
    enumerable: false, configurable: false, writable: false,
    value: Object.freeze({ log: log, info: log, warn: log, error: log })
  })

  // log buffer to emulate console.log
  var buffer = []
  function log() {
    buffer.push(fixargs(arguments).map(stringify).join(' '))
  }

  var last_expression, error
  try {
    last_expression = vm.runInNewContext(code, ctx, {timeout: 100})
  } catch (e) {
    error = e
    last_expression = e.toString()
  }

  return {code, buffer, last_expression, error, ctx}
}

function handleJSEval(bot, message, cmd_args) {
  var comment_multi_line = s => s.split('\n').map(line => '// ' + line).join('\n');

  var code = cmd_args;
  var result = safer_eval(code);
  var buffer = result.buffer.length ?
    result.buffer.map(comment_multi_line).join('\n') + '\n' :
      '';

      var output = 'executing JavaScript... ```js\n' +
        result.code + '\n' + buffer +
          '//=> ' + result.last_expression + '```';
          return bot.reply(message, output);
}

module.exports = {
  handleJSEval: handleJSEval
}
