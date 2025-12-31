# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Billio is a digital shelving application for tracking books, video games, movies, and TV series. Items can be placed on shelves (e.g., Reading, Read, DidNotFinish) and tracked over time. Data comes from external APIs: Google Books, IGDB (video games), and TMDB (movies/TV).

## Commands

```bash
# Build all packages
yarn build

# Format check (uses prettier)
yarn check

# Fix formatting
yarn fix

# Deploy to AWS
yarn deploy

# Run GraphQL server locally
yarn start:graphql
# Use INFRA_STACK=test to connect to test DSQL table instead of local dev table

# Run Admin UI locally
yarn start:admin
# Use REACT_APP_USE_LOCAL_GRAPHQL=1 to connect to local GraphQL server

# Run tests against local GraphQL server
yarn test:graphql-local

# Run tests against deployed test API
yarn test:graphql-integration

# Run database migrations
yarn workspace @mattb.tech/billio-data migrate

# Regenerate GraphQL TypeScript types
yarn workspace @mattb.tech/billio-graphql codegen
```

## Architecture

### Monorepo Structure (Yarn Workspaces + Turborepo)

- **packages/data** - PostgreSQL data layer using Drizzle ORM with AWS DSQL. Exports `Query` and `Mutate` objects for all database operations. Schema defined in `schema.ts`, uses `items_v2` table with type-specific data stored in a JSON `data` column.

- **packages/graphql** - Apollo Server GraphQL layer. Uses a modular pattern where each item type (book, videogame, feature/movie, tvSeries, watching) is a `GqlModule` that gets combined via `combineModules()`. Resolvers are generic and parameterized by type-specific transforms.

- **packages/admin** - React Admin UI for managing items. Authenticates via AWS Cognito.

- **packages/cdk** - AWS CDK infrastructure. Deploys three API instances:
  - Main API (IAM auth, mutations enabled)
  - Readonly API (unauthenticated, no mutations)
  - Test API (unauthenticated, mutations enabled)

- **packages/graphql-snapshot-tests** - Integration tests using Jest snapshots against the GraphQL API.

- **packages/backup** - Lambda that exports data monthly to S3.

- **packages/restore** - Utilities for restoring data from backups.

- **packages/bulk-import** - Bulk import from external sources (Goodreads for books, IMDb for movies/TV).

### Adding a New Item Type

1. Create a new directory under `packages/graphql/src/` (e.g., `tvSeries/`)
2. Define GraphQL schema with `gql` template literal
3. Create type-specific transforms: `AddInputTransform`, `UpdateInputTransform`, `OutputTransform`, `ExternalToInputTransform`
4. Use generic resolvers from `resolvers/` directory
5. Export a `GqlModule` and add it to `schema.ts` via `combineModules()`
6. If external data needed, implement `ExternalApi` interface

### Key Patterns

- **Data Layer**: Uses Drizzle ORM with PostgreSQL (AWS DSQL). Common fields (id, type, shelf, title, rating, etc.) are stored as columns; type-specific fields go in the `data` JSON column.
- **Transform Pattern**: Generic resolvers accept transform functions to handle type-specific field mapping between GraphQL and database representations.
- **Shelf System**: Each item type has its own shelf enum (e.g., `BookShelfId`, `VideogameShelfId`) with corresponding names map.
- **GraphQL Codegen**: Types are auto-generated from schema - run `yarn codegen` in graphql package after schema changes.
