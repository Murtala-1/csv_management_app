const path = require('path');

module.exports = function override(config, env) {
  // Remove fork-ts-checker-webpack-plugin
  config.plugins = config.plugins.filter(
    plugin => plugin.constructor.name !== 'ForkTsCheckerWebpackPlugin'
  );
  
  return config;
};
