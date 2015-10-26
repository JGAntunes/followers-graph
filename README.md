# followers-graph
[Work in progress]
A tool to save and export twitter followers data.

Built using Node.JS and MongoDB. Available script to export data to `.gexf` files.

1- Set the env vars or alter `config.js`
2- Run `npm start`
3- The crawler will start running based on the entry id you've inserted
4- Optionally export data with `npm run gexf`

The crawler optimizes for the maximum requests possible in the shortest time span, taking the Twitter API rate limits into account.
