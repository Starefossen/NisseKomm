# Sanity Content Migrations

This directory contains Sanity content migrations for the NisseKomm project.

## What are Sanity Migrations?

Sanity migrations allow you to update existing content in your dataset programmatically. Unlike schema changes (which only affect the validation/structure), migrations modify the actual content stored in Sanity.

## Migration Structure

Each migration lives in its own folder with an `index.ts` file:

```text
migrations/
  enable-email-subscriptions/
    index.ts
```

## Available Migrations

### `enable-email-subscriptions`

**Purpose**: Sets `emailSubscription=true` for all existing families.

**When to use**: After deploying the email subscription feature to opt-in existing users.

**Run commands**:

```bash
# Preview changes (dry run) - Development
pnpm migration:run:dev enable-email-subscriptions --dry-run

# Preview changes (dry run) - Production
pnpm migration:run:prod enable-email-subscriptions --dry-run

# Execute migration - Development
pnpm migration:run:dev enable-email-subscriptions

# Execute migration - Production
pnpm migration:run:prod enable-email-subscriptions
```

## How to Run Migrations

### 1. List Available Migrations

```bash
pnpm migration:list
```

### 2. Dry Run (Preview Changes)

**Always run with `--dry-run` first** to preview what will change:

```bash
# Development dataset
pnpm migration:run:dev <migration-name> --dry-run

# Production dataset
pnpm migration:run:prod <migration-name> --dry-run
```

The dry run will show you:

- How many documents will be affected
- What mutations will be applied
- Any potential errors

### 3. Execute Migration

After reviewing the dry run output, execute the migration:

```bash
# Development dataset
pnpm migration:run:dev <migration-name>

# Production dataset
pnpm migration:run:prod <migration-name>
```

## Creating a New Migration

### Option 1: Use Sanity CLI

```bash
# Create migration scaffold
pnpm sanity migration create

# Follow the prompts to name your migration
```

### Option 2: Manual Creation

1. Create a new folder in `migrations/` with a descriptive name
2. Create `index.ts` inside with the following template:

```typescript
import { defineMigration, set, at } from "@sanity/migrate";

export default defineMigration({
  title: "Description of your migration",
  documentTypes: ["yourDocumentType"], // Optional: filter by type

  migrate: {
    document(doc, context) {
      // Your migration logic here
      // Return mutations to apply
      return at("fieldName", set("newValue"));
    },
  },
});
```

## Migration Best Practices

### 1. Always Test in Development First

Never run migrations directly in production. Test in development dataset first:

```bash
# Test in dev
pnpm migration:run:dev <migration-name> --dry-run
pnpm migration:run:dev <migration-name>

# Then run in prod
pnpm migration:run:prod <migration-name> --dry-run
pnpm migration:run:prod <migration-name>
```

### 2. Use Dry Runs

**ALWAYS** use `--dry-run` flag before executing:

- Preview exactly what will change
- Catch errors before they affect real data
- Verify the migration logic is correct

### 3. Check Document Types

Filter migrations to specific document types to avoid unintended changes:

```typescript
export default defineMigration({
  documentTypes: ["familyCredentials"], // Only process these types
  // ...
});
```

### 4. Conditional Updates

Only update documents that need changes:

```typescript
document(doc, context) {
  // Skip if field already has the correct value
  if (doc.emailSubscription === true) {
    return; // No changes needed
  }

  // Apply changes only to documents that need them
  return at("emailSubscription", set(true));
}
```

### 5. Backup Before Large Migrations

For production migrations affecting many documents:

1. Ensure Sanity backups are enabled (they are by default)
2. Consider exporting dataset before migration
3. Have a rollback plan

## Common Migration Patterns

### Set a Field Value

```typescript
return at("fieldName", set("newValue"));
```

### Set Multiple Fields

```typescript
return [at("field1", set("value1")), at("field2", set(true))];
```

### Unset/Remove a Field

```typescript
import { unset } from "@sanity/migrate";
return at("fieldToRemove", unset());
```

### Conditional Logic

```typescript
document(doc) {
  if (doc.someCondition) {
    return at("field", set("value1"));
  }
  return at("field", set("value2"));
}
```

### Update Array Items

```typescript
return at("arrayField[_key == "someKey"]", set({ newData: true }));
```

## Migration Cheat Sheet

```typescript
import {
  defineMigration,
  set, // Set a value
  unset, // Remove a field
  at, // Target a path
  setIfMissing, // Set only if field doesn't exist
} from "@sanity/migrate";
```

## Troubleshooting

### Migration Fails with "No mutations"

This means no documents matched your migration criteria. Check:

- Is `documentTypes` filter correct?
- Do documents actually need changes?
- Is your conditional logic too restrictive?

### Rate Limit Errors

Sanity has rate limits on mutations. For large datasets:

- Migrations automatically handle rate limiting
- Be patient with large migrations
- Consider breaking into smaller migrations

### Rollback a Migration

Sanity doesn't have automatic rollback. If you need to undo:

1. Restore from Sanity backup (contact support)
2. Write a reverse migration
3. Manually fix via Sanity Studio

## Resources

- [Sanity Migration Docs](https://www.sanity.io/docs/content-lake/schema-and-content-migrations)
- [Migration CLI Reference](https://www.sanity.io/docs/cli-reference/cli-migration)
- [Migration API Reference](https://reference.sanity.io/sanity/migrate/defineMigration/)

## Environment Variables

Migrations use environment variables from the shell context:

- `SANITY_STUDIO_PROJECT_ID` - Project ID (from `.env.local`)
- `SANITY_STUDIO_DATASET` - Dataset name (`development` or `production`)

These are automatically set by the npm scripts (`migration:run:dev` / `migration:run:prod`).
