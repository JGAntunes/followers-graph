import mongoose from 'mongoose'
import config from '../../config'
import log from '../helpers/logger'

let mongoUrl = config.mongo.url

mongoose.connect(mongoUrl)
let db = mongoose.connection

db.on('error', function (err) {
  log.error('Connection error:', err)
})

db.once('open', function () {
  log.info('Successfuly connected to mongoDB')
})

export default db
