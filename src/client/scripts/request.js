const S3_BUCKET = 'https://s3.eu-central-1.amazonaws.com/storytellingwithdata';

module.exports = function(file, filetype) {
  return new Promise((resolve, reject) => {
    if ('fetch' in self) {
      const url = `${S3_BUCKET}/${file}.${filetype}`;
      fetch(url).then(response => {
        if (response.ok) {
          response[filetype]().then(data => {
            resolve(data);
          });
        } else {
          reject(new Error(response.statusText));
        }
      });
    }
  });
};
