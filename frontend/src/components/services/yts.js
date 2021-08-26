import yts from "yts";

export const queryMovies = async (p) => {
  setPageNumber(p);
  const { movies: movs } = await yts.listMovies({
    query_term,
    limit: 50,
    page: p,
  });
  updateMovies(movs);
};
