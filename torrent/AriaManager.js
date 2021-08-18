/*
  METHODS
  'addUri',
  'addTorrent',
  'getPeers',
  'addMetalink',
  'remove',
  'pause',
  'forcePause',
  'pauseAll',
  'forcePauseAll',
  'unpause',
  'unpauseAll',
  'forceRemove',
  'changePosition',
  'tellStatus',
  'getUris',
  'getFiles',
  'getServers',
  'tellActive',
  'tellWaiting',
  'tellStopped',
  'getOption',
  'changeUri',
  'changeOption',
  'getGlobalOption',
  'changeGlobalOption',
  'purgeDownloadResult',
  'removeDownloadResult',
  'getVersion',
  'getSessionInfo',
  'shutdown',
  'forceShutdown',
  'getGlobalStat',
  'saveSession',
  'system.multicall',
  'system.listMethods',
  'system.listNotifications'

  Notifications
  'onDownloadStart',
  'onDownloadPause',
  'onDownloadStop',
  'onDownloadComplete',
  'onDownloadError',
  'onBtDownloadComplete'

*/

const { spawn } = require("child_process");
const fs = require("fs");
const Aria2 = require("aria2");
const Torrent = require("./Torrent");
var ariaProcess;
const torrents = [];
//const dir = "F:/tmp";
const dir = "F:/Plex/Movies";
const aria2 = new Aria2({
  host: "localhost",
  port: 6800,
  secure: false,
  secret: "",
  path: "/jsonrpc",
});

const moveToPlex = (data) => {
  console.log(JSON.stringify(data));
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
      "--always-resume",
      "--enable-rpc",
      "--rpc-listen-all=true",
      "--rpc-allow-origin-all",
      "--seed-time=0",
      "--continue=true",
      "--max-concurrent-downloads=12",
      "--max-overall-upload-limit=0",
    ],
    { detached: true, shell: true }
  );
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 5000);
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
  aria2.on("onBtDownloadComplete", async (gid) => {
    console.log("Torrent Complete");
    const { following } = await aria2.call("tellStatus", gid[0].gid);
    const torrent = await getTorrent(following).getStatus();
    //moveToPlex(torrent);
    await aria2.call("purgeDownloadResult");
  });

  const getSessionInfo = async () => {
    const resp = await aria2.call("getSessionInfo");
    return resp;
  };

  const addTorrent = async ({ hash, magnet, poster, title }) => {
    const guid = await aria2.call("addUri", [magnet], { dir, "seed-time": 0 });
    console.log(guid);
    const torrent = Torrent(aria2, hash, guid, poster, title);
    torrents.push(torrent);
    return torrent;
  };

  const getTorrents = async () => {
    return Promise.all(torrents.map((torrent) => torrent.getStatus()));
  };
  const getTorrent = (selector) => {
    var torrent;
    for (var i = 0; i < torrents.length; i++) {
      if (
        torrents[i].getHash() == selector ||
        torrents[i].getGuid() == selector
      ) {
        torrent = torrents[i];
        break;
      }
    }
    return torrent;
  };
  return {
    addTorrent,
    getTorrent,
    getTorrents,
    getSessionInfo,
  };
};
process.stdin.resume(); //so the program will not close instantly

function exitHandler(options, exitCode) {
  if (options.cleanup) console.log("clean");
  if (exitCode || exitCode === 0) console.log(exitCode);
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
