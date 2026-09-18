<!-- Source: https://www.sanity.io/docs/workflows/actors-and-enforcement (fetched 2026-09-18) -->

> For AI agents: the complete Sanity documentation index is available at [https://www.sanity.io/docs/llms.txt](https://www.sanity.io/docs/llms.txt).

# Actors, tokens, and what's actually enforced

Who the engine acts as, where a condition can read the caller, and which of the engine’s checks would stop a client that bypasses it.

Workflows attributes every move to an actor, records how the call was made, and checks a series of rules before it commits. This page names which identity does what, where a condition can read the caller, and which of those checks would stop someone who bypasses the engine entirely.

The short answer to the last question: none of them. The Content Lake is the only enforcement point. The rest of this page is what that means in practice.

## One token does everything

Every call into the engine carries one token, and that token does three jobs at once. It identifies the actor the move is attributed to, it performs the engine’s own writes, and it drives any transitions that fire as a consequence. The engine has no identity of its own and no way to act as anything other than the caller.

The engine resolves the actor from the token. There is no parameter that passes one and no way to synthesize one. An actor carries a `kind` of `person`, `agent`, or `system`, an `id` that is the account-global user id, and an optional list of role names copied from the token’s roles as its host reports them.

Role names are plain strings, matched exactly. An action’s `roles` and an assignee’s roles match if any one of them is in the actor’s list. There is no wildcard on the actor side: a `"*"` in an actor’s roles is only a string, and it matches nothing on its own. To let one role satisfy a gate that does not name it, declare the definition’s `roleAliases` map, which widens the required side rather than the actor’s.

Work the engine fires for itself runs on the same token. A cascade-fired action, one carrying a `when` that the engine fires the moment its condition holds, executes on whichever legitimate call drove the cascade. There is no synthetic engine actor behind it. An action can pin who may execute it with `roles`. If the current token does not satisfy that pin, the trigger stays armed and fires on the next cascade that does. History records the executing token together with a triggered marker, so an automated firing is never read as a caller invoking the action. See [Activities and actions](https://www.sanity.io/docs/workflows/activities-and-actions) for how an action resolves an activity.

An actor stamp records where a move came from. It is not a verified identity, and nothing re-checks it when the record is read. The Content Lake’s own document history is the authenticated record, and [the workflow history](https://www.sanity.io/docs/workflows/history-and-audit-trail) sits beside it rather than replacing it.

## Execution context records how, not who

Alongside the actor, the engine stamps an execution context on every history entry it appends. The actor answers who acted; the execution context answers what they acted through. It holds an inferred `runtime` that is always present, plus an optional `kind` and `id` the host declares once when it calls `createEngine`.

You configure the declared half once per engine, never per call, and it is never an authorization input. Nothing in the engine gates on it. It exists so someone reading the audit trail can tell a Studio session from a CLI run from an effect drainer. The shipped `kind` vocabulary is `interactive`, `server`, `cli`, `mcp`, `drainer`, `script`, `test`, `studio`, and `sdk-app`, and the field is a free string rather than a closed set.

The stamp is self-declared, which is exactly why it stays separate from the actor. A server proxy acting with a user’s token shows up as that user, acting through that proxy, instead of forging an identity.

## Where a condition can read the caller

A condition can read the caller through five variables: `$actor` for the identity, `$assigned` for whether they are an assignee, `$can` for their advisory grants, `$attributes` for their org-level user attributes on Enterprise plans, and `$params` for the arguments of the action being fired. None of these is available everywhere, and a condition that reads one where it holds no value fails closed.

The caller-bound projection binds `$actor`, `$assigned`, `$can`, and `$attributes`. That projection is three sites: the `filter`. That projection covers three sites: the `$params` is not bound here; it holds a value only while an action’s effect bindings and a where-op’s `where` evaluate.

Cascade gates bind none of the five. A transition’s `when`, an activity’s `filter`, and a cascade-fired action’s `when` and `filter` are re-evaluated by whatever legitimate call comes along, so they have to give the same answer no matter whose token that is. Deploy rejects a caller read at those sites rather than letting it quietly never match. Gate on instance state instead, such as a field an action wrote, or pin the executing identity with `roles`. See [Conditions](https://www.sanity.io/docs/workflows/conditions) for the full variable scope at each site.

The Content Lake’s `identity()` function is not one of these. It exists only inside a guard’s predicate, which the lake evaluates. It is not available in a workflow condition, which the engine evaluates.

## Three mechanisms, and they are not three levels

Workflows gives you three ways to restrict what happens to content. They work together, but they are not three levels of the same thing: only one of them is enforced by anything other than cooperation.

| Mechanism | Evaluated by | Stops a determined client |
| --- | --- | --- |
| Engine verdicts: action filters, roles, requirements, editability | The engine, in your process | No |
| Guards | The engine, in your process | No, not today |
| Dataset access control and custom roles | The Content Lake | Yes |

Engine verdicts are advisory by design. They tell a surface which controls to disable and why, and they fail a call that cannot succeed before it writes anything. Anyone whose token allows a raw Content Lake mutation can skip the engine and every verdict in it. For cooperative teams and internal tools that is useful guidance with honest limits. It is not a security boundary.

Guards sit on the advisory side of that line today. This is the part people most often get wrong. A deployed guard is stored as a `temp.system.guard` document, and the Content Lake does not evaluate that document type. It is a placeholder for the guard primitive the lake will get later. Until that ships, a deployed guard denies engine-side only, on every project plan, and dataset access control is the only hard gate. See [Guards and enforcement](https://www.sanity.io/docs/workflows/guards) for what a guard declaration contains.

Dataset access control is evaluated server-side by the Content Lake on every write, whichever client makes it. It is the only one of the three that holds against a token the engine never sees.

## Make a rule that actually holds

When a rule has to hold regardless of which client writes, put it in the Content Lake as dataset access control or a custom role. Decide this per rule rather than per workflow: a definition can rely on advisory guidance for the parts that coordinate cooperative editors, and on access control for the parts that must not be bypassed.

Do not treat a guard as that boundary yet. A guard becomes lake-enforced when the lake’s guard primitive ships and the `temp.` prefix drops from the stored document type. Until then, deploying one gives you a workflow-aware surface that previews and explains a hold. That is worth having, but it is not the same guarantee.

One consequence to plan around, while both sides ride the caller’s token: the engine deploys, refreshes, and retracts its own guards with whatever token made the call. So a lake-enforced restriction that an editor’s token cannot satisfy can block the engine’s own housekeeping for that editor, and leave them stuck in a state they can neither advance nor retract. Doing this reliably would need a separate execution identity for the engine’s own writes, and that does not exist today. [How early access works](https://www.sanity.io/docs/workflows/prerelease) tracks what is and is not enforced yet.

