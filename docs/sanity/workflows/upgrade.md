<!-- Source: https://www.sanity.io/docs/workflows/upgrade (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Upgrade Workflows packages

Take a new Workflows release without breaking in-flight instances: the lockstep set, what the reader-model literal claims, and the readers-first order.

Workflows ships as one fixed set of packages that release together, so an upgrade is a fleet operation rather than a per-package one. Most upgrades need nothing beyond installing the new version. A few change what an older runtime can read, and those need every reader upgraded before the writer that produces the new shape.

This page is the sequence for both cases, and how to tell which one you are in before you deploy.

## Read the release notes first

Every release records whether it carries a required migration. [Workflows release notes](https://www.sanity.io/docs/workflows/release-notes) is the list, and a release that needs coordinated action says so under its own heading. A breaking change arrives in a minor version, because every package is `0.x` and stays there: `0.9.0` to `0.10.0` can break an interface. The version number alone will not tell you, so the notes are the check that matters.

Two questions to answer before you start. Does this release change an interface your code calls? Does it introduce a feature that raises the reader floor on stored documents? The first is a code change in your project. The second is a rollout, and the rest of this page is about that.

## Keep the whole stack on one version

The published Workflows packages release together, at one identical version. Upgrading one and leaving the others behind is not a supported setup, and the internal dependency ranges between them are exact.

The set that moves together:

- `@sanity/workflow-engine` and `@sanity/workflow-engine-test`
- `@sanity/workflow-cli`, `@sanity/workflow-mcp`, and `@sanity/workflow-blueprint`
- `@sanity/workflow-react`, `@sanity/workflow-sdk`, and `@sanity/workflow-studio`
- `@sanity/workflow-studio-plugin`, `@sanity/workflow-components`, and `@sanity/workflow-diagram`

Upgrade every one of these you depend on in the same change, and check the lockfile afterwards rather than trusting the manifest. A transitive copy at an older version is the failure this rule exists to prevent.

## Check SDK and custom-client compatibility

Studio and App SDK integrations require `@sanity/sdk` 3.1 or later in the 3.x line. The React entry of `@sanity/workflow-sdk` also requires a matching `@sanity/sdk-react` version.

Before reinstalling, configure SDK 3 to resolve `@sanity/mutate` 0.18.2. A lockfile can retain 0.18.1, which can leave document reads pending with Sanity client 8. Follow the override and dependency checks in [App SDK installation](https://www.sanity.io/docs/workflows/app-sdk).

If you implement a Workflows client interface, read request targets from `url`, replacing `uri`. This applies to `WorkflowClient`, `TelemetryIntakeClient`, `ProjectUserProfileClient`, and `StudioUserClient`. Existing Sanity clients are handled by the adapters.

## Understand what the reader-model acknowledgement claims

Each definition and instance carries a reader floor: the oldest engine model that may read it. A reader below that floor refuses the document. The unconditional baseline is model 4; individual features can require more. Workflows 0.33 writes model 10 and accepts acknowledgements up to 10.

Each deployment states `expectedMinReaderModel`, and that number is a claim you are making: every runtime sharing this workflow resource can read documents at this floor. The deploy gate compares your claim against what the definitions you are submitting actually require, and rejects the deploy when the claim is lower. It cannot check whether the claim is true. Nothing inspects your fleet.

Write it as a numeric literal, in `sanity.workflow.ts` and in any direct `deployDefinitions` call. Do not import `DATA_MODEL_MIN_READER` or `DATA_MODEL_MAX_READER` and pass that instead. The value would advance on its own the next time a dependency upgrade lands, which removes exactly the review the number exists to force.

**sanity.workflow.ts**

```typescript
// A reviewed literal, raised deliberately after the fleet is upgraded.
expectedMinReaderModel: 4,
```

Upgrading the packages does not change this number, and neither does deploying definitions that use no floor-bearing feature. See [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions) for where the literal sits in a deployment.

## Upgrade every reader before the writer

When a release does introduce a floor-bearing feature, the order is mandatory rather than advisory. A writer that stamps a higher floor while an old reader is still running produces documents that reader refuses.

1. Upgrade every runtime that reads engine-owned documents, and leave the deployment literal alone.
2. Verify that rollout in every environment that shares the workflow resource.
3. Raise the affected deployment’s `expectedMinReaderModel` literal to the floor the feature requires.
4. Deploy the definitions that use the feature.

Take an inventory of readers before step one, because a forgotten runtime is what makes this go wrong. Every Studio with the plugin installed. Every CLI, including whichever version CI has pinned. Every MCP server. Every Sanity Function that touches an instance. Every server, worker, and effect drainer. Every App SDK application. Anything that shares the workflow resource is a reader, whether or not anyone thinks of it as part of the workflow system.

| Feature | Introduced in model | Required reader floor | Applies |
| --- | --- | --- | --- |
| Scalar fields may constrain writes to a persisted typed choice list. | 2 | 2 | Only to documents using it |
| String, text, and number values may carry persisted inclusive bounds. | 2 | 2 | Only to documents using it |
| Principal ids are namespace-classified: actor and assignee writes carry the account-global user id only, and readers resolve legacy project-scoped ids through the prefix classifier at the instance read funnel. | 4 | 4 | To every document |
| Start and activity readiness use named polymorphic requirement arrays. | 4 | 4 | Only to documents using it |
| Assignee fields may restrict newly assigned users and collective roles by role. | 8 | 8 | Only to documents using it |
| Singular assignment member lists | 9 | 9 | Definitions stamped model 9 that declare assignee, and their instances |
| Guards split across direct, edit, and lifecycle ID groups | 9 | 9 | Definitions and instances with a guard spanning multiple groups |
| Required content references remain readable after initialization | 10 | 10 | Definitions with required subject, doc.ref, or doc.refs fields, and their instances |
| Bounded effect retry policies | 10 | 10 | Definitions with effect retry policies, and their instances |

An unconditional feature raises the floor on every applicable document the writer touches. A detectable feature raises it only on documents that carry that feature. Check existing definitions too: an instance can already contain a feature whose compatibility requirements change with the new engine.

### Adopt required references and effect retries

Reader model 10 is required for definitions with a required `subject`, `doc.ref`, or `doc.refs` field, or an effect `retry` policy. After upgrading every shared runtime, set the deployment’s reviewed `expectedMinReaderModel` literal to `10` before deploying these definitions.

Required content references must remain readable while an instance is active. An upgraded engine applies this rule to existing instances as well as new ones. If required content is unavailable, normal actions and transitions stop; abort and permitted direct field edits remain available. See [Fields](https://www.sanity.io/docs/workflows/fields) for requiredness and repair.

Complete the reader rollout before relying on this behavior. An existing instance’s stored reader floor rises on its next full engine write. Until then, an older runtime can still advance it without checking whether its required content is readable.

Effect retries are optional. Definitions without a retry policy keep their first-failure behavior. A policy needs a runtime that can remain active through the attempts and waits. See [Effects and runtimes](https://www.sanity.io/docs/workflows/effects-and-runtimes) before configuring a policy for a Function or worker.

No stored-document backfill or reset is required. Updating a deployment acknowledgement does not change an existing instance’s pinned definition.

### Adopt model-9 assignments and guards

Workflows 0.32.0 implements reader model 9. It supports singular assignments that retain role members while one person holds the activity, and guards covering more than one mutation ID group. See [Fields](https://www.sanity.io/docs/workflows/fields) for assignments and [Guards and enforcement](https://www.sanity.io/docs/workflows/guards) for guard actions.

Upgrade every runtime sharing the workflow resource before enabling a model-9 writer to commit an existing instance with a mixed-action guard. Its first new-engine commit can raise the reader floor before emitting split guards, even without redeploying a definition.

After verifying the reader rollout, set the reviewed `expectedMinReaderModel` literal to `9` or the higher floor required by the definition. Deploy the changed definition and inspect its stored model. Submitting unchanged definition content returns `unchanged` and does not upgrade its stamp.

Existing instances stay pinned to their definition snapshot. A singular assignment in an instance pinned below model 9 remains object/null in storage for its lifetime, while engine reads return a list. Those instances permit only one total singular member and reject `append` and `remove-where`. New instances use lists when started under a definition stamped model 9 or later.

No stored-document backfill or reset is required. Reader floors never decrease. Once an instance requires model 9, rolling back a package or lowering the deployment literal does not make it readable by older engines. Upgrade any missed runtime that reports `ModelVersionAheadError`.

Replace `type: 'claim'` before redeploying source. For a reviewer identity, use this field and action in the same scopes as before. Stored claim expansions still run. For task assignment, use [Fields](https://www.sanity.io/docs/workflows/fields).

```typescript
import {defineAction, defineField} from '@sanity/workflow-engine/define'

const reviewer = defineField({type: 'actor', name: 'reviewer'})

const takeReview = defineAction({
  name: 'claim',
  title: 'Take review',
  filter: '!defined($fields.reviewer)',
  ops: [{type: 'field.set', target: {field: 'reviewer'}, value: {type: 'actor'}}],
})
```

Custom field integrations must read singular assignments as lists, use `[]` or unset to clear them, and stop using `field.setIfMissing` on model-9 singular fields. Assignment users must be people with account-global user IDs; robot IDs are rejected. This does not restrict robots from executing workflow operations.

## Watch the features that need a reader upgrade without raising the floor

Some model changes add capabilities without raising the reader floor. The floor check alone does not prove that an older runtime supports every field type, operation, or condition variable a definition uses.

The result depends on the feature. An older engine may ignore advisory metadata, reject an unfamiliar field type, or fail when it reaches an unsupported operation. Upgrade the readers before using a new capability even when its reader floor stays unchanged.

| Added in model | Feature |
| --- | --- |
| 2 | A workflow-level subject field identifies the document a workflow is about. |
| 2 | Ordinary actions may carry advisory workflow semantics. |
| 3 | A progress field kind carries application-defined 0–100 completion. |
| 3 | Pending-effect claims carry an exact-claim token gating mid-dispatch state reports. |
| 5 | Due-date field kinds (dueDate, dueDatetime) mark a level deadline, elevated aliases of date/datetime carrying the same stored value. |
| 6 | Workflow, stage, activity, and action nodes may carry signal or custom advisory semantics. |
| 6 | Field ops may increment, decrement, or initialize a missing field value. |

Inventory shared runtimes even when a release leaves the reader floor unchanged. Upgrade each runtime before deploying definitions that depend on a feature it does not support.

## Verify, and handle a refused document

After upgrading, exercise a real workflow rather than checking versions. Start an instance, move it through a stage, and confirm the surfaces that read it agree on what they see. The in-memory bench in [Test a workflow before you deploy it](https://www.sanity.io/docs/workflows/testing) drives a definition through its paths without touching a dataset, which makes it the cheapest place to catch a definition that the new engine parses differently.

A reader below a document’s floor fails loudly and names the model it needs. Treat that as a truthful report about the reader, not a problem with the document: something in the fleet was missed, and the fix is upgrading it rather than working around the error.

A deploy rejected for reader-model acknowledgement is the other common stop. The message states the floor you acknowledged, the floor the submitted definitions require, and the highest floor the installed writer supports. Raise the literal only once the fleet genuinely reads that model.

Early access adds one more option that a released product would not. During early access, an environment whose stored workflow data is not worth keeping can be reset instead of migrated: `sanity-workflows nuke` deletes a deployment tag’s instances, definitions, and guards, and never touches content documents. It prints a plan and asks for confirmation first. For a development or staging environment that has drifted, redeploying onto a clean tag is faster than reasoning about a mixed-model fleet. [Workflow CLI command reference](https://www.sanity.io/docs/workflows/cli-reference) has its flags and selectors, and [How early access works](https://www.sanity.io/docs/workflows/prerelease) covers what this period does and does not promise about stored data.

