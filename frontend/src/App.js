//import "./styles.css";
import { useState } from "react";
import yts from "yts";
import Container from "./components/container";
import Movie from "./components/movie";

const Torrent = {};
Torrent.COMPLETE = "complete";
Torrent.ERROR = "error";
Torrent.INFO_HASH = "info_hash";
Torrent.LOADING = "loading";
Torrent.PEER = "peer";
Torrent.PROGRESS = "progress";
Torrent.READY = "ready";

var endpoint = "https://localhost";

// fetch(`${endpoint}/local`, { method: "post" })
//   .then((response) => {
//     if (!response.ok) {
//       console.log("switching to localhost");
//       endpoint = "https://localhost";
//     }
//   })
//   .catch((err) => {
//     console.log("switching to localhost");
//     endpoint = "https://localhost";
//   });

export default function App() {
  const [query_term, updateQuery] = useState();
  const [movies, updateMovies] = useState([]);
  const [page, setPageNumber] = useState(1);
  const handleQueryUpdate = (e) => {
    updateQuery(e.target.value);
  };

  const search = async (p) => {
    setPageNumber(p);
    const { movies: movs } = await yts.listMovies({
      query_term,
      limit: 50,
      page: p,
    });
    updateMovies(movs);
  };
  const downloadMovie = async (movie) => {
    // const query = Object.keys(movie)
    //   .map((key) => key + "=" + movie[key])
    //   .join("&");
    const response = await fetch(`${endpoint}`, {
      headers: {
        "Bypass-Tunnel-Reminder": "test",
        "User-Agent": "nothing",
        "Content-Type": "application/json",
      },
      method: "post",
      body: JSON.stringify(movie),
    });

    const rsjson = await response.json();
    if (rsjson.status == Torrent.LOADING) {
      return true;
    } else {
      return false;
    }
    console.log(response);
  };

  return (
    <>
      <Container>
        <input
          value={query_term}
          onChange={handleQueryUpdate}
          type="text"
          placeholder="Movie/Series"
        />
        <button
          onClick={() => {
            search(1);
          }}
        >
          Search
        </button>
        {page > 1 ? (
          <button
            onClick={() => {
              search(page - 1);
            }}
          >
            {"<-"}
          </button>
        ) : (
          ""
        )}

        <button
          onClick={() => {
            search(page + 1);
          }}
        >
          {"->"}
        </button>
      </Container>
      <Container>
        {movies.map(
          ({ torrents, medium_cover_image: poster, title }, index) => {
            return (
              <Movie
                key={torrents[torrents.length - 1].hash}
                downloadMovie={downloadMovie}
                poster={poster}
                title={title}
                torrent={torrents[torrents.length - 1]}
              />
            );
          }
        )}
      </Container>
    </>
  );
}
