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

type MovieSortBy = "createdAt" | "releaseYear" | "title";
type MovieSortOrder = "asc" | "desc";

type MovieQueryOptions = {
  page: number;
  limit: number;
  sortBy: MovieSortBy;
  sortOrder: MovieSortOrder;
  genre?: string;
  director?: string;
  title?: string;
  releaseYearMin?: number;
  releaseYearMax?: number;
};

export type MoviesPageResult = {
  data: Movie[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

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

  async getAll(options: MovieQueryOptions): Promise<MoviesPageResult> {
    const query: Record<string, unknown> = {};

    if (options.genre) {
      query.genre = options.genre;
    }

    if (options.director) {
      query.director = options.director;
    }

    if (options.title) {
      // Text filter via MongoDB regex operator.
      query.title = { $regex: options.title, $options: "i" };
    }

    if (options.releaseYearMin !== undefined || options.releaseYearMax !== undefined) {
      // Numeric range filter via MongoDB comparison operators.
      query.releaseYear = {
        ...(options.releaseYearMin !== undefined ? { $gte: options.releaseYearMin } : {}),
        ...(options.releaseYearMax !== undefined ? { $lte: options.releaseYearMax } : {}),
      };
    }

    const skip = (options.page - 1) * options.limit;
    const sortDirection = options.sortOrder === "asc" ? 1 : -1;

    const [movies, total] = await Promise.all([
      MovieModel.find(query)
        .sort({ [options.sortBy]: sortDirection })
        .skip(skip)
        .limit(options.limit)
        .exec(),
      MovieModel.countDocuments(query).exec(),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / options.limit);

    return {
      data: movies.map(toMovie),
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        totalPages,
        hasNextPage: options.page < totalPages,
        hasPreviousPage: options.page > 1 && totalPages > 0,
      },
    };
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

