import { PluginInitializerContext } from '../../../src/core/server';
import { CustomPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.

export function plugin(initializerContext: PluginInitializerContext) {
  return new CustomPluginPlugin(initializerContext);
}

export { CustomPluginPluginSetup, CustomPluginPluginStart } from './types';
