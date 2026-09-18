<!-- Source: https://www.sanity.io/docs/next-js-quickstart/defining-a-schema (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Defining a schema

A new Sanity Studio project has no schema types registered, so there is nothing to edit yet. Define your first document type and register it.

This step continues from [Setting up your studio](https://www.sanity.io/docs/setting-up-your-studio), which creates a studio in a `studio-hello-world` folder. The file paths in this article assume that folder.

## Create a new document type

![Video](https://stream.mux.com/IfVfAwxfwOKN2khdGCQ3cs5IuF1rYte1)

Create a new file in your studio's `schemaTypes` folder called `postType.ts` with the following code, which defines a set of fields for a new `post` document type.

**studio-hello-world/schemaTypes/postType.ts**

```typescript
import {defineArrayMember, defineField, defineType} from 'sanity'

export const postType = defineType({
  name: 'post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      type: 'slug',
      options: {source: 'title'},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'image',
      type: 'image',
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [defineArrayMember({type: 'block'})],
    }),
  ],
})
```

## Register the post type in your studio's schema

Import the type into the `schemaTypes` array in the `index.ts` file in the same folder.

**studio-hello-world/schemaTypes/index.ts**

```typescript
import {postType} from './postType'

export const schemaTypes = [postType]
```

## Publish your first document

When you save these two files, your studio reloads automatically and shows your first document type.

To create and publish your first `post` document:

1. In the navbar, click **Create new document**, then select **Post**.
2. Enter a value for **Title**.
3. Click **Generate** beside the **Slug** field.
4. Click **Publish**.

The `title`, `slug`, and `publishedAt` fields are all required. `publishedAt` is filled in for you by its `initialValue`, so enter a title and generate a slug before you publish. Otherwise **Publish** stays disabled and its tooltip reads `There are validation errors that need to be fixed before this document can be published`.

