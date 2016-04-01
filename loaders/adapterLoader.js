'use strict';

const fs = require('fs');
const blockLoader = require('block-loader');
let adapters = require('../package.json').adapters;

var options = {
    start: '/** INSERT ADAPTERS - DO NOT EDIT OR REMOVE */',
    end: '/** END INSERT ADAPTERS */',
    process: function insertAdapters() {
      // read directory for adapter file names, map the file names to String.replace, use a
      // regex to remove file extensions, then return the array of adapter names
      const files = fs.readdirSync('src/adapters').map(file => file.replace(/\.[^/.]+$/, ''));

      // check if adapters are defined in package.json
      if (!adapters || !adapters.length) {
        console.log('Prebid Warning: adapters config not found in package.json, building with all' +
          ' adapters');

        // if no configuration is specified, load all adapters found
        adapters = files;
      };

      // find adapter names in array of file names to determine adapters to insert
      let inserts = adapters.filter(adapter => {
        if (files.includes(adapter)) {
          return adapter;
        } else {
          console.log(`Prebid Warning: no adapter found for ${adapter}, continuing.`);
        }
      });

      if (!inserts.length) {
        console.log('Prebid Warning: no matching adapters found for config, building with all' +
          ' adapters.');
      }

      // if no matching adapters build with all adapters found
      inserts = inserts.length ? inserts : files;

      // return the javascript strings to insert into adaptermanager.js
      return inserts.map((adapter) => {

        // appnexusAst adapter is in ES2015 syntax
        if (adapter === 'appnexusAst') {
          return `import { AppnexusAst } from './adapters/appnexusAst';` +
            `exports.registerBidAdapter(new AppnexusAst('appnexus'), 'appnexus');`;
        }

        // remaining adapters use ES5 `require` and `exports`
        return `var ${adapterName(adapter)} = require('./adapters/${adapter}.js');
          exports.registerBidAdapter(new ${adapterName(adapter)} ${useCreateNew(adapter)}(), '${adapter}');`;
      }).join('');
    }
  };

// utility to ProperCase variable names
function adapterName(adapter) {
  let result = adapter.split('');
  return result[0].toUpperCase() + result.join('').substr(1) + 'Adapter';
}

// some adapters export an object with a `createNew` constructor so accommodate this pattern
function useCreateNew(adapter) {
  return adapter === 'appnexus' ? '.createNew' : '';
}

module.exports = blockLoader(options);
