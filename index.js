const fs = require("fs");
const http = require("http");
const https = require("https");
const { exec } = require("child_process");
const compression = require("compression");
const express = require("express");
const cors = require("cors");
const BTClient = require("better-torrent-client");
const { downloadSeries, getTVStatus } = require("./tvShows");
const { searchMovie, searchShow } = require("./torrent/SearchTorrent");
const { url } = require("inspector");
const { response } = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

(async () => {
  //const ariaManager = await AriaManager("F:\\Plex");
  const torrentClient = new BTClient({
    dir: process.env.PLEX_TMP,
    port: process.env.ARIA_PORT,
    aria2: {
      spawnOptions: {
        detached: true,
        shell: true,
      },
      perameters: {
        "seed-time": 0,
        "seed-ratio": 0,
      },
    },
  });
  await torrentClient.connect();
  var credentials = {
    key: fs.readFileSync("./sslcert/private.key").toString(),
    cert: fs.readFileSync("./sslcert/certificate.crt").toString(),
    ca: fs.readFileSync("./sslcert/ca_bundle.crt").toString(),
  };
  var app = express();

  const refreshServer = () => {
    console.log("refreshing server");
    exec(
      '"C:\\Program Files (x86)\\Plex\\Plex Media Server\\Plex Media Scanner.exe" -s'
    );
    console.log("server Refreshed");
  };

  const getTorrentInfo = ({ status, stats, size, _metadata: { name } }) => ({
    status,
    stats,
    size,
    name,
  });
  app.use(compression());
  app.use(cors());
  app.use(express.json());

  app.get("/testing", async (req, res) => {
    const response = await fetch(
      "https://www.2embed.ru/embed/tmdb/tv?id=2317&s=1&e=1"
    );
    var htmlstring = await response.text();
    htmlstring = htmlstring.replace(/\/js\//g, "https://2embed.ru/js/");
    htmlstring = htmlstring.replace("app.min.js", "");
    htmlstring = htmlstring.replace(/\/css\//g, "https://2embed.ru/css/");
    htmlstring = htmlstring.replace(/\/images\//g, "https://2embed.ru/images/");
    res.send(htmlstring);
  });

  app.get("/tv", (req, res) => {
    res.json(getTVStatus());
  });
  app.post("/tv", async ({ body }, res) => {
    downloadSeries(body.title, body.tmdb, body.seasons);
    res.json({ status: "downloading tv show" });
  });

  app.post("/search/movies", async ({ body }, res) => {
    console.log(body);
    res.json(await searchMovie(body.title, body.year, body.imdb));
  });

  app.post("/search/shows", async ({ body }, res) => {
    console.log(body);
    res.json(await searchShow(body.title, body.year));
  });

  app.get("/refresh", (req, res) => {
    refreshServer();
    res.json({ status: "success" });
  });
  app.post("/local", (req, res) => {
    res.json({ local: false });
  });
  app.post("/add", async ({ body }, res) => {
    const { magnet, mediaType, include } = body;
    if (!magnet) res.json({ status: "no torrent provided" });
    include.mediaType = mediaType;
    const activeTorrent = await torrentClient.addTorrent(magnet, {
      include,
      uuid: include.uuid,
      dest:
        mediaType == "show"
          ? process.env.PLEX_TV_LIBRARY
          : process.env.PLEX_MOVIE_LIBRARY,
    });
    await activeTorrent.start();
    res.json(activeTorrent);
  });

  app.get("/info", async (req, res) => {
    res.json(await torrentClient.getInfo());
  });
  app.post("/remove", async ({ body }, res) => {
    try {
      console.log(body);
      const { uuid } = body;
      await torrentClient.getTorrentById(uuid).remove();
      res.json({ status: "success" });
    } catch (err) {
      res.json(err);
    }
  });

  var httpServer = http.createServer(app);
  var httpsServer = https.createServer(credentials, app);
  httpServer.listen(process.env.HTTP_SERVER_PORT, () => {
    console.log(`Listening on port ${process.env.HTTP_SERVER_PORT}`);
  });
  httpsServer.listen(process.env.HTTPS_SERVER_PORT, () => {
    console.log(`Listening on port ${process.env.HTTPS_SERVER_PORT}`);
  });
})();
