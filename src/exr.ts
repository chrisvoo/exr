#!/usr/bin/env node
/* eslint-disable newline-per-chained-call */
import { program, Option, Command } from 'commander';
import ora from 'ora';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { error, showResult, warning } from './cli/terminal';

/**
 * Extend the base type with the options you pass to your app.
 */
export type CLI = Command & {}

(async () => {
  const cli: CLI = program as CLI;
  cli
    .version('0.0.1')
    .description('EXR Cli');

  cli
    .command('getuser [id]').alias('u').description('Get a user by email or Firebase ID')
    .action(async (id) => {
      const options = cli.opts();

      const spinner = ora(`getuser in ${chalk.bold(options.env)} environment...`).start();
      // const mysos = new MySOS(configuration, options.env);
      // try {
      //   const profile = await mysos.getUser(id);
      //   spinner.stop();
      //   if (profile === null) {
      //     console.log('💀 No user found!');
      //   } else {
      //     showResult(profile);
      //   }
      // } catch (e) {
      //   error(e.message);
      // }
    });

  program.parseAsync(process.argv);
})();
