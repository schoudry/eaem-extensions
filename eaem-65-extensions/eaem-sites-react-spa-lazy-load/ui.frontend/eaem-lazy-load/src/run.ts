#!/usr/bin/env ./node_modules/.bin/ts-node-script

async function run() {
  const scriptName = process.argv[2];

  const args = process.argv.slice(3);

  const { run } = await import(`./scripts/${scriptName}`);

  run(...args);
}

run();
