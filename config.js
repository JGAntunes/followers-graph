import pack from './package'

let config = {
  url: process.env.TWITTER_GRAPH_URL || 'http://localhost:8060',
  port: process.env.TWITTER_GRAPH_PORT || 8060
}

config.mongo = {
  url: process.env.TWITTER_GRAPH_MONGO_URL || 'mongodb://localhost/twitter_graph'
}

config.bunyan = {
  name: pack.name,
  level: process.env.TWITTER_GRAPH_LOG_LEVEL || 'trace'
}

config.twitter = {
  consumerKey: process.env.TWITTER_GRAPH_CONSUMER_KEY,
  consumerSecret: process.env.TWITTER_GRAPH_CONSUMER_SECRET,
  accessToken: process.env.TWITTER_GRAPH_ACCESS_TOKEN,
  accessTokenSecret: process.env.TWITTER_GRAPH_ACCESS_TOKEN_SECRET
}

config.swagger = {
  pathPrefixSize: 1,
  apiVersion: pack.version,
  basePath: config.url,
  info: {
    title: 'Twitter Graph',
    description: pack.description
  }
}

if (process.env.NODE_ENV === 'test') {
  config.bunyan.streams = [{
    level: 'trace',
    path: 'test.log'
  }]
}

export default config
