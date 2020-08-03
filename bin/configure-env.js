#!/usr/bin/env node

const { error } = require('log-symbols');
const { cli } = require('../dist/cli');

cli(process.argv.slice(2), process.stdout, process.stderr).catch(err => {
  console.error(`${error} Failed to template.\n%O`, err);
  process.exit(1);
});
