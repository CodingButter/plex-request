const Nightmare = require("nightmare");
require("nightmare-window-manager")(Nightmare);
require("nightmare-real-mouse")(Nightmare);
const open = require("open");
const robot = require("robotjs");
const fs = require("fs");
const shell = require("shelljs");
const path = require("path");
const statusData = {};

const { wait } = require("nightmare/lib/actions");
const tvPath = "F:\\Plex\\TV";
const tmpPath = "F:\\tmp";
var nightmare;

const moveDownloadedToFolder = (showTitle, tmdb, file, season, episode) => {
  file = file.replace("Download ", "");
  const downloadPath = path.join(tmpPath, file);
  const splitName = file.split("-");

  const extension = file.split(".").pop();

  splitName.pop();
  splitName.pop();
  const title = showTitle;
  const newFileName = `${title} s${season}e${episode}.${extension}`;
  //setEpisodeStatus(tmdb, season, episode, "Downloading");
  const folder = path.join(tvPath, title, `season ${season}`);
  const newFilePath = path.join(folder, newFileName);
  console.log({
    season,
    episode,
    title,
    downloadPath,
    folder,
    newFileName,
    newFilePath,
  });
  if (!fs.existsSync(folder)) shell.mkdir("-p", folder);
  var maxAttempts = 20;
  var currentAttempts = 1;
  setEpisodeStatus(tmdb, season, episode, "Downloading");
  const moveFileInterval = setInterval(() => {
    if (fs.existsSync(downloadPath)) {
      try {
        fs.rename(downloadPath, newFilePath, () => {
          clearInterval(moveFileInterval);
          setEpisodeStatus(tmdb, season, episode, "Complete");
        });
      } catch (error) {
        setEpisodeStatus(tmdb, season, episode, "Couldnt find Episdode");
        console.log({ title, season, episode, status: "didnt move correctly" });
      }
    }
  }, 60000);
};
const waitTime = async (timeout) => {
  return new Promise((respond, reject) => {
    setTimeout(() => {
      respond();
    }, timeout);
  });
};

const waitForColor = async (hex, { x, y }, attempts = 1) => {
  if (attempts == 15) return false;
  if (robot.getPixelColor(x, y) === hex) return true;
  await waitTime(1000);
  await waitForColor(hex, { x, y }, attempts + 1);
};

const getDownloadLink = async (tmdb, season, episode) => {
  setEpisodeStatus(tmdb, season, episode, "waiting for download button");
  const { x, y } = { x: 1186, y: 796 };
  const downloadHex = "ffb30e";

  nightmare = new Nightmare({
    show: true,
    webPreferences: { webSecurity: false },
  });
  nightmare.windowManager();

  const close = async () => {
    let windows = await nightmare.windows();
    let lowestID = windows[0].id;
    if (windows.length > 1) {
      console.log("closing window with id:" + windows[windows.length - 1].id);
      for (var i = windows.length - 1; i > 0; i--) {
        if (windows[i].id != lowestID)
          await nightmare.closeWindow(windows[i].id);
      }
    }
  };

  const clickTillDownload = async (clickedDownload = false) => {
    const windows = await nightmare.windows();

    const location = windows.filter(({ url }) => url.includes("ninjashare"))[0];

    if (!location && clickedDownload)
      return await getDownloadLink(tmdb, season, episode);
    await nightmare.realClick("iframe");
    await waitTime(1000);
    const mp = robot.getMousePos();
    //console.log(mp, robot.getPixelColor(mp.x, mp.y));
    if (robot.getPixelColor(x, y) == downloadHex && !clickedDownload) {
      robot.moveMouse(x, y);
      robot.mouseClick();
      clickedDownload = true;
      await waitTime(1000);
    } else {
      await close();
    }

    await waitTime(1500);
    if (!location) return await clickTillDownload(clickedDownload);
    return location;
  };
  await nightmare.goto(
    `https://www.2embed.ru/embed/tmdb/tv?id=${tmdb}&s=${season}&e=${episode}`
  );

  const { url, title } = await clickTillDownload();
  close();
  if (url) return { url, title, season, episode };
  return false;
};

const ninjaDownload = async (
  showTitle,
  tmdb,
  pagetitle,
  fileLink,
  season,
  episode
) => {
  const { x, y } = { x: 983, y: 556 };
  const hex = "fd1b23";
  open(fileLink);
  await waitTime(5000);
  robot.moveMouse(x, y);

  const startedDownload = await waitForColor(hex, { x, y });
  if (!startedDownload) {
    setEpisodeStatus(tmdb, season, episode, "File Isn't hosted Anymore");
    //throw "File Isn't Hosted anymore";
  } else {
    robot.mouseClick();
    moveDownloadedToFolder(showTitle, tmdb, pagetitle, season, episode);
  }
  return true;
};

const getSeasonDownloadLinks = async (
  showTitle,
  tmdb,
  season,
  episodes,
  episode = 1
) => {
  if (episode <= episodes) {
    try {
      var { url, title } = await getDownloadLink(tmdb, season, episode);
      if (!url) {
        //throw "error";
      } else {
        if (nightmare.end) {
          await nightmare.end();
        }
        await ninjaDownload(showTitle, tmdb, title, url, season, episode);
      }
    } catch (err) {
      console.log(err);
      console.log(`season ${season} episode ${episode} failed\n`);
    }
    await getSeasonDownloadLinks(
      showTitle,
      tmdb,
      season,
      episodes,
      episode + 1
    );
  }
  return;
};

const downloadSeries = async (showTitle, tmdb, seasonData, season = 2) => {
  initiateShowStatus(tmdb, seasonData, season);
  await getSeasonDownloadLinks(showTitle, tmdb, season, seasonData[season - 1]);
  if (season === seasonData.length) return true;
  await waitTime(60000 * 5);
  await downloadSeries(showTitle, tmdb, seasonData, season + 1);
};

const setEpisodeStatus = (tmdb, season, episode, status) => {
  statusData[tmdb][season - 1][episode - 1] = status;
  console.log({ tmdb, season, episode, status });
};

const initiateShowStatus = (tmdb, seasonData) => {
  if (!statusData[tmdb])
    statusData[tmdb] = seasonData.map((episodeCount) => {
      return new Array(episodeCount).fill("Queded for Download");
    });
};

const getTVStatus = () => {
  return statusData;
};

module.exports = {
  downloadSeries,
  getTVStatus,
};
