#!/usr/bin/env node
/**
 * Copyright 2015-present Desmond Yao
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Created by desmond on 4/16/17.
 * @flow
 */


'use strict';
require('./src/setupBabel');

const fs = require('fs');
const path = require('path');
const Util = require('./src/utils');
const Parser = require('./src/parser');
const bundle = require('./src/bundler');

const options = require('minimist')(process.argv.slice(2));
const commands = options._;

if (!options.config) {
  throw new Error('You must enter an config file (by --config).');
}
if (commands.length === 0 && (options.h || options.help)) {
  console.log([
    '',
    '  Usage: reactNativeSplit [command] [options]',
    '',
    '',
    '  Commands:',
    ' split ',
    '',
    '  Options:',
    '',
    '    -h, --help    output usage information',
    '',
  ].join('\n'));
  process.exit(0);
}
if (commands.length === 0) {
  console.error(
    'You did not pass any commands, run `reactNativeSplit --help` to see a list of all available commands.'
  );
  process.exit(1);
}

switch (commands[0]) {
case 'split':
  runSplit(commands[1], options);
  break;
default:
  console.error(
    'Command `%s` unrecognized. ' +
    'Make sure that you have run `npm install` .',
    commands[0]
  );
  process.exit(1);
  break;
}
function runSplit(){
  const configFile = path.resolve(process.cwd(), options.config);
  const outputDir = path.resolve(process.cwd(), options.output);

  if (!isFileExists(configFile)) {
    console.log('Config file ' + configFile + ' is not exists!');
    process.exit(-1);
  }

  const rawConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
  const workRoot = path.dirname(configFile);
  const outputRoot = path.join(outputDir, `bundle-output`);
  Util.ensureFolder(outputRoot);

  const config = {
    root: workRoot,
    dev: options.dev === 'true',
    packageName : rawConfig['package'],
    platform : options.platform,
    outputDir : path.join(outputRoot, 'split'),
    bundleDir : path.join(outputRoot, 'bundle'),
    baseEntry : {
      index: rawConfig.base.index,
      includes: rawConfig.base.includes
    },
    customEntries : rawConfig.custom
  };
  if (!isFileExists(config.baseEntry.index)) {
    console.log('Index of base does not exists!');
  }

  console.log('Work on root: ' + config.root);
  console.log('Dev mode: ' + config.dev);
  bundle(config, (err, data) => {
    if (err) throw err;
    console.log('===[Bundle] Finish!===');
    const parser = new Parser(data, config);
    parser.splitBundle();
  });
}
function isFileExists(fname) {
  try {
    fs.accessSync(fname, fs.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
