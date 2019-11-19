<h1 align="center">configure-env</h1>
<p align="center">CLI tool to generate and populate <code>.env</code> files from <code>.env.example</code> templates.</p>
<p align="center">
<a href="https://www.npmjs.com/package/configure-env"><img alt="npm (scoped)" src="https://img.shields.io/npm/v/configure-env.svg?style=flat-square"></a> <a href="https://www.npmjs.com/package/configure-env"><img alt="npm" src="https://img.shields.io/npm/dt/configure-env.svg?style=flat-square"></a> <a href="https://github.com/twilio-labs/configure-env/blob/master/LICENSE"><img alt="GitHub" src="https://img.shields.io/github/license/twilio-labs/configure-env.svg?style=flat-square"></a><a href="https://github.com/twilio-labs/configure-env/blob/master/CODE_OF_CONDUCT.md"><img alt="Code of Conduct" src="https://img.shields.io/badge/%F0%9F%92%96-Code%20of%20Conduct-blueviolet.svg?style=flat-square"></a> <a href="https://github.com/twilio-labs/configure-env/blob/master/CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
</p>
<hr>

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

## About

`configure-env` will read a `.env.example` or any other similar `.env` file and prompt for values for each variable that has a comment header above it. Afterwards it will generate a `.env` file out of it.

It works as a more user-friendly approach to:

```
cp .env.example .env
```

## Installation

You can install the CLI tool via `npm` or another package manager. Ideally install it as a dev dependency instead of global:

```bash
# Install it as a dev dependency
npm install configure-env --save-dev

# Afterwards you can use by using:
node_modules/.bin/configure-env

npx configure-env

# Or inside your package.json scripts section as "configure-env"
```

## Usage

In a project that contains a `.env.example` file, run:

```bash
$ npx configure-env --help
Prompts user for environment variables and generates .env files based on a
.env.example file

Usage:
  configure-env.js -o [outputFile] -i [exampleFile]

Options:
  --help        Show help                                              [boolean]
  --version     Show version number                                    [boolean]
  --output, -o  Location of the .env file that should be written
                                                      [string] [default: ".env"]
  --input, -i   Location of input .env.example file for prompts
                                              [string] [default: ".env.example"]
  --verbose                                           [boolean] [default: false]

Examples:
  npx configure-env       Reads a .env.example file in the current directory and
                          creates a .env file
  configure-env.js | cat  The output can be either written to a file or piped to
                          another process

This project is part of Twilio Labs. Please file any issues
github.com/twilio-labs/configure-env

```

## Contributing

This project welcomes contributions from the community. Please see the [`CONTRIBUTING.md`](CONTRIBUTING.md) file for more details.

### Code of Conduct

Please be aware that this project has a [Code of Conduct](CODE_OF_CONDUCT.md). The tldr; is to just be excellent to each other ❤️

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://dkundel.com"><img src="https://avatars3.githubusercontent.com/u/1505101?v=4" width="80px;" alt="Dominik Kundel"/><br /><sub><b>Dominik Kundel</b></sub></a><br /><a href="https://github.com/twilio-labs/configure-env/commits?author=dkundel" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!

## License

[MIT](LICENSE)
