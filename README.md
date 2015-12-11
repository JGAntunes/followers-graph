# twitter-ego

A tool to save and export twitter followers data. It allows to crawl data effectively starting from a single point, optionally allowing to export data for visualization. 

Built using Node.JS and MongoDB. Available script to export data to `.gexf` files.

1. Set the env vars or alter `config.js`
2. Run `npm start`
3. The crawler will start running based on the entry id you've inserted
4. Optionally export data with `npm run gexf`

The crawler optimizes for the maximum requests possible in the shortest time span, taking the Twitter API rate limits into account.

Made for [complex networks](https://fenix.tecnico.ulisboa.pt/cursos/meic-a/disciplina-curricular/283003985068082) class.

*Twitter Followers Network with 367.671 nodes and 404.494 edges*
![Graph network](http://i.imgur.com/KZaLCML.jpg)

License MIT
