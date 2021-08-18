const Torrent = (aria2, hash, guid, poster, title) => {
  var torrentStatus;
  //getters
  const getStatus = async () => {
    try {
      const status = await aria2.call("tellStatus", guid);
      if (status.files && status.followedBy) {
        status.files = await Promise.all(
          status.followedBy.map(async (gid) => {
            return await aria2.call("tellStatus", gid);
          })
        );
      }
      status.title = title;
      status.poster = poster;
      console.log(poster, title);
      torrentStatus = status;
      return status;
    } catch (err) {
      torrentStatus.status = "complete";
      return torrentStatus;
    }
  };

  const getFiles = async () => {
    return await aria2.call("getFiles", guid);
  };

  const getHash = () => hash;
  const getGuid = () => guid;

  const stop = async () => {
    return await aria2.call("remove", guid);
  };

  const tell = async (key) => {
    return await aria2.call("tellStatus", guid, [key]);
  };

  const getDownloadSpeed = async () => {
    return await aria2.call("tellStatus");
  };
  const getTitle = () => title;
  const getPoster = () => poster;
  return {
    getStatus,
    getHash,
    getGuid,
    getFiles,
    getPoster,
    getTitle,
    //Actions
    stop,
  };
};
module.exports = Torrent;
