<!-- Source: https://www.sanity.io/docs/studio/form-components-reference (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Form components API reference

The Form Components API lets you override default form widgets with your own custom components.

The following components are available for customization:

**sanity.config.ts**

```typescript
import {defineConfig} from 'sanity'

export default defineConfig({
  // rest of config ...
  form: {
    components: {
      field: MyCustomField,
      input: MyCustomInput,
      item: MyCustomItem,
      preview: MyCustomPreview,
    },
  },
})
```

For a description of how these different components map to the different parts of a form field, visit the [Form components article](https://www.sanity.io/docs/studio/form-components).

Custom form components can be declared either at the configuration level (in `defineConfig` or `definePlugin`) or in a schema. Components added at the configuration level affect all forms in the Studio, while components added to a schema only affect the field or fields specified in that schema.

```javascript
// ./schemas/myDocument.jsx

import {defineType} from 'sanity'

function MyStringInput(props) {
  return (
    <div style={{border: '4px solid magenta'}}>
      {props.renderDefault(props)}
    </div>
  )
}

export const myDocument = defineType({
  name: 'myDocument',
  type: 'document',
  title: 'My document',
  fields: [
    {
      name: 'myTitle',
      type: 'string',
      title: 'My title',
      components: {input: MyStringInput},
    },
  ],
})
```

## Shared properties

#### Properties

**changed** (boolean)

Whether the field value differs from the published version.

**level** (number)

The nesting depth of this field in the document structure.

**path** (Path)

The document path to this field.

**presence** (FormNodePresence[])

Presence indicators showing which users are viewing or editing this field.

**renderDefault** (function)

Renders the default component. Call with the component props to defer to the built-in rendering.

**schemaType** (SchemaType)

The schema definition for this field.

**validation** (FormNodeValidation[])

Validation markers for this field.

**value** (unknown)

The current value of the field. The type depends on the field's schema type.

All form components receive the `renderDefault` method, which defers to the default Studio rendering of the component when called with the component's props.

In addition, each form component receives a set of props that varies in shape depending on the type of field it is assigned to.

## Input components

Input components receive props that vary by field type. [InputProps](https://reference.sanity.io/sanity/index/InputProps/) is a union of type-specific interfaces such as `StringInputProps`, `ObjectInputProps`, and `ArrayOfObjectsInputProps`. In addition to the shared properties (above), all input components have the following:

### Properties

#### Properties

**elementProps** (object)

HTML element attributes to spread onto the input element, including event handlers for focus management.

**focused** (boolean)

Whether the input currently has focus.

**id** (string)

A unique identifier for the input element. Use this as the HTML id attribute.

**onChange** (function)

Callback to update the field value. Accepts a PatchEvent, a FormPatch, or an array of patches.

**readOnly** (boolean)

Whether the field is read-only.

**validationError** (string)

Newline-delimited aggregation of validation error messages. Only present on string, number, and boolean inputs.

## Array item components

In addition to the shared properties (above), array item components ([ItemProps](https://reference.sanity.io/sanity/index/ItemProps/)) have the following:

### Properties

#### Properties

**children** (ReactNode)

The rendered content of the item.

**collapsed** (boolean)

Whether the item is collapsed. Only present on object items.

**collapsible** (boolean)

Whether the item can be collapsed. Only present on object items.

**description** (string)

The item description from the schema, if defined.

**focused** (boolean)

Whether the item currently has focus.

**index** (number)

The position of this item in the array.

**inputId** (string)

The HTML id of the item's input element.

**inputProps** (ObjectInputProps)

The full set of input props for the item's input component. Only present on object items.

**onBlur** (function)

Callback to call when the item loses focus.

**onClose** (function)

Callback to call when the item is closed. Only present on object items.

**onCollapse** (function)

Callback to call when the item is collapsed. Only present on object items.

**onCopy** (function)

Callback to call when the item is copied.

**onExpand** (function)

Callback to call when the item is expanded. Only present on object items.

**onFocus** (function)

Callback to call when the item receives focus.

**onInsert** (function)

Callback to insert new items relative to this item.

**onOpen** (function)

Callback to call when the item is opened. Only present on object items.

**onRemove** (function)

Callback to remove the item from the array.

**open** (boolean)

Whether the item is open. Only present on object items.

**parentSchemaType** (ArraySchemaType)

The schema type of the array containing the item.

**readOnly** (boolean)

Whether the item is read-only.

**title** (string)

The item title from the schema, if defined.

## Field components

In addition to the shared properties (above), field components ([FieldProps](https://reference.sanity.io/sanity/index/FieldProps/)) have the following:

### Properties

#### Properties

**children** (ReactNode)

The rendered input component for this field.

**description** (string)

The field description from the schema, if defined.

**index** (number)

The position of this field among its siblings.

**inputId** (string)

The HTML id of the associated input element. Use for label association.

**inputProps** (InputProps)

The full set of input props for the field's input component.

**name** (string)

The field name as defined in the schema.

**title** (string)

The field title from the schema, if defined.

## List preview components

List preview components ([PreviewProps](https://reference.sanity.io/sanity/index/PreviewProps/)) receive `renderDefault` and an optional `schemaType`, plus the following:

### Properties

#### Properties

**actions** (ReactNode)

Action buttons rendered alongside the preview.

**error** (Error | null)

The error encountered while loading the preview value, if any.

**isPlaceholder** (boolean)

Whether the preview is showing placeholder content while loading.

**layout** (string)

The preview layout variant. Common values include default, media, and detail.

**media** (ReactNode)

The media element (image, icon, or custom component) for the preview.

**schemaType** (SchemaType)

The schema type of the previewed value.

**title** (ReactNode)

The title content to display in the preview.

