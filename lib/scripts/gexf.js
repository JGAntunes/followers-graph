import gexf from 'gexf'
import fs from 'fs'
import log from '../helpers/logger'
import User from '../models/User'
import db from '../models'

const NODE_LIMIT = 1000
let nodeCount = 0
let fileNum = 0

let graphBase = {
  version: '1.2',
  meta: {
    creator: 'João Antunes',
    lastmodifieddate: Date(),
    title: 'Twitter Followers Graph'
  },
  defaultEdgeType: 'directed',
  model: {
    node: [
      {
        id: 'id',
        type: 'string',
        title: 'Twitter Id'
      },
      {
        id: 'name',
        type: 'string',
        title: 'User name'
      },
      {
        id: 'handle',
        type: 'string',
        title: 'Twitter handle'
      },
      {
        id: 'location',
        type: 'string',
        title: 'User location'
      }
    ]
  }
}

let graphGexf = gexf.create(graphBase)

let stream = User.find().stream()

stream.on('data', (user) => {
  // log.debug('Data')
  stream.pause()
  _checkLimit(() => {
    graphGexf.addNode({
      id: user.id,
      label: user.name.replace(/[\x00-\x1F\x7F-\x9F]/u, ''),
      attributes: {
        id: user.id,
        name: (user.name || 'unknown').replace(/[\x00-\x1F\x7F-\x9F]/u, ''),
        handle: (user.handler || 'unknown').replace(/[\x00-\x1F\x7F-\x9F]/u, ''),
        location: (user.location || 'unknown').replace(/[\x00-\x1F\x7F-\x9F]/u, '')
      }
    })
    for (let i = 0; i < user.followers.length; i++) {
      let id = user.followers[i]
      graphGexf.addEdge({
        id: user.id + '-' + id,
        source: user.id,
        target: id,
        weight: 1
      })
    }
    stream.resume()
  })
})
.on('error', (err) => log.error('Error fetching users from db', err))
.on('close', () => {
  let output = graphGexf.document
  log.debug('Writing file')
  fs.writeFile('./test.gexf', output, 'utf8', (err) => {
    if (err) log.error('Error saving document', err)
    log.info('Document saved!')
    db.close()
  })
})

function _checkLimit (cb) {
  if (nodeCount++ < NODE_LIMIT) { return cb() }
  let output = graphGexf.document
  log.debug('Writing file', fileNum++)
  fs.writeFile('./test' + fileNum + '.gexf', output, 'utf8', (err) => {
    if (err) log.error('Error saving document', err)
    log.info('Document saved!')
    nodeCount = 0
    graphGexf = gexf.create(graphBase)
    cb()
  })
}
