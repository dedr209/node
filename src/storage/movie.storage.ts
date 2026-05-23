import { MovieModel, type MovieRecord } from "../models/movie.model";
import type {
  CreateMovieInput,
  MovieEntity,
  UpdateMovieInput,
} from "../schemas/movie.schema";

type Movie = MovieEntity & {
  director?: string;
  releaseAge?: number;
};

type MovieRecordJson = {
  _id?: string;
  id?: string;
  __v?: unknown;
} & Record<string, unknown>;

type MovieFilters = { genre?: string; director?: string };

type MovieWriteInput = CreateMovieInput & {
  director?: string;
};

type MovieUpdateInput = UpdateMovieInput & {
  director?: string;
};

const toMovie = (movie: MovieRecord): Movie => {
  const rawMovie = movie.toJSON({
    virtuals: true,
    versionKey: false,
  }) as MovieRecordJson;

  const id = rawMovie.id ?? rawMovie._id;

  if (!id) {
    throw new Error("Movie document is missing id");
  }

  const { _id, __v, ...movieWithoutMongoFields } = rawMovie;
  void _id;
  void __v;

  return {
    ...movieWithoutMongoFields,
    id,
  } as Movie;
};

export class MovieStorage {
  async create(data: MovieWriteInput): Promise<Movie> {
    const movie = await MovieModel.create(data);
    return toMovie(movie);
  }

  async getById(id: string): Promise<Movie | null> {
    const movie = await MovieModel.findById(id).exec();
    return movie ? toMovie(movie) : null;
  }

  async getAll(filters: MovieFilters = {}): Promise<Movie[]> {
    const query: Record<string, unknown> = {};

    if (filters.genre) {
      query.genre = filters.genre;
    }

    if (filters.director) {
      query.director = filters.director;
    }

    const movies = await MovieModel.find(query).exec();
    return movies.map(toMovie);
  }

  async update(id: string, data: MovieUpdateInput): Promise<Movie | null> {
    const movie = await MovieModel.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    }).exec();

    return movie ? toMovie(movie) : null;
  }

  async delete(id: string): Promise<boolean> {
    const movie = await MovieModel.findByIdAndDelete(id).exec();
    return movie !== null;
  }

  async reset(): Promise<void> {
    await MovieModel.deleteMany({}).exec();
  }

  async getTopRated(): Promise<Movie[]> {
    const movies = await MovieModel.find({ releaseYear: { $gt: 2020 } }).exec();
    return movies.map(toMovie);
  }
}

export const storage = new MovieStorage();

