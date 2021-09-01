const fs = require("fs");
const { spawn } = require("child_process");
require("dotenv").config();
const Aria2 = require("aria2");
const Torrent = require("./Torrent");
var ariaProcess;
const torrents = [];
const torrentList = "./torrentList.json";
//const dir = "F:/tmp";
const movieDir = "F:/Plex/Movies";
const tvDir = "F:/Plex/TV";
const aria2 = new Aria2({
  host: "localhost",
  port: process.env.ARIA_PORT,
  secure: false,
  secret: "",
  path: "/jsonrpc",
});

const moveToPlex = (data) => {
  if (data.dir && !fs.existsSync(data.dir)) {
    fs.mkdirSync(data.dir.replace(dir, plexDirectory));
  }
  data.files.map((file) => {
    if (file.path) {
      const filedirArray = file.path.split("/");
      filedirArray.pop();
      const filedir = filedirArray.join("/");
      if (!fs.existsSync(filedir)) {
        fs.mkdirSync(filedir);
      }
      if (!fs.existsSync(data.path.split("/")))
        fs.renameSync(file.path, file.path.replace(dir, plexDirectory));
    } else {
      moveToPlex(file);
    }
  });
};

const start = async () => {
  ariaProcess = spawn(
    "aria2c",
    [
      `--rpc-listen-port=${process.env.ARIA_PORT}`,
      "--always-resume",
      "--enable-rpc",
      "--rpc-listen-all=true",
      "--rpc-allow-origin-all",
      "--seed-time=0",
      "--continue=true",
      "--max-concurrent-downloads=12",
      "--max-overall-upload-limit=0",
      "--file-allocation=none",
      "--bt-stop-timeout=60",
    ],
    { detached: true, shell: true }
  );
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 2000);
  });
};

const openConnection = async () => {
  return new Promise((resolve, reject) => {
    aria2.open();
    aria2.on("open", resolve());
  });
};

module.exports = async () => {
  await start();
  await openConnection();

  const getSessionInfo = async () => {
    const resp = await aria2.call("getSessionInfo");
    return resp;
  };

  const addTorrent = async ({
    mediaType,
    backdrop,
    tmdb,
    magnet,
    poster,
    title,
  }) => {
    var torrent = await getTorrent(tmdb);
    if (!torrent) {
      try {
        const guid = await aria2.call("addUri", [magnet], {
          dir: mediaType === "movie" ? movieDir : tvDir,
          "seed-time": 0,
        });
        var torrent = new Torrent({
          aria2,
          magnet,
          tmdb,
          guid,
          poster,
          title,
          tmdb,
          backdrop,
          mediaType,
        });
        torrents.push(torrent);
        writeTorrents();
      } catch (err) {
        console.log(err);
      }
    }
    return torrent;
  };
  const getTorrents = async () => {
    const spliceIndexes = [];
    const torrentInfo = await Promise.all(
      torrents.map(async (torrent, index) => {
        const status = await torrent.getStatus();
        console.log(status);
        if (status == false || status.status == "stopped")
          spliceIndexes.push(i);
        return status;
      })
    );
    spliceIndexes.forEach((si) => {
      torrents.splice(si, 1);
      writeTorrents();
    });

    return torrentInfo.filter((status) => status != false);
  };

  const getActive = async () => {
    const response = await aria2.call("tellActive");
    return response.map(({ following }) => following);
  };

  const getTorrent = (selector) => {
    var torrent;
    for (var i = 0; i < torrents.length; i++) {
      if (
        torrents[i].getTMDB() == selector ||
        torrents[i].getGuid() == selector
      ) {
        torrent = torrents[i];
        break;
      }
    }
    return torrent;
  };
  if (fs.existsSync(torrentList))
    JSON.parse(fs.readFileSync(torrentList)).forEach((torrent) =>
      addTorrent(torrent)
    );
  const writeTorrents = () => {
    console.log("Updating Torrent List File");
    fs.writeFileSync(
      torrentList,
      JSON.stringify(torrents.map(({ torrentStatus }) => torrentStatus))
    );
  };

  const removeCompleted = async (gid) => {
    console.log("Torrent Complete");
    const { following } = await aria2.call("tellStatus", gid[0].gid);
    const torrent = await getTorrent(following);
    if (torrent) {
      torrents.splice(torrents.indexOf(torrent), 1);
      writeTorrents();
      //moveToPlex(torrent);
      //a6await aria2.call("purgeDownloadResult");
    } else {
      const torrent = await getTorrent(gid);
      if (torrent) {
        torrents.splice(torrents.indexOf(torrent), 1);
        writeTorrents();
      }
    }
  };
  aria2.on("onDownloadError", removeCompleted);

  aria2.on("onBtDownloadComplete", removeCompleted);

  return {
    addTorrent,
    getTorrent,
    getTorrents,
    getSessionInfo,
  };
};
process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
  console.log({ exitCode });
  if (options.exit) process.exit();
}
//do something when app is closing
process.on("exit", exitHandler.bind(null, { cleanup: true }));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, { exit: true }));

// catches "kill pid" (for example: nodemon restart)
process.on("SIGUSR1", exitHandler.bind(null, { exit: true }));
process.on("SIGUSR2", exitHandler.bind(null, { exit: true }));

//catches uncaught exceptions
process.on("uncaughtException", exitHandler.bind(null, { exit: true }));
