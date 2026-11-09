import { IPaginatedResult, IPaginationOptions } from '../interfaces/pagination.interface.js';

export interface IBaseRepository<T> {
  findById(id: string, include?: any): Promise<T | null>;
  findFirst(where: any, include?: any): Promise<T | null>;
  findMany(where?: any, options?: any, include?: any): Promise<T[]>;
  findPaginated(where?: any, pagination?: IPaginationOptions, include?: any): Promise<IPaginatedResult<T>>;
  count(where?: any): Promise<number>;
  create(data: any, tx?: any): Promise<T>;
  update(where: any, data: any, tx?: any): Promise<T>;
  delete(where: any, tx?: any): Promise<T>;
  exists(where: any): Promise<boolean>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  public constructor(protected readonly modelDelegate: any) {}

  public async findById(id: string, include?: any): Promise<T | null> {
    return this.modelDelegate.findUnique({
      where: { id },
      ...(include ? { include } : {})
    });
  }

  public async findFirst(where: any, include?: any): Promise<T | null> {
    return this.modelDelegate.findFirst({
      where,
      ...(include ? { include } : {})
    });
  }

  public async findMany(where: any = {}, options: any = {}, include?: any): Promise<T[]> {
    return this.modelDelegate.findMany({
      where,
      ...options,
      ...(include ? { include } : {})
    });
  }

  public async findPaginated(
    where: any = {},
    pagination: IPaginationOptions = {},
    include?: any
  ): Promise<IPaginatedResult<T>> {
    const page = Math.max(1, Number(pagination.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(pagination.limit) || 10));
    const skip = (page - 1) * limit;

    const orderBy: any = pagination.sortBy
      ? { [pagination.sortBy]: pagination.sortOrder || 'desc' }
      : { createdAt: 'desc' };

    const [total, data] = await Promise.all([
      this.modelDelegate.count({ where }),
      this.modelDelegate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        ...(include ? { include } : {})
      })
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  public async count(where: any = {}): Promise<number> {
    return this.modelDelegate.count({ where });
  }

  public async create(data: any, tx?: any): Promise<T> {
    const delegate = tx ? tx[this.getModelName()] || this.modelDelegate : this.modelDelegate;
    return delegate.create({ data });
  }

  public async update(where: any, data: any, tx?: any): Promise<T> {
    const delegate = tx ? tx[this.getModelName()] || this.modelDelegate : this.modelDelegate;
    return delegate.update({
      where,
      data
    });
  }

  public async delete(where: any, tx?: any): Promise<T> {
    const delegate = tx ? tx[this.getModelName()] || this.modelDelegate : this.modelDelegate;
    return delegate.delete({ where });
  }

  public async exists(where: any): Promise<boolean> {
    const count = await this.modelDelegate.count({ where });
    return count > 0;
  }

  protected getModelName(): string {
    return '';
  }
}

