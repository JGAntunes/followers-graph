import Twitter from './lib/twitter'
import config from './config'

// Init db
import './lib/models'

let twitter = new Twitter({
  consumer_key: config.twitter.consumerKey,
  consumer_secret: config.twitter.consumerSecret,
  access_token: config.twitter.accessToken,
  access_token_secret: config.twitter.accessTokenSecret
})

// Start on me
twitter.start(62943640)
