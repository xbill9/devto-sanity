import {
  defineAction,
  defineActivity,
  defineField,
  defineStage,
  defineTransition,
  defineWorkflow,
} from '@sanity/workflow-engine/define'

// Joe's Plan: the Secretary of the Interior (an agent) petitions to water the crops,
// the Cabinet (a person) decides, and the fields are watered and eventually harvested.
//
//   petition ──submit──▶ cabinet ──approve──▶ watering ──▶ growing ──(harvestAt)──▶ harvest
//                           └──reject──▶ dust-bowl
//
// Role names are matched literally against the actor's project roles. `cabinet` and `secretary`
// are custom roles; on a plan without custom roles, deploy with BRAWNDO_ROLE_CABINET=administrator
// and BRAWNDO_ROLE_SECRETARY=editor (docs/DESIGN.md §8).
export const CABINET_ROLE = process.env.BRAWNDO_ROLE_CABINET ?? 'cabinet'
export const SECRETARY_ROLE = process.env.BRAWNDO_ROLE_SECRETARY ?? 'secretary'

// Role gates here are ADVISORY (docs/sanity/workflows/actors-and-enforcement.md). The Cabinet's
// power is real only because the agent's token cannot write `field` documents in the Content Lake.
export const joesPlan = defineWorkflow({
  name: 'joes-plan',
  title: "Joe's Plan",
  description: 'Water the crops. With water. Like from the toilet.',
  initialStage: 'petition',
  start: {
    requirements: [{type: 'singleSubject', name: 'one-plan-per-proposal', title: 'This proposal already has a plan'}],
  },
  fields: [
    defineField({
      type: 'subject',
      name: 'subject',
      title: 'Proposal',
      required: true,
      description: 'The proposal document this plan is about.',
      initialValue: {type: 'input'},
    }),
    // Written by the watering effect: when the sprouts become crops (ISO timestamp).
    defineField({type: 'string', name: 'harvestAt', title: 'Harvest at'}),
  ],
  stages: [
    defineStage({
      name: 'petition',
      title: 'Petition',
      description: 'The Secretary of the Interior drafts the proposal.',
      activities: [
        defineActivity({
          name: 'draft',
          title: 'Draft the proposal',
          actions: [defineAction({name: 'submit', title: 'Submit to the Cabinet', roles: [SECRETARY_ROLE], status: 'done'})],
        }),
      ],
      transitions: [defineTransition({name: 'to-cabinet', title: 'Send to the Cabinet', to: 'cabinet'})],
    }),
    defineStage({
      name: 'cabinet',
      title: 'Cabinet',
      description: 'The Cabinet approves or rejects. (Advisory.)',
      fields: [defineField({type: 'string', name: 'decision'})],
      activities: [
        defineActivity({
          name: 'decide',
          title: 'Decide',
          actions: [
            defineAction({
              name: 'approve',
              title: 'Approve (water)',
              roles: [CABINET_ROLE],
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'approve'}}],
            }),
            defineAction({
              name: 'reject',
              title: 'Reject (Brawndo)',
              roles: [CABINET_ROLE],
              status: 'done',
              ops: [{type: 'field.set', target: {field: 'decision'}, value: {type: 'literal', value: 'reject'}}],
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-watering', to: 'watering', when: "$allActivitiesDone && $fields.decision == 'approve'"}),
        defineTransition({name: 'to-dust-bowl', to: 'dust-bowl', when: "$allActivitiesDone && $fields.decision == 'reject'"}),
      ],
    }),
    defineStage({
      name: 'watering',
      title: 'Watering',
      description: 'The drainer switches the fields to water and sprouts them.',
      activities: [
        defineActivity({
          name: 'water',
          title: 'Water the fields',
          actions: [
            defineAction({
              name: 'queue-watering',
              title: 'Queue watering',
              when: 'true',
              effects: [
                {
                  name: 'water-fields',
                  bindings: {subject: '$fields.subject._id'},
                  outputs: [{type: 'string', name: 'harvestAt'}],
                },
              ],
            }),
            defineAction({name: 'watered', title: 'Watered', when: "$effectStatus['water-fields'] == 'done'", status: 'done'}),
            defineAction({
              name: 'watering-failed',
              title: 'Watering failed',
              when: "$effectStatus['water-fields'] == 'failed'",
              status: 'failed',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-growing', to: 'growing', when: '$allActivitiesDone && !$anyActivityFailed'}),
        defineTransition({name: 'watering-to-dust-bowl', to: 'dust-bowl', when: '$anyActivityFailed'}),
      ],
    }),
    defineStage({
      name: 'growing',
      title: 'Growing',
      description: 'Sprouts. Something has to call tick() once harvestAt passes.',
      activities: [
        defineActivity({
          name: 'ripen',
          title: 'Ripen',
          actions: [
            defineAction({
              name: 'queue-harvest',
              title: 'Queue harvest',
              when: '$fields.harvestAt <= $now',
              effects: [{name: 'harvest-fields', bindings: {subject: '$fields.subject._id'}}],
            }),
            defineAction({
              name: 'harvested',
              title: 'Harvested',
              when: "$effectStatus['harvest-fields'] == 'done'",
              status: 'done',
            }),
            defineAction({
              name: 'harvest-failed',
              title: 'Harvest failed',
              when: "$effectStatus['harvest-fields'] == 'failed'",
              status: 'failed',
            }),
          ],
        }),
      ],
      transitions: [
        defineTransition({name: 'to-harvest', to: 'harvest', when: '$allActivitiesDone && !$anyActivityFailed'}),
        defineTransition({name: 'growing-to-dust-bowl', to: 'dust-bowl', when: '$anyActivityFailed'}),
      ],
    }),
    defineStage({name: 'harvest', title: 'Harvest', description: 'The crops grew. Joe was right.'}),
    defineStage({name: 'dust-bowl', title: 'Dust bowl', description: "It's got electrolytes."}),
  ],
})
