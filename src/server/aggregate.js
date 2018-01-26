const { promisify } = require('util');
const path = require('path');
const fs = require('fs');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

const src = path.join(__dirname, '..', 'data', 'geodata-detailed.json');
const dest = path.join(__dirname, '..', 'data', 'geodata-aggregate.json');

(async function() {
  const arr = await read();
  const aggregate = await process(JSON.parse(arr));
  await write(JSON.stringify(aggregate));
})();

async function read() {
  return await readFile(src, 'utf-8');
}

async function write(data) {
  return await writeFile(dest, data);
}

async function process(arr) {
  const aggregate = arr.reduce((acc, el) => {
    if (el.country_code === '') {
      if (!('unknown' in acc)) {
        acc['unknown'] = {
          countryCode: 'XX',
          countryName: 'Unknown',
          packets: new Count(),
        };
      }

      acc['unknown'].packets.increase();
    } else {
      if (!(el.country_code in acc)) {
        acc[el.country_code] = {
          countryCode: el.country_code,
          countryName: el.country_name,
          packets: new Count(),
        };
      }

      acc[el.country_code].packets.increase();
    }

    return acc;
  }, {});

  for (let key in aggregate) {
    aggregate[key].packets = aggregate[key].packets.getCount();
  }

  return aggregate;
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
