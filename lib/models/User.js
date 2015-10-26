import mongoose from 'mongoose'

let schema = new mongoose.Schema({
  id: {type: String, unique: true},
  handler: String,
  name: String,
  img: String,
  followers: [String],
  crawled: Boolean,
  location: String,
  updated: Date
})

schema.index({id: 1}, {unique: true})
schema.index({handler: 1}, {unique: true})
schema.index({followers: 1})
schema.index({location: 1})

export default mongoose.model('User', schema)
