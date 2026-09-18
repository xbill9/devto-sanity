import {defineArrayMember, defineField, defineType, type SchemaTypeDefinition} from 'sanity'
import {PictureButtons, type PictureOption} from '../components/PictureButtons'
import {CROPS, GROWTH, IRRIGATION} from './options'

// The schema is built twice from one definition: `kiosk` swaps in picture-button inputs,
// `stock` leaves Sanity's defaults. Same data, same validation — only the interface differs,
// which is what the stopwatch trials (docs/DESIGN.md §6) compare.
export function buildSchema({kiosk}: {kiosk: boolean}): SchemaTypeDefinition[] {
  const pictures = (list: PictureOption[]) => ({
    options: {list, layout: 'radio' as const},
    ...(kiosk ? {components: {input: PictureButtons}} : {}),
  })

  const field = defineType({
    name: 'field',
    title: 'Field',
    type: 'document',
    fields: [
      defineField({name: 'number', title: 'Field number', type: 'number', validation: (r) => r.required().integer().min(1)}),
      defineField({name: 'name', title: 'Name', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'crop', title: 'Crop', type: 'string', ...pictures(CROPS), validation: (r) => r.required()}),
      defineField({name: 'irrigation', title: 'Irrigation', type: 'string', ...pictures(IRRIGATION), validation: (r) => r.required()}),
      // Growth is the workflow's output, never an editor's choice.
      defineField({name: 'growth', title: 'Growth', type: 'string', readOnly: true, ...pictures(GROWTH)}),
      defineField({name: 'lastWatered', title: 'Last watered', type: 'datetime', readOnly: true}),
    ],
    orderings: [{title: 'Field number', name: 'number', by: [{field: 'number', direction: 'asc'}]}],
    preview: {
      select: {number: 'number', name: 'name', irrigation: 'irrigation', growth: 'growth'},
      prepare: ({number, name, irrigation, growth}) => ({
        title: `Field ${number}: ${name}`,
        subtitle: [irrigation, growth].filter(Boolean).join(' · '),
      }),
    },
  })

  const citizen = defineType({
    name: 'citizen',
    title: 'Citizen',
    type: 'document',
    fields: [
      defineField({
        name: 'handle',
        title: 'Handle',
        description: 'A pseudonym. This dataset is public — never a real name.',
        type: 'string',
        validation: (r) => r.required(),
      }),
      defineField({name: 'avatar', title: 'Avatar', type: 'image'}),
    ],
    preview: {select: {title: 'handle', media: 'avatar'}},
  })

  const proposal = defineType({
    name: 'proposal',
    title: 'Proposal',
    type: 'document',
    // Deliberately no status field: a proposal's stage lives only in its workflow instance.
    fields: [
      defineField({name: 'title', title: 'Title', type: 'string', validation: (r) => r.required()}),
      defineField({name: 'body', title: 'Body', type: 'array', of: [defineArrayMember({type: 'block'})]}),
      defineField({
        name: 'fields',
        title: 'Fields to water',
        type: 'array',
        of: [defineArrayMember({type: 'reference', to: [{type: 'field'}]})],
        validation: (r) => r.required().min(1).unique(),
      }),
      defineField({
        name: 'author',
        title: 'Author',
        type: 'string',
        options: {list: ['agent', 'person'], layout: 'radio'},
        validation: (r) => r.required(),
      }),
    ],
  })

  const vote = defineType({
    name: 'vote',
    title: 'Vote',
    type: 'document',
    // One document per vote, never a counter: tallies are GROQ count()s.
    fields: [
      defineField({name: 'citizen', title: 'Citizen', type: 'reference', to: [{type: 'citizen'}], validation: (r) => r.required()}),
      defineField({name: 'field', title: 'Field', type: 'reference', to: [{type: 'field'}], validation: (r) => r.required()}),
      defineField({name: 'choice', title: 'Choice', type: 'string', ...pictures(IRRIGATION), validation: (r) => r.required()}),
      defineField({name: 'castAt', title: 'Cast at', type: 'datetime', validation: (r) => r.required()}),
    ],
  })

  return [field, citizen, proposal, vote]
}
