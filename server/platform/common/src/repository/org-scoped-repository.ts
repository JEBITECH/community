/**
 * Organization-Scoped Repository Pattern
 *
 * Automatically filters all database queries by organization_id
 * to prevent Insecure Direct Object Reference (IDOR) vulnerabilities.
 *
 * CRITICAL SECURITY: This ensures users can only access data
 * from their own organization.
 *
 * Usage:
 * ```typescript
 * const userRepo = new OrgScopedRepository(User, orgId);
 * const users = await userRepo.find();  // Automatically filtered by org
 * ```
 */

import {
  Repository,
  FindOptionsWhere,
  FindOneOptions,
  FindManyOptions,
  DeepPartial,
  SaveOptions,
  RemoveOptions,
} from 'typeorm';

/**
 * Entity that requires organization scoping
 * All entities used with this repository must have organization_id field
 */
export interface OrgScopedEntity {
  id: string;
  organization_id: string;
  [key: string]: any;
}

/**
 * Organization-scoped repository wrapper
 *
 * Wraps TypeORM repository and automatically adds organization_id filter
 * to all queries
 */
export class OrgScopedRepository<T extends OrgScopedEntity> {
  constructor(
    private repository: Repository<T>,
    private organizationId: string
  ) {
    if (!organizationId) {
      throw new Error('OrgScopedRepository requires organizationId');
    }
  }

  /**
   * Find multiple entities filtered by organization
   *
   * @param options - Find options (will be merged with org filter)
   * @returns Array of entities from user's organization
   */
  async find(options: FindManyOptions<T> = {}): Promise<T[]> {
    const where = this.mergeOrgFilter(options.where);

    return this.repository.find({
      ...options,
      where,
    });
  }

  /**
   * Find one entity by ID, scoped to organization
   *
   * @param id - Entity ID
   * @param options - Additional find options
   * @returns Entity or null
   * @throws Error if entity not found or belongs to different org
   */
  async findOneById(id: string, options: FindOneOptions<T> = {}): Promise<T | null> {
    const where = this.mergeOrgFilter({ id } as any);

    const entity = await this.repository.findOne({
      ...options,
      where,
    } as any);

    return entity;
  }

  /**
   * Find one entity by ID, throw error if not found
   *
   * @param id - Entity ID
   * @param options - Additional find options
   * @returns Entity
   * @throws Error if entity not found or belongs to different org
   */
  async findOneByIdOrFail(id: string, options: FindOneOptions<T> = {}): Promise<T> {
    const entity = await this.findOneById(id, options);

    if (!entity) {
      throw new Error(
        `Entity not found or access denied (org: ${this.organizationId})`
      );
    }

    return entity;
  }

  /**
   * Find one entity by criteria
   *
   * @param options - Find options with where clause
   * @returns Entity or null
   */
  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    const where = this.mergeOrgFilter(options.where);

    return this.repository.findOne({
      ...options,
      where,
    } as any);
  }

  /**
   * Find one entity by criteria, throw if not found
   *
   * @param options - Find options with where clause
   * @returns Entity
   * @throws Error if not found
   */
  async findOneOrFail(options: FindOneOptions<T>): Promise<T> {
    const entity = await this.findOne(options);

    if (!entity) {
      throw new Error(
        `Entity not found or access denied (org: ${this.organizationId})`
      );
    }

    return entity;
  }

  /**
   * Count entities in organization
   *
   * @param options - Count options
   * @returns Count of entities
   */
  async count(options: FindManyOptions<T> = {}): Promise<number> {
    const where = this.mergeOrgFilter(options.where);

    return this.repository.count({
      ...options,
      where,
    });
  }

  /**
   * Check if entity exists by ID
   *
   * @param id - Entity ID
   * @returns True if exists in user's organization
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.count({
      where: { id } as any,
    });

    return count > 0;
  }

  /**
   * Create a new entity (automatically sets organization_id)
   *
   * @param entityData - Entity data
   * @returns Created entity (not saved)
   */
  create(entityData: DeepPartial<T>): T {
    return this.repository.create({
      ...entityData,
      organization_id: this.organizationId,
    } as DeepPartial<T>) as T;
  }

  /**
   * Save entity (automatically sets organization_id if not set)
   *
   * SECURITY: Verifies entity belongs to organization before save
   *
   * @param entity - Entity to save
   * @param options - Save options
   * @returns Saved entity
   */
  async save(entity: DeepPartial<T>, options?: SaveOptions): Promise<T> {
    // Ensure organization_id is set
    const entityToSave = {
      ...entity,
      organization_id: this.organizationId,
    } as T;

    // If updating existing entity, verify it belongs to org
    if ((entity as any).id) {
      const existing = await this.findOneById((entity as any).id);
      if (!existing) {
        throw new Error(
          `Cannot save: Entity not found or access denied (org: ${this.organizationId})`
        );
      }
    }

    return this.repository.save(entityToSave, options);
  }

  /**
   * Save multiple entities
   *
   * @param entities - Array of entities
   * @param options - Save options
   * @returns Saved entities
   */
  async saveMany(entities: DeepPartial<T>[], options?: SaveOptions): Promise<T[]> {
    const entitiesToSave = entities.map((entity) => ({
      ...entity,
      organization_id: this.organizationId,
    })) as T[];

    return this.repository.save(entitiesToSave, options);
  }

  /**
   * Update entity by ID
   *
   * SECURITY: Only updates if entity belongs to organization
   *
   * @param id - Entity ID
   * @param updates - Partial entity with updates
   * @returns Updated entity
   */
  async update(id: string, updates: DeepPartial<T>): Promise<T> {
    // Verify entity exists and belongs to org
    const existing = await this.findOneByIdOrFail(id);

    // Merge updates
    const updated = this.repository.merge(existing, updates as any);

    // Save (will verify org again)
    return this.save(updated);
  }

  /**
   * Remove entity by ID
   *
   * SECURITY: Only removes if entity belongs to organization
   *
   * @param id - Entity ID
   * @param options - Remove options
   */
  async remove(id: string, options?: RemoveOptions): Promise<void> {
    const entity = await this.findOneByIdOrFail(id);
    await this.repository.remove(entity, options);
  }

  /**
   * Remove multiple entities
   *
   * @param ids - Array of entity IDs
   * @param options - Remove options
   */
  async removeMany(ids: string[], options?: RemoveOptions): Promise<void> {
    const entities = await this.find({
      where: { id: ids as any } as any,
    });

    if (entities.length !== ids.length) {
      throw new Error(
        `Some entities not found or access denied (org: ${this.organizationId})`
      );
    }

    await this.repository.remove(entities, options);
  }

  /**
   * Soft delete entity by ID
   *
   * Note: Entity must have deletedAt column for soft delete
   *
   * @param id - Entity ID
   */
  async softDelete(id: string): Promise<void> {
    // Verify entity exists and belongs to org
    await this.findOneByIdOrFail(id);

    // Soft delete with org check
    await this.repository.softDelete({
      id,
      organization_id: this.organizationId,
    } as any);
  }

  /**
   * Restore soft-deleted entity
   *
   * @param id - Entity ID
   */
  async restore(id: string): Promise<void> {
    await this.repository.restore({
      id,
      organization_id: this.organizationId,
    } as any);
  }

  /**
   * Get the underlying TypeORM repository
   *
   * WARNING: Use with caution - bypasses org filtering
   * Only use when you explicitly need to query across organizations
   * (e.g., admin operations, system tasks)
   *
   * @returns Underlying repository
   */
  getUnscopedRepository(): Repository<T> {
    console.warn('⚠️  Accessing unscoped repository - ensure this is intentional');
    return this.repository;
  }

  /**
   * Execute custom query with org filter
   *
   * @param queryBuilder - Callback to build query
   * @returns Query results
   */
  async query<R = T>(
    queryBuilder: (qb: any) => any
  ): Promise<R[]> {
    const qb = this.repository
      .createQueryBuilder('entity')
      .where('entity.organization_id = :orgId', { orgId: this.organizationId });

    const customQb = queryBuilder(qb);

    return customQb.getMany();
  }

  /**
   * Helper: Merge organization filter into where clause
   *
   * @param where - Original where clause
   * @returns Where clause with org filter
   */
  private mergeOrgFilter(
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[]
  ): FindOptionsWhere<T> | FindOptionsWhere<T>[] {
    const orgFilter = { organization_id: this.organizationId };

    if (!where) {
      return orgFilter as any;
    }

    // Handle array of where clauses
    if (Array.isArray(where)) {
      return where.map((w) => ({ ...w, ...orgFilter }));
    }

    // Handle single where clause
    return { ...where, ...orgFilter };
  }
}

/**
 * Factory function to create org-scoped repository from request
 *
 * Usage:
 * ```typescript
 * const userRepo = createOrgScopedRepo(User, req);
 * ```
 */
export function createOrgScopedRepo<T extends OrgScopedEntity>(
  entity: any,
  req: any
): OrgScopedRepository<T> {
  const user = req.user;

  if (!user || !user.organization_id) {
    throw new Error('User context with organization_id required');
  }

  const repository = req.app.locals.dataSource.getRepository(entity);
  return new OrgScopedRepository<T>(repository, user.organization_id);
}
