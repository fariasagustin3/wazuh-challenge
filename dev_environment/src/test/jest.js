// # Run Jest tests
//
// All args will be forwarded directly to Jest, e.g. to watch tests run:
//
//     node test/jest --watch
//
// or to build code coverage:
//
//     node test/jest --coverage
//
// See all cli options in https://facebook.github.io/jest/docs/cli.html

const path = require('path');
process.argv.push('--config', path.resolve(__dirname, './config.js'));

require('../../../src/setup_node_env');
const jest = require('../../../node_modules/jest');

jest.run(process.argv.slice(2));
