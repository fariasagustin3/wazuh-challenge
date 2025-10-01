import './index.scss';

import { CustomPluginPlugin } from './plugin';

// This exports static code and TypeScript types,
// as well as, OpenSearch Dashboards Platform `plugin()` initializer.
export function plugin() {
  return new CustomPluginPlugin();
}
export { CustomPluginPluginSetup, CustomPluginPluginStart } from './types';
