import fs from 'fs';
import path from 'path';
import semver from 'semver';
import chalk from 'chalk';
import enquirer from 'enquirer';
import { execa } from 'execa';

// 读取 package.json 文件
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath));

// 确认版本号
const currentVersion = packageJson.version;

const versionIncrements = [
  'patch',
  'minor',
  'major'
];

const tags = [
  'latest',
  'next'
];

const inc = (i) => semver.inc(currentVersion, i)
const run = (bin, args, opts = {}) => execa(bin, args, { stdio: 'inherit', ...opts })
const step = (msg) => console.log(chalk.cyan(msg))
const warn = (msg) => console.log(chalk.red(msg))

async function main() {
  let targetVersion;

  const { release } = await enquirer.prompt({
    type: 'select',
    name: 'release',
    message: 'Select release type',
    choices: versionIncrements.map(i => `${i} (${inc(i)})`).concat(['custom'])
  });

  if (release === 'custom') {
    targetVersion = (await enquirer.prompt({
      type: 'input',
      name: 'version',
      message: 'Input custom version',
      initial: currentVersion
    })).version;
  } else {
    targetVersion = release.match(/\((.*)\)/)[1]
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`Invalid target version: ${targetVersion}`);
  }
  if (!semver.gt(targetVersion, currentVersion)) {
    warn('new version must more then current version');
    return;
  }

  const { tag } = await enquirer.prompt({
    type: 'select',
    name: 'tag',
    message: 'Select tag type',
    choices: tags
  })

  const { yes: tagOk } = await enquirer.prompt({
    type: 'confirm',
    name: 'yes',
    message: `Releasing v${targetVersion} with the "${tag}" tag. Confirm?`
  })

  if (!tagOk) {
    warn('tag not ok');
    return
  }

  // Run tests before release.

  // Update the package version.
  step('\nUpdating the package version...')
  updatePackage(targetVersion)




  // Push to GitHub.
  step('\nPushing to GitHub...');
  try {
    await run('git', ['add', '.']);
    step('\n  after git add all file');

    await run('git', ['commit', '-m', `release: v${targetVersion}`]);
    step('\n after git commint ');

    await run('git', ['push']);
    step('Code has been committed to GitHub');
  } catch (error) {
    warn('Failed to submit code to GitHub, please submit manually');
  }
}


function updatePackage(version) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  pkg.version = version;

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n');
}

main().catch((err) => console.error(err));

