const fs = require("fs");
const { downloadSeries } = require("../tvShows");
class Torrent {
  constructor({
    backdrop,
    aria2,
    mediaType,
    magnet,
    guid,
    poster,
    title,
    tmdb,
  }) {
    this.torrentStatus = {
      magnet,
      poster,
      title,
      gid: guid,
      tmdb,
      completedLength: 0,
      totalLength: 0,
      mediaType,
      backdrop,
    };
    this.aria2 = aria2;
    this.tmdb = tmdb;
    this.guid = guid;
    this.poster = poster;
    this.title = title;
    this.backdrop = backdrop;
  }

  //getters
  async getStatus() {
    const totalFileStatus = {
      completedLength: 0,
      totalLength: 0,
      downloadSpeed: 0,
    };
    const currentStatus = this.torrentStatus.status;
    try {
      const status = await this.aria2.call("tellStatus", this.guid);
      if (status.files && status.followedBy) {
        status.files = await Promise.all(
          status.followedBy.map(async (gid) => {
            return await this.aria2.call("tellStatus", gid);
          })
        );
      }
      fs.writeFileSync("./torrentInfo.json", JSON.stringify(status.files));

      status.files.forEach(
        ({ completedLength, totalLength, downloadSpeed }) => {
          totalFileStatus.completedLength += parseInt(completedLength);
          totalFileStatus.totalLength += parseInt(totalLength);
          totalFileStatus.downloadSpeed += parseInt(downloadSpeed);
        }
      );
      this.torrentStatus = {
        ...this.torrentStatus,
        ...status,
        ...totalFileStatus,
      };
      return this.torrentStatus;
    } catch (err) {
      console.log(err);
      return false;
    }
  }

  getLastStatus() {
    return this.torrentStatus;
  }

  async getFiles() {
    return await this.aria2.call("getFiles", this.guid);
  }

  getTMDB() {
    return this.tmdb;
  }
  getGuid() {
    return this.guid;
  }
  async stop() {
    return await this.aria2.call("remove", this.guid);
  }

  async tell(key) {
    return await this.aria2.call("tellStatus", this.guid, [key]);
  }

  getTitle() {
    return this.title;
  }
  getPoster() {
    return poster;
  }
}
module.exports = Torrent;
