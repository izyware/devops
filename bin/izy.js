#!/usr/bin/env node
if (!process.argv[2]) process.argv[2] = 'help';
require('izy-proxy/lib/cli').pipe(['callpretty']);