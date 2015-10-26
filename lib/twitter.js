import Twit from 'twit'
import Async from 'async'
import log from './helpers/logger'
import User from './models/User'

const WAITING_PERIOD = 15 * 60 * 1000
const RATE_LIMIT_FLAG = 'rate-limit'
const MAX_IDS = 100

let twitter = function (options) {
  this.followersQueue = Async.queue((worker, callback) => this._getFollowers(worker, callback), 1)
  this.usersQueue = Async.queue((worker, callback) => this._getUsers(worker, callback), 1)
  this._T = new Twit(options)
}

twitter.prototype.start = function (id) {
  log.info('Twitter crawler started for user ' + id)
  this.usersQueue.push({id: id}, _usersCallback)
  this.followersQueue.push({id: id}, _followersCallback)
}

twitter.prototype._getFollowers = function (request, cb) {
  let fields = { user_id: request.id, count: 5000 }
  if (request.cursor) fields.cursor = request.cursor
  if (request.ids) fields.ids = request.ids
  log.debug('Making request for followers - ', fields.user_id)
  this._followersRequest('followers/ids', fields, (err, data, response) => {
    if (err && err === RATE_LIMIT_FLAG) {
      // Redo the request later
      if (data.cursor) request.cursor = data.cursor
      this.followersQueue.push(request, _followersCallback)
      return cb(err)
    }
    if (err) {
      log.error('Error getting followers from twitter', err)
      return cb(err)
    }

    let user = {
      id: request.id,
      followers: data.ids,
      updated: Date()
    }
    // Set user requests to queue
    this._queueUserRequests(user.followers)
    // Set follower requests to queue
    this._queueFollowerRequests(user.followers)
    // Update user in database
    User.findOneAndUpdate({id: user.id}, user, {new: true, upsert: true}, (err, _user) => {
      if (err) {
        log.error('Error updating user followers', err)
        return cb(err)
      }
      log.debug('Updated followers for: ' + _user.id + ' handler: ' + _user.handler)
      cb()
    })
  })
}

twitter.prototype._getUsers = function (request, cb) {
  let ids = request.id
  log.debug('Making request for users - ', request)
  this._usersRequest('users/lookup', {user_id: ids, include_entities: false}, (err, data, response) => {
    if (err && err === RATE_LIMIT_FLAG) {
      // Redo the request later
      this.usersQueue.push(request, _usersCallback)
      return cb(err)
    }
    if (err) {
      log.error('Error getting users from twitter', err)
      return cb(err)
    }

    // Update user in database
    Async.each(data, (user, cbEach) => {
      let newUser = {
        id: user.id,
        name: user.name,
        handler: user.screen_name,
        img: user.profile_image_url,
        location: user.location,
        updated: Date()
      }
      User.findOneAndUpdate({id: user.id}, newUser, {new: true, upsert: true}, (err, _user) => {
        if (err) {
          log.error('Error updating user', err)
          return cbEach(err)
        }
        log.debug('Updated user info: ' + _user.id + ' handler: ' + _user.handler)
        cbEach()
      })
    }, cb)
  })
}

twitter.prototype._queueUserRequests = function (users) {
  // Set user requests to queue
  if (!users || users.length === 0) {
    return
  }
  for (let i = 0; i < users.length; i += MAX_IDS) {
    let ids = users.slice(i, i + MAX_IDS).join(',')
    this.usersQueue.push({id: ids}, _usersCallback)
  }
}

twitter.prototype._queueFollowerRequests = function (users) {
  // Set follower requests to queue
  if (!users || users.length === 0) {
    return
  }
  for (let i = 0; i < users.length; i++) {
    this.followersQueue.push({id: users[i]}, _followersCallback)
  }
}

twitter.prototype._followersRequest = function (path, params, callback) {
  // Hack so we can fetch all the ids
  let result = {ids: params.ids || []}
  delete params.ids

  this._T.get(path, params, (err, data, response) => {
    if (response.statusCode === 429) {
      log.debug('Pausing followers queue')
      this.followersQueue.pause()
      setTimeout(() => {
        log.debug('Resuming followers queue')
        this.followersQueue.resume()
      }, WAITING_PERIOD)
      // Buble data for the next request
      return callback(RATE_LIMIT_FLAG, params)
    }
    if (err) {
      return callback(err)
    }

    result.ids = result.ids.concat(data.ids)

    log.debug('Got', data.ids.length, 'ids, total is', result.ids.length)

    if (data.next_cursor_str && data.next_cursor_str !== '0') {
      params.cursor = data.next_cursor_str
      params.ids = result.ids
      return this._followersRequest(path, params, callback)
    }

    callback(null, result, response)
  })
}

twitter.prototype._usersRequest = function (path, params, callback) {
  this._T.get(path, params, (err, data, response) => {
    if (response.statusCode === 429) {
      log.debug('Pausing users queue')
      this.usersQueue.pause()
      setTimeout(() => {
        log.debug('Resuming users queue')
        this.usersQueue.resume()
      }, WAITING_PERIOD)
      return callback(RATE_LIMIT_FLAG)
    }
    if (err) {
      return callback(err)
    }
    callback(null, data, response)
  })
}

function _usersCallback (err) {
  if (err && err === RATE_LIMIT_FLAG) {
    return log.warn('Users queue stopped due to rate limit - EXITING')
  }
  if (err) {
    return log.error('Error getting users', err)
  }
  log.debug('Retrieved users successfuly')
}

function _followersCallback (err) {
  if (err && err === RATE_LIMIT_FLAG) {
    return log.warn('Followers queue stopped due to rate limit - EXITING')
  }
  if (err) {
    return log.error('Error getting followers', err)
  }
  log.debug('Retrieved followers successfuly')
}

export default twitter
