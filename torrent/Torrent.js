class Torrent {
  constructor({ aria2, magnet, guid, poster, title, tmdb }) {
    this.torrentStatus = {
      magnet,
      poster,
      title,
      gid: guid,
      tmdb,
      completedLength: 0,
      totalLength: 0,
    };
    this.aria2 = aria2;
    this.tmdb = tmdb;
    this.guid = guid;
    this.poster = poster;
    this.title = title;
  }

  //getters
  async getStatus() {
    const currentStatus = this.torrentStatus.status;
    try {
      const status = await this.aria2.call("tellStatus", this.guid);
      if (status.files && status.followedBy) {
        status.files = await Promise.all(
          status.followedBy.map(async (gid) => {
            return await this.aria2.call("tellStatus", gid);
          })
        );

        this.torrentStatus = {
          ...this.torrentStatus,
          ...status.files.filter(({ status }) => status == "active")[0],
        };
      }
      return this.torrentStatus;
    } catch (err) {
      return this.torrentStatus;
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
