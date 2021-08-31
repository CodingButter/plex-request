const TorrentSearchApi = require("torrent-search-api");
const similarity = require("similarity");
const path = require("path");
require("dotenv").config();
const providerFullPath = path.join(__dirname, "./providers/");
TorrentSearchApi.loadProviders(providerFullPath);

module.exports.searchShow = async (title, year) => {
  TorrentSearchApi.enableProvider("Yts");
  TorrentSearchApi.enableProvider("ThePirateBay");
  TorrentSearchApi.enableProvider("KickassTorrents");
  TorrentSearchApi.enableProvider("Eztv");
  TorrentSearchApi.enableProvider("Torrent9");
  TorrentSearchApi.enableProvider("TorrentProject");
  TorrentSearchApi.enableProvider("Limetorrents");
  TorrentSearchApi.enableProvider("Nyaa");
  TorrentSearchApi.enableProvider("TorrentDownload");

  console.log({ title, year });
  const query = `${title} ${year}`;
  const results = await TorrentSearchApi.search(query, "ALL", 500);
  results.sort((result1, result2) => {
    if (result1.size && result2.size) {
      var resSize1 = result1.size.replace(" MB", "");
      resSize1 = resSize1.replace(" GB", "0000");
      resSize1 = resSize1.replace(".", "");
      var resSize2 = result2.size.replace(" MB", "");
      resSize2 = resSize2.replace(" GB", "0000");
      resSize2 = resSize2.replace(".", "");

      return parseInt(resSize2) - parseInt(resSize1);
    } else return 1;
  });
  return await Promise.all(
    results
      .filter((torrent) => {
        return parseInt(torrent.seeds) > 0;
      })
      .map(async (result) => {
        if (result.magnet) return result;
        result.magnet = await TorrentSearchApi.getMagnet(result);
        return result;
      })
  );
};

module.exports.searchMovie = async (title, year, imdb) => {
  console.log({ title, year, imdb });
  TorrentSearchApi.disableProvider("ThePirateBay");
  TorrentSearchApi.disableProvider("KickassTorrents");
  TorrentSearchApi.disableProvider("Eztv");
  TorrentSearchApi.disableProvider("Torrent9");
  TorrentSearchApi.disableProvider("TorrentProject");
  TorrentSearchApi.disableProvider("Limetorrents");
  TorrentSearchApi.disableProvider("Nyaa");
  TorrentSearchApi.disableProvider("TorrentDownload");

  var query = imdb;
  var results = await TorrentSearchApi.search(query, ["ALL"], 500);
  // results.sort((result1, result2) => {
  //   if (result1.provider === "Yts" && result2.provider !== "Yts")
  //     return (
  //       -1 ||
  //       similarity(result2.title, query) - similarity(result1.title, query)
  //     );
  // });

  if (results.length == 0) {
    var query = `${title} ${year}`;
    var results = await TorrentSearchApi.search(query, ["ALL"], 500);
  }
  if (results.length == 0) {
    TorrentSearchApi.enableProvider("ThePirateBay");
    TorrentSearchApi.enableProvider("KickassTorrents");
    TorrentSearchApi.enableProvider("Eztv");
    TorrentSearchApi.enableProvider("Torrent9");
    TorrentSearchApi.enableProvider("TorrentProject");
    //TorrentSearchApi.enableProvider("Limetorrents");
    TorrentSearchApi.enableProvider("Nyaa");
    TorrentSearchApi.enableProvider("TorrentDownload");
    var results = await TorrentSearchApi.search(query, ["ALL"], 500);
  }
  return await Promise.all(
    results
      .filter((torrent) => {
        return parseInt(torrent.seeds) > 0;
      })
      .map(async (result) => {
        result.magnet = await TorrentSearchApi.getMagnet(result);
        return result;
      })
  );
};
