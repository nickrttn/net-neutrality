const pino = require("pino");
const { createReadStream, createWriteStream } = require("fs");
const { join } = require("path");
const StreamArray = require("stream-json/utils/StreamArray");
const jp = require("jsonpath");
const { MongoClient } = require("mongodb");

// What files are we processing?
const file = join(__dirname, "..", "..", "public", "data.json");
const newFile = join(__dirname, "..", "..", "public", "filtered-data.json");

// Create an instance of the logger
const pretty = pino.pretty();
pretty.pipe(process.stdout);
const logger = pino(
  {
    name: "analysis",
    safe: true
  },
  pretty
);

// Instantiante a StreamArray
const stream = StreamArray.make();

// Instantiate a new Count object for a little bookkeeping
const count = new Count();

(async function() {
  let client, db, collection;

  try {
    // Use connect method to connect to the Server
    client = await MongoClient.connect("mongodb://localhost:32768");

    db = client.db("packet-analysis");
    collection = db.collection("packets");
  } catch (err) {
    logger.error(err);
  }

  if (collection) {
    // Start reading the file
    await createReadStream(file).pipe(stream.input);

    // Handle the output of the pipe
    await stream.output.on("data", obj => ondata(collection, obj));

    // Handle the end of the stream
    await stream.output.on("end", _ => onend(client));
  }
})();

/**
 * ondata checks for the existence of IP data in the passed object safely.
 * If it exists, it pipes the data to the writable stream.
 *
 * @param {Object} obj
 * @returns
 */
async function ondata(collection, obj) {
  try {
    let result = await collection.insert(obj.value);
    oninsert(result);
  } catch (err) {
    logger.error(err);
  }

  return;
}

/**
 * oninsert increases the counter by 1 to keep track of the amount of nodes written.
 * It also shows a log message if n^10k nodes have been processed.
 *
 * @returns
 */
function oninsert(result) {
  count.increase(result.inserted);

  if (count.getCount() % 10000 === 0) {
    logger.info(`\nInserted ${count.getCount()} nodes.\n\n`);
  }

  return;
}

/**
 * onend closes the writable stream, and informs the user that the process is done.
 *
 * @returns
 */
function onend(client) {
  // Close the DB connection
  client.close();

  // Inform the user
  logger.info(
    `\nInserted ${count.getCount()} nodes.\n\n ----- Done. ----- \n\n`
  );

  return;
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
