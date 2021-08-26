import styled from "styled-components";
import { useState } from "react";
import trackerList from "../trackers.json";
console.log(trackerList);
const trackers = [];
trackerList.forEach((tracker) => {
  tracker.forEach((site) => {
    trackers.push(site);
  });
});
console.log(trackers);
const MovieWrapper = styled.div`
  position: relative;
`;

const AddMovieButton = styled.a`
  position: absolute;
  display: inline-block;
  padding: 12px 12px 10px;
  border: 0;
  left: 10px;
  top: 10px;
  border-radius: 3px;
  background: #bf4d28;
  text-decoration: none;
  transition: all 1.2s ease-in-out;
  &.downloading {
    cursor: none;
    opacity: 0.5;
  }
  img {
    width: 30px;
  }

  &:hover {
    animation: pulse 0.2s 2 both;
  }

  @keyframes pulse {
    from {
      transform: scale3d(1, 1, 1);
    }

    50% {
      transform: scale3d(1.05, 1.05, 1.05);
    }

    to {
      transform: scale3d(1, 1, 1);
    }
  }
`;

const Poster = styled.img`
  border-radius: 3px;
  border: 2px solid black;
  padding: 0px;
  margin: 3px;
  min-height: 200px;
`;

const constructMagnet = (hash, title) => {
  return `magnet:?xt=urn:btih:${hash}&dn=${encodeURI(title)}&tr=${trackers.join(
    "&tr="
  )}`;
};

export default ({ poster, title, torrent: { hash }, downloadMovie }) => {
  const url = constructMagnet(hash, title);
  console.log(url);
  const [downloading, setDownloading] = useState(false);
  return (
    <MovieWrapper>
      <AddMovieButton
        className={downloading ? "downloading" : "new"}
        onClick={async (e) => {
          if (await downloadMovie({ url, hash, title, poster })) {
            setDownloading(true);
          }
        }}
      >
        <img
          alt="download icon"
          src="https://static.thenounproject.com/png/261370-200.png"
        />
      </AddMovieButton>
      <Poster src={poster} />
    </MovieWrapper>
  );
};
