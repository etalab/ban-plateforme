const {first, uniq, chain} = require('lodash')
const {CommunesDb} = require('./db')
const consolidateVoies = require('./processing/consolidate-voies')

const mergeDb = new CommunesDb('merge-default')
const compositionDb = new CommunesDb('composition-default')

async function processEntries(entries) {
  const voies = await consolidateVoies(entries)
  const adressesCommune = chain(voies)
    .map(voie => voie.numeros.map(n => ({
      ...voie,
      ...n,
      numeros: undefined
    })))
    .flatten()
    .value()
  const {codeCommune} = first(adressesCommune)
  await compositionDb.setCommune(codeCommune, adressesCommune)
}

async function main(options) {
  const {codeCommune} = options

  const adressesCommunes = await mergeDb.getCommune(codeCommune)

  if (!adressesCommunes) {
    return
  }

  const sources = uniq(adressesCommunes.map(a => a.source))
  if (sources.includes('bal')) {
    await processEntries(adressesCommunes.filter(a => a.source === 'bal'))
  } else {
    await processEntries(adressesCommunes.filter(a => a.source === 'cadastre' || (a.source.startsWith('ign-api-gestion') && a.source !== 'ign-api-gestion-dgfip')))
  }
}

module.exports = async function (options, cb) {
  try {
    const result = await main(options)
    cb(null, result)
  } catch (error) {
    console.error(error)
    cb(error)
  }
}