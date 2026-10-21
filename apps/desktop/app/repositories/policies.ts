import type {
	AccountRef,
	CreateWorkspacePolicy,
	CursorPagination,
	UpdateWorkspacePolicy,
	WorkspacePoliciesQuery,
	WorkspacePolicy,
	WorkspacePolicySummary,
	WorkspacePolicySummaryPage,
} from "@nvisy/sdk/datatypes";
import type { Repository } from "#console/repositories/types";
import {
	parseBody,
	type StoreRecord,
	storeDelete,
	storeGet,
	storeList,
	storeUpsert,
} from "./store";

/*
 * The policies resource of the local store, implementing the SDK's `Policies`
 * surface against the `store_*` commands. A policy is persisted as its full
 * `WorkspacePolicy` JSON; the list derives summaries from it. Policies created
 * here carry a local author marker, since there is no account offline.
 */

/** The author stamped on locally-created entities: no real account exists. */
const LOCAL_AUTHOR: AccountRef = { id: "local", username: "local" };

/** The summary view the list surfaces, derived from a stored full policy. */
function toSummary(policy: WorkspacePolicy): WorkspacePolicySummary {
	return {
		id: policy.id,
		displayName: policy.displayName,
		description: policy.description,
		kind: policy.kind,
		createdAt: policy.createdAt,
		updatedAt: policy.updatedAt,
		createdBy: policy.createdBy,
		workspaceId: policy.workspaceId,
		workspaceHandle: policy.workspaceHandle,
	};
}

/** Wrap a policy as the store record to persist. */
function toRecord(policy: WorkspacePolicy): StoreRecord {
	return {
		id: policy.id,
		workspaceId: policy.workspaceId,
		name: policy.displayName,
		kind: policy.kind,
		updatedAt: policy.updatedAt,
		body: JSON.stringify(policy),
	};
}

/** The local store's policies resource. */
export function createPoliciesRepository(): Repository["policies"] {
	async function getPolicy(
		_workspaceId: string,
		policyId: string,
	): Promise<WorkspacePolicy> {
		const record = await storeGet("policies", policyId);
		if (!record) throw new Error(`policy ${policyId} not found`);
		return parseBody<WorkspacePolicy>(record);
	}

	async function upsert(policy: WorkspacePolicy): Promise<WorkspacePolicy> {
		await storeUpsert("policies", toRecord(policy));
		return policy;
	}

	return {
		listPolicies: async (
			workspaceId: string,
			query?: CursorPagination & WorkspacePoliciesQuery,
		): Promise<WorkspacePolicySummaryPage> => {
			const page = await storeList("policies", {
				workspaceId,
				after: query?.after,
				limit: query?.limit,
			});
			return {
				items: page.items.map((r) => toSummary(parseBody<WorkspacePolicy>(r))),
				nextCursor: page.nextCursor,
			};
		},

		getPolicy,

		createPolicy: async (
			workspaceId: string,
			draft: CreateWorkspacePolicy,
		): Promise<WorkspacePolicy> => {
			// Only an inline body is resolvable on-device: a template or a label
			// set needs the server to expand it into a definition.
			if (draft.source !== "inline") {
				throw new Error(
					`cannot create a "${draft.source}" policy offline; only inline policies are supported locally`,
				);
			}
			const now = new Date().toISOString();
			const id = crypto.randomUUID();
			const policy: WorkspacePolicy = {
				id,
				workspaceId,
				workspaceHandle: workspaceId,
				displayName: draft.displayName ?? draft.definition.name,
				description: draft.description,
				// The engine's `Policy` carries an id the draft doesn't; mint it to
				// match the policy's own id, as the server would.
				definition: { ...draft.definition, id },
				kind: "authored",
				createdBy: LOCAL_AUTHOR,
				createdAt: now,
				updatedAt: now,
				versionNumber: 1,
			};
			return upsert(policy);
		},

		updatePolicy: async (
			workspaceId: string,
			policyId: string,
			updates: UpdateWorkspacePolicy,
		): Promise<WorkspacePolicy> => {
			const current = await getPolicy(workspaceId, policyId);
			const next: WorkspacePolicy = {
				...current,
				displayName: updates.displayName ?? current.displayName,
				description: updates.description ?? current.description,
				// A new definition (a draft) carries no id; keep the policy's own.
				definition: updates.definition
					? { ...updates.definition, id: current.definition.id }
					: current.definition,
				updatedAt: new Date().toISOString(),
				versionNumber: current.versionNumber + 1,
			};
			return upsert(next);
		},

		deletePolicy: async (
			_workspaceId: string,
			policyId: string,
		): Promise<void> => {
			await storeDelete("policies", policyId);
		},
	};
}
