const TorrentSearchApi = require("torrent-search-api");
const similarity = require("similarity");
require("dotenv").config();

TorrentSearchApi.enablePublicProviders();

module.exports.searchShow = async (title, year) => {
  console.log(title, year);
  const query = `${title} ${year}`;
  const results = await TorrentSearchApi.search(query, "All");
  results.sort((result1, result2) => {
    resSize1 = parseInt(
      result1.size.replace(" MB", "").replace(" GB", "000").replace(".", "")
    );
    resSize2 = parseInt(
      result2.size.replace(" MB", "").replace(" GB", "000").replace(".", "")
    );
    return resSize2 - resSize1;
  });
  return await Promise.all(
    results.map(async (result) => {
      if (result.magnet) return result;
      result.magnet = await TorrentSearchApi.getMagnet(result);
      return result;
    })
  );
};

module.exports.searchMovie = async (title, year) => {
  console.log(title, year);
  const query = `${title} ${year}`;
  const results = await TorrentSearchApi.search(query, "All");
  results.sort((result1, result2) => {
    return similarity(result2.title, query) - similarity(result1.title, query);
  });
  return await Promise.all(
    results.map(async (result) => {
      if (result.magnet) return result;
      result.magnet = await TorrentSearchApi.getMagnet(result);
      return result;
    })
  );
};
