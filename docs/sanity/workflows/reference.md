<!-- Source: https://www.sanity.io/docs/workflows/reference (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Reference

Find the authoritative API and type reference for each Workflows domain. Exact contracts live at the bottom of the corresponding concept page.

Use the package references for exported types, functions, options, and defaults. The guides linked on this page explain how those APIs work together.

## Package API references

| Package | Use it to |
| --- | --- |
| [@sanity/workflow-engine](https://reference.sanity.io/_sanity/workflow-engine/) | Define workflows, evaluate their state, and commit engine operations. |
| [@sanity/workflow-engine-test](https://reference.sanity.io/_sanity/workflow-engine-test/) | Exercise workflows with an in-memory test bench. |
| [@sanity/workflow-cli](https://reference.sanity.io/_sanity/workflow-cli/) | Deploy and operate workflows from the command line. |
| [@sanity/workflow-blueprint](https://reference.sanity.io/_sanity/workflow-blueprint/) | Plan and generate Functions, and configure their workflow engines. |
| [@sanity/workflow-react](https://reference.sanity.io/_sanity/workflow-react/) | Manage reactive workflow sessions and custom adapters. |
| [@sanity/workflow-sdk](https://reference.sanity.io/_sanity/workflow-sdk/) | Connect Workflows to the Sanity App SDK. |
| [@sanity/workflow-studio](https://reference.sanity.io/_sanity/workflow-studio/) | Connect custom Studio interfaces to Workflows. |
| [@sanity/workflow-studio-plugin](https://reference.sanity.io/_sanity/workflow-studio-plugin/) | Add workflow views and tools to Studio, or reuse their tables. |
| [@sanity/workflow-components](https://reference.sanity.io/_sanity/workflow-components/) | Render assignment, date, status, and progress controls. |
| [@sanity/workflow-diagram](https://reference.sanity.io/_sanity/workflow-diagram/) | Render a workflow's stages and transitions. |
| [@sanity/workflow-mcp](https://reference.sanity.io/_sanity/workflow-mcp/) | Expose workflow operations to agents over MCP. |
| [@sanity/groq-condition-describe](https://reference.sanity.io/_sanity/groq-condition-describe/) | Explain and evaluate GROQ conditions. |

The [CLI command reference](https://www.sanity.io/docs/workflows/cli-reference) covers commands and flags. [Connect an agent over MCP](https://www.sanity.io/docs/workflows/mcp) covers tool inputs and results.

## Core model

- [Engine](https://www.sanity.io/docs/workflows/engine): engine construction, verbs, transactions, evaluation, errors, actor resolution, and persisted-model governance. See the [advanced exports](https://www.sanity.io/docs/workflows/reference) for lower-level helpers.
- [Definitions, instances, and stages](https://www.sanity.io/docs/workflows/definitions-and-instances): definition and instance shapes.
- [History and audit trail](https://www.sanity.io/docs/workflows/history-and-audit-trail): retrieving instance history and the complete `HistoryEntry` event reference.
- [Stages and transitions](https://www.sanity.io/docs/workflows/definitions-and-instances): stage, visit, and transition contracts.
- [Fields](https://www.sanity.io/docs/workflows/fields): field declarations, stored field types, progress, initial values, validation, and editability.
- [Conditions](https://www.sanity.io/docs/workflows/conditions): condition syntax, variables, and evaluation contexts.
- [Activities and actions](https://www.sanity.io/docs/workflows/activities-and-actions): declarations, evaluation, and projected firing consequences.
- [Operations](https://www.sanity.io/docs/workflows/operations): state-changing operations and value expressions.
- [Effects and runtimes](https://www.sanity.io/docs/workflows/effects-and-runtimes): declarations, handlers, draining, mid-dispatch field reports, and completion.
- [Guards and enforcement](https://www.sanity.io/docs/workflows/guards): guard declarations and lifecycle.
- [Actors, tokens, and what's actually enforced](https://www.sanity.io/docs/workflows/actors-and-enforcement): which identity a call acts as, where a condition can read the caller, and which checks actually hold.
- [Subworkflows](https://www.sanity.io/docs/workflows/subworkflows): spawning, child lifecycle, and propagation.
- [Global document references](https://www.sanity.io/docs/workflows/global-document-references): resource-qualified references and deployment helpers. See [expandResourceAliases](https://www.sanity.io/docs/workflows/reference) and [refsOf](https://www.sanity.io/docs/workflows/reference).

[Deployments, tags, and resources](https://www.sanity.io/docs/workflows/deployments-and-resources): deployment identity, storage partitioning, resource aliases, and the `WorkflowDeploymentInput` contract.

## Advanced exports

These lower-level exports support custom integrations, deployment tooling, and persisted-model diagnostics.

### `WorkflowConfigInput`

`WorkflowConfigInput` is the authoring shape accepted by `defineWorkflowConfig`. Every deployment is a `WorkflowDeploymentInput`.

### `WorkflowDeploymentInput`

`WorkflowDeploymentInput` is the authored deployment shape. Its `expectedMinReaderModel` literal acknowledges the model verified across the runtimes sharing its resource. Reuse the authored deployment when configuration and Blueprint entry points share it. See [Deployments, tags, and resources](https://www.sanity.io/docs/workflows/deployments-and-resources) for its fields.

### `WorkflowConfig`

`WorkflowConfig` is the parsed shape returned by `defineWorkflowConfig`. It can hold an unverified acknowledgement until a deployment is selected.

### `WorkflowDeployment`

`WorkflowDeployment` is one parsed deployment. Do not pass it back to an authoring API that requires `WorkflowDeploymentInput`.

### `AcknowledgedWorkflowDeployment`

`AcknowledgedWorkflowDeployment` is exported by `@sanity/workflow-engine`. It is a parsed deployment whose reader-floor acknowledgement has been validated against the definitions a command will submit.

### OUTCOME_MARKS

OUTCOME_MARKS maps each ConditionOutcome to the glyph used by condition checklists: ✓ for satisfied, ✗ for unsatisfied, and ? for unevaluable. Use it when a custom integration renders structured condition results instead of checklistLines output.

### NEUTRAL_MARK

NEUTRAL_MARK is the bullet used for a condition checklist that has no live verdict. Use it for definition-only explanations where satisfied or unsatisfied marks would imply that the condition was evaluated against a running instance.

### Semantic exports

### `actorFulfillsRole`

`actorFulfillsRole({actorRoles, required, aliases})` tests whether an actor holds a required role directly or through the definition’s role aliases.

#### Properties

**SIGNAL_SEMANTICS** (readonly SignalSemantic[])

The three built-in signal labels.

**DECISION_SEMANTICS** (readonly DecisionSemantic[])

The two action-only decision labels.

**ACTION_SEMANTICS** (readonly (DecisionSemantic | SignalSemantic)[])

The enumerable built-in action labels; custom labels are validated separately.

**SignalSemantic** ('signal.positive' | 'signal.caution' | 'signal.critical')

A built-in advisory signal.

**DecisionSemantic** ('decision.accept' | 'decision.decline')

An action-only advisory decision.

**CustomSemantic** (`custom.${string}`)

A validated custom camel-case meaning.

**Semantic** (SignalSemantic | CustomSemantic)

Allowed on workflows, stages, and activities.

**ActionSemantic** (DecisionSemantic | Semantic)

Allowed on actions.

### `resolveActor`

`resolveActor(directory, actor)` resolves a person actor through a `ProjectUserDirectory`. It returns `resolved`, `missing`, or `inaccessible`; agent and system actors return `not-person` without a user lookup.

### `userLoginProvider`

`ClientProjectUser` is the project API user record used by actor resolution. `userLoginProvider(user)` returns `user.provider` when present, otherwise `user.loginProvider`. It returns `undefined` when no user or provider is available. Use this helper because the project user endpoints use different field names for the same display-only value.

### User attribute access

#### Properties

**resolveUserAttributes** (Promise<UserAttributes | undefined>)

Resolves the caller’s organization attributes for soft gates. Expected 401–404 responses return undefined.

**UserAttributes** (Record<string, unknown>)

The normalized flat attribute bag.

**WorkflowAccess.attributes** (UserAttributes | undefined)

Supplies attributes to engines and test integrations.

### `DATA_MODEL_CHANGES`

`DATA_MODEL_CHANGES` is the frozen manifest of governed persisted-model changes, including each change’s document types, compatibility class, introduced model, minimum reader model, applicability, and summary.

### `requiredModelFeatures`

`requiredModelFeatures(documentType, document)` returns the manifest entries whose feature detectors apply to one canonical stored definition or instance.

### `requiredReaderModel`

`requiredReaderModel(documentType, document)` returns the oldest engine data model that can safely interpret that stored definition or instance. It returns `0` when no governed feature raises the floor.

### `DATA_MODEL_MAX_READER`

`DATA_MODEL_MAX_READER` is the highest reader-floor acknowledgement supported by the installed engine. Workflows 0.33 supports model 10. Keep deployment acknowledgements as reviewed literals; do not import this constant as a substitute for checking your runtimes.

### `requiredDefinitionReaderModel`

`requiredDefinitionReaderModel(definitions)` returns the reader model required by a batch of definitions. The baseline is 4. Role-constrained plural assignments need 8; singular assignments and guards spanning multiple action groups need 9. Required content references and effect retries need 10. Use the highest requirement in the batch. See [Upgrade Workflows packages](https://www.sanity.io/docs/workflows/upgrade) for the rollout sequence.

### `assertReaderModelAcknowledgement`

`assertReaderModelAcknowledgement(value, {requiredMinReaderModel, context?})` asserts that a reviewed numeric literal meets the submitted definitions’ required floor without exceeding the writer’s supported maximum. It throws `ReaderModelAcknowledgementError` when the value is missing, malformed, below `requiredMinReaderModel`, or above `DATA_MODEL_MAX_READER`. The optional context labels the failing caller.

### `isRevisionConflict`

`isRevisionConflict(error)` identifies a likely lost optimistic lock for one known revision-guarded write. A bare 409 can also be a create-ID collision, so narrow the operation before using this predicate.

### Snapshot diagnostics

#### Properties

**diagnoseInstance** (Diagnosis)

Classifies an evaluated snapshot, including transition-level causes.

**documentStuckCause** (StuckCause | undefined)

Detects committed failed-effect, failed-activity, or hung-effect causes. Undefined is not an all-clear.

**findStageNode** (Stage | undefined)

Tolerantly finds a stage in a definition snapshot.

**findActivityNode** (Activity | undefined)

Tolerantly finds an activity in a stage snapshot.

### `expandResourceAliases`

`expandResourceAliases(definition, resourceAliases)` returns the workflow definition with logical `@alias:` references expanded to physical GDRs. It validates alias names and rejects missing or malformed standalone aliases.

### `refsOf`

`refsOf(definition)` returns the definition’s outgoing spawn dependencies as `LogicalRef[]`, where each row is `{name: string, version?: number | 'latest'}`.

### `deployedTagsGroq`

`deployedTagsGroq()` returns a cross-partition GROQ query that lists the distinct tags with deployed definitions, sorted in ascending order. Run it with a client scoped to the workflow resource. It reports observed deployments, so tags with no deployed definitions are absent.

### `definitionTagsGroq`

`definitionTagsGroq()` returns the same kind of tag query narrowed to one definition. Pass `{definition}` as the query parameters. A definition deployed under several tags produces several results; the query reports that ambiguity and does not choose a tag for you.

## Studio plugin

`@sanity/workflow-studio-plugin` provides the plugin factory, configuration types, structure helpers, and reusable workflow tables. See [Add Workflows to Sanity Studio](https://www.sanity.io/docs/workflows/studio-plugin) for setup and [custom table integration](https://www.sanity.io/docs/workflows/studio-plugin).

### `WorkflowPluginConfig`

`WorkflowPluginConfig` is the options object passed to `workflowStudioPlugin`. Every property is read-only.

#### Properties

**tag** (string, required)

The engine tag partition. Scopes every workflow read and write, and must match the tag the definitions were deployed under. The only required option.

**workflowDataset** (string, optional)

The dataset holding workflow definitions and instances. Defaults to the workspace's own dataset.

**mappings** (readonly WorkflowMapping[], optional)

Rows that override or extend the bindings discovered from definition subjects. Defaults to none, in which case the effective table comes entirely from discovery.

**effectHandlers** (Record<string, EffectHandler<SanityClient>>, optional)

Effect handlers to run in the browser while an editor has the Studio open on a workflow that commits an action. An effect with no handler registered here stays pending for another runtime to claim, which is what unattended or consequential work needs.

**resourceClients** ((parsed: ParsedGdr) => WorkflowClient | undefined, optional)

Resolves clients for documents in other datasets, projects, or resources. Defaults to per-dataset routing derived from the Studio client. A served resource is part of the declared surface for written references, so keep the resolver identity stable: define it at module scope or memoize it.

**previewHydration** ({pageSize?: number; interPageDelayMs?: number}, optional)

Throttles progressive loading of run previews. pageSize defaults to 500 and interPageDelayMs to 0. Intended for development harnesses simulating small pages and slow reads; production defaults need no override.

### `WorkflowMapping`

A mapping row binds one Studio document type to one deployed definition, replacing whatever discovery derived for that exact `docType` and `definition` pair, or adding the pair when discovery did not produce it. One document type may appear on several rows. Two rows for the same pair throw while `sanity.config.ts` is evaluated, so the Studio does not start.

#### Properties

**docType** (string, required)

The Studio schema type this row binds. System types in the sanity. namespace are excluded from discovery and need an explicit row.

**definition** (string, required)

The name the definition was deployed under.

**label** (string, required)

The label editors see in menus and dialogs. Required on an explicit row; discovery-derived rows fall back to the definition's title, then its name.

**autoStart** (boolean, optional)

Starts this workflow when an editor creates a fresh document of docType in Studio. Defaults to false. Existing documents and writes outside Studio are unaffected.

**initialStateBuilder** ((subjectGdr: GlobalDocumentReference) => InitialFieldValue[], optional)

Seeds workflow fields for a manual start. Replaces the default subject seed entirely, so an empty array seeds nothing. Does not run during auto-start.

**contextBuilder** ((subjectGdr: GlobalDocumentReference) => StartContext, optional)

Seeds $context for the run. Not applied when the workflow starts through autoStart.

**perspectiveField** ({name: string; required?: boolean}, optional)

Binds the run to the editor's selected Content Release through the named release.ref entry. required defaults to false, in which case the workflow starts with no perspective and uses its own defaults. When required is true, starting is blocked until an active release is selected.

### Structure helpers

#### Properties

**workflowDefaultDocumentNode** (() => DefaultDocumentNodeResolver)

Takes no arguments. Returns a resolver giving every document type the form view plus the Workflows view; the plugin decides at runtime which workflows apply. Pass it as structureTool({defaultDocumentNode: workflowDefaultDocumentNode()}).

**workflowsView** ((S: StructureBuilder) => ViewBuilder)

The Workflows view for a single document. Append it to a document type's own views([...]) to place the view selectively instead of on every type.

## Runtime and integrations

- [The reactive session](https://www.sanity.io/docs/workflows/reactive-session): reactive state and commands.
- [Configure and deploy workflow definitions](https://www.sanity.io/docs/workflows/deploy-definitions): installing the CLI, authenticating, the config file, and the deploy.
- [Workflow CLI command reference](https://www.sanity.io/docs/workflows/cli-reference): every command with its arguments, flags, JSON payloads, and exit codes.
- [Connect an agent over MCP](https://www.sanity.io/docs/workflows/mcp): agent tools and configuration.
- [Add Workflows to Sanity Studio](https://www.sanity.io/docs/workflows/studio-plugin): Studio setup and workflow UI.
- [Create a workflow-powered Document Action](https://www.sanity.io/docs/workflows/custom-studio-integrations): build a custom workflow control on the Studio adapter.
- [Build a workflow interface with the App SDK](https://www.sanity.io/docs/workflows/app-sdk): render live workflow state and commit actions in your own application.
- [Reusable UI components](https://www.sanity.io/docs/workflows/ui-components): assignment, date, progress, member, and workflow-diagram controls.

## Development

- [Test your workflows](https://www.sanity.io/docs/workflows/testing): the in-memory test bench and test patterns.
- [Limits](https://www.sanity.io/docs/workflows/limits): current product and runtime limits.

> [!NOTE]
> Visiting agent?
> Workflows includes an MCP server for inspecting, operating, authoring, validating, and deploying workflows. Ask your human to [set up the MCP server](https://www.sanity.io/docs/workflows/mcp).



