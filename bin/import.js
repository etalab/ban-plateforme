#!/usr/bin/env node
require('dotenv').config()
const {resolve} = require('path')
const {SourceDb} = require('../lib/util/storage')
const {getDepartements} = require('../lib/util/cli')
const {runInParallel} = require('../lib/util/parallel')

const SOURCES_PATTERNS = {
  'ban-v0': process.env.BANV0_PATH_PATTERN && resolve(process.env.BANV0_PATH_PATTERN),
  bal: process.env.BAL_PATH_PATTERN && resolve(process.env.BAL_PATH_PATTERN),
  cadastre: process.env.CADASTRE_PATH_PATTERN && resolve(process.env.CADASTRE_PATH_PATTERN),
  ftth: process.env.FTTH_PATH_PATTERN && resolve(process.env.FTTH_PATH_PATTERN),
  'ign-api-gestion': process.env.IGN_API_GESTION_PATH_PATTERN && resolve(process.env.IGN_API_GESTION_PATH_PATTERN)
}

async function main() {
  const departements = getDepartements()
  const sourceName = process.env.SOURCE
  const sourcePattern = SOURCES_PATTERNS[process.env.SOURCE]

  const db = new SourceDb(sourceName)
  await db.clear()

  await runInParallel(require.resolve('../lib/import'), departements.map(departement => ({
    departement,
    sourceName,
    sourcePath: sourcePattern.replace('{dep}', departement)
  })))

  process.exit(0)
}

main()
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
