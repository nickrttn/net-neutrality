const pino = require('pino');
const path = require('path');
const { promisify } = require('util');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { default: isReservedIP } = require('martian-cidr');
const axios = require('axios');
const jp = require('jsonpath');

const writeFile = promisify(fs.writeFile);

// Create an instance of the logger
const pretty = pino.pretty();
pretty.pipe(process.stdout);
const logger = pino(
  {
    name: 'analysis',
    safe: true,
  },
  pretty,
);

const addresses = new Set();

// Instantiate a new Count object for a little bookkeeping
const count = new Count();

(async function() {
  let client, db, collection;

  try {
    // Use connect method to connect to the Server
    client = await MongoClient.connect('mongodb://localhost:32768');

    db = client.db('packet-analysis');
    collection = db.collection('packets');
  } catch (err) {
    logger.error(err);
  }

  if (collection) {
    // Create a cursor from MongoDB documents
    const cursor = await collection.find({});
    const documentStream = cursor.stream();

    documentStream.on('data', ondata);
    documentStream.on('end', () => onend(client));
  }
})();

function ondata(obj) {
  const ip = jp.value(obj, '$..ip');
  const ip6 = jp.value(obj, '$..ipv6');

  if (ip6) {
    ['ipv6.src', 'ipv6.dst'].forEach(el => {
      if (el in ip6) {
        const addr = ip6[el];
        if (!isReservedIP(addr)) {
          try {
            addresses.add(ip6[el]);
          } catch (err) {
            logger.error(err);
          } finally {
            oninsert();
          }
        }
      }
    });
  }

  if (ip) {
    ['ip.dst', 'ip.src'].forEach(el => {
      if (el in ip) {
        const addr = ip[el];
        if (!isReservedIP(addr)) {
          try {
            addresses.add(ip[el]);
          } catch (err) {
            logger.error(err);
          } finally {
            oninsert();
          }
        }
      }
    });
  }
}

function oninsert() {
  count.increase();

  if (count.getCount() % 10000 === 0) {
    logger.info(`\nProcessed ${count.getCount()} leafs.\n\n`);
  }

  return;
}

function onend(client) {
  // Close the DB connection
  client.close();

  // Inform the user
  logger.info(
    `\nProcessed ${count.getCount()} nodes, inserted ${
      addresses.size
    } unique IP addresses.\n\n ----- Done. ----- \n\n`,
  );

  getgeoing();

  return;
}

async function getgeoing() {
  const url = 'https://freegeoip.net/json';
  const arr = Array.from(addresses);
  const responses = await Promise.all(arr.map(ip => axios(`${url}/${ip}`)));
  const geodata = responses.map(res => res.data);
  onfetch(JSON.stringify(geodata));
}

async function onfetch(data) {
  const dest = path.join(__dirname, '..', 'data', 'ipgeodata.json');

  try {
    await writeFile(dest, data);
    onwrite();
  } catch (err) {
    onerror(err);
  }
}

function onwrite() {
  logger.info(`Data file written successfully.`);
}

function onerror(err) {
  logger.error(err);
}

/**
 * Count is a very simple, optimized counter class that keeps track of an amount for you.
 * It has two methods you can use, increase() (by 1) and getCount().
 */
function Count() {
  this.count = 0;
}

Count.prototype.increase = function(n) {
  this.count += n || 1;
};

Count.prototype.getCount = function() {
  return this.count;
};
