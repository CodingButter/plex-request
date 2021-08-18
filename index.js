const fs = require("fs");
const http = require("http");
const https = require("https");
const { exec } = require("child_process");
const express = require("express");
const cors = require("cors");
const AriaManager = require("./torrent/AriaManager");

const path = require("path");

(async () => {
  const ariaManager = await AriaManager("F:\\Plex");

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

  app.use(express.static("frontend/build"));
  app.use(cors());
  app.use(express.json());

  app.get("/torrents", async (req, res) => {
    res.json(await ariaManager.getTorrents());
  });
  app.get("/refresh", (req, res) => {
    refreshServer();
    res.json({ status: "success" });
  });
  app.post("/local", (req, res) => {
    res.json({ local: false });
  });
  app.post("/", async ({ body: { url: magnet, hash, title, poster } }, res) => {
    if (magnet && hash) {
      if (ariaManager.getTorrent(hash)) {
        res.json({ status: await ariaManager.getTorrent(hash).getStatus() });
        return;
      }
      const activeTorrent = await ariaManager.addTorrent({
        hash,
        magnet,
        title,
        poster,
      });
      res.json({ status: "loading" });
    } else {
      res.json({ status: "no torrent provided" });
    }
  });
  app.post("/info", async (req, res) => {
    res.json(await ariaManager.getSessionInfo());
  });
  //create node.js http server and listen on port
  var httpServer = http.createServer(app);
  var httpsServer = https.createServer(credentials, app);
  httpServer.listen(80, () => {
    console.log(`Listening on port 80`);
  });
  httpsServer.listen(443, () => {
    console.log(`Listening on port 443`);
  });
})();
