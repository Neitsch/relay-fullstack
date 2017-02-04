import DataLoader from 'dataloader';

import MongoClient from 'mongodb';

function DbConnection({
  host = 'localhost',
  port = 27017,
  database = 'test'
}) {
  return new Promise((resolve, reject) => {
    MongoClient.connect(`mongodb://${host}:${port}/${database}`,
    (err, db) => {
      err ? reject(err) : resolve(db);
    });
  });
}

class User {
  name: string;
  username: string;
  website: string;
  features: Array<string>;
  constructor(name: string, username: string, website: string, features: Array<string>) {
    this.name = name;
    this.username = username;
    this.website = website;
    this.features = features;
  }
}

class Feature {
  id: string;
  name: string;
  description: string;
  url: string;
  constructor(name: string, description: string, url: string) {
    this.name = name;
    this.description = description;
    this.url = url;
  }
}

const features = [
  new Feature('React', 'A JavaScript library for building user interfaces.', 'https://facebook.github.io/react'),
  new Feature('Relay', 'A JavaScript framework for building data-driven react applications.', 'https://facebook.github.io/relay'),
  new Feature('GraphQL', 'A reference implementation of GraphQL for JavaScript.', 'http://graphql.org'),
  new Feature('Express', 'Fast, unopinionated, minimalist web framework for Node.js.', 'http://expressjs.com'),
  new Feature('Webpack', 'Webpack is a module bundler that packs modules for the browser.', 'https://webpack.github.io'),
  new Feature('Babel', 'Babel is a JavaScript compiler. Use next generation JavaScript, today.', 'https://babeljs.io'),
  new Feature('PostCSS', 'PostCSS. A tool for transforming CSS with JavaScript.', 'http://postcss.org'),
  new Feature('MDL', 'Material Design Lite lets you add a Material Design to your websites.', 'http://www.getmdl.io')
];
const lvarayut = new User('Varayut Lerdkanlayanawat', 'lvarayut', 'https://github.com/lvarayut/relay-fullstack', features.map(feature => feature.id));

DbConnection({})
  .then(
    db => db.dropDatabase().then(
      () => db.collection('feature').insertMany(features).then(
        res => {
          lvarayut.features = res.insertedIds;
          return db.collection('user').insert(lvarayut).then(
            () => db.close()
          );
        }
      )
    )
  );

/*
* Add feature in memory
*/

async function getUser(id: number) {
  lvarayut.id = lvarayut._id
  return await DbConnection({}).then(
    db => db.collection('user').findOne()
  );
}

async function getFeature(id: string) {
  return await DbConnection({})
    .then(
      db => db.collection('feature').findOne({"_id": new MongoClient.ObjectID(id)})
    ).then(
      res => {
        res.id = res._id;
        return res;
      }
    );
}

async function getFeatures() {
  return await DbConnection({})
    .then(
      db => db.collection('feature').find()
    ).then(
      res => res.map(a => {
        a.id = a._id;
        return a;
      })
    );
}

function fetchUser(id) {
  return new Promise((resolve) => {
    resolve(getUser(id));
  });
}

function fetchFeature(id) {
  return new Promise((resolve) => {
    resolve(getFeature(id));
  });
}

const userLoader = new DataLoader(
  ids => Promise.all(ids.map(fetchUser))
);

const featureLoader = new DataLoader(
  ids => Promise.all(ids.map(fetchFeature))
);

async function addFeature(name: string, description: string, url: string) {
  const newFeature = new Feature(name, description, url);
  featureLoader.clear();
  userLoader.clear(lvarayut._id);
  return await DbConnection({}).then(
    db => db.collection('feature').insertOne(newFeature).then(
      res => {
        let myres = res.ops[0];
        myres.id = myres._id;
        db.collection('user').update(
          {},
          {$push: {features: res.insertedId}}
        );
        return myres;
      }
    )
  );
}

export {
  userLoader,
  featureLoader,
  User,
  Feature,
  getFeatures,
  addFeature
};
