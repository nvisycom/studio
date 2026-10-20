import type {
	AccountRef,
	CreateWorkspacePipeline,
	CursorPagination,
	UpdateWorkspacePipeline,
	WorkspacePipeline,
	WorkspacePipelineSummary,
	WorkspacePipelineSummaryPage,
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
 * The pipelines resource of the local store. A local pipeline is the detection-
 * time policy set — a named `{ policyIds, defaultScope }` — with none of the
 * server's trigger/schedule/connection machinery (there is no automated
 * ingestion offline). It is persisted as its full `WorkspacePipeline` JSON so
 * the studio's pipeline picker works unchanged offline.
 */

/** The author stamped on locally-created entities: no real account exists. */
const LOCAL_AUTHOR: AccountRef = { id: "local", username: "local" };

/** The summary view the list surfaces, derived from a stored full pipeline. */
function toSummary(pipeline: WorkspacePipeline): WorkspacePipelineSummary {
	return {
		id: pipeline.id,
		displayName: pipeline.displayName,
		description: pipeline.description,
		status: pipeline.status,
		createdAt: pipeline.createdAt,
		updatedAt: pipeline.updatedAt,
		createdBy: pipeline.createdBy,
		workspaceId: pipeline.workspaceId,
		workspaceHandle: pipeline.workspaceHandle,
	};
}

/** Wrap a pipeline as the store record to persist. */
function toRecord(
	pipeline: WorkspacePipeline,
	workspaceId: string,
): StoreRecord {
	return {
		id: pipeline.id,
		workspaceId,
		name: pipeline.displayName,
		kind: null,
		updatedAt: pipeline.updatedAt,
		body: JSON.stringify(pipeline),
	};
}

/** The local store's pipelines resource. */
export function createPipelinesRepository(): Repository["pipelines"] {
	async function getPipeline(
		_workspaceId: string,
		pipelineId: string,
	): Promise<WorkspacePipeline> {
		const record = await storeGet("pipelines", pipelineId);
		if (!record) throw new Error(`pipeline ${pipelineId} not found`);
		return parseBody<WorkspacePipeline>(record);
	}

	async function upsert(
		workspaceId: string,
		pipeline: WorkspacePipeline,
	): Promise<WorkspacePipeline> {
		await storeUpsert("pipelines", toRecord(pipeline, workspaceId));
		return pipeline;
	}

	return {
		listPipelines: async (
			workspaceId: string,
			query?: CursorPagination,
		): Promise<WorkspacePipelineSummaryPage> => {
			const page = await storeList("pipelines", {
				workspaceId,
				after: query?.after,
				limit: query?.limit,
			});
			return {
				items: page.items.map((r) =>
					toSummary(parseBody<WorkspacePipeline>(r)),
				),
				nextCursor: page.nextCursor,
			};
		},

		getPipeline,

		createPipeline: async (
			workspaceId: string,
			draft: CreateWorkspacePipeline,
		): Promise<WorkspacePipeline> => {
			const now = new Date().toISOString();
			const pipeline: WorkspacePipeline = {
				id: crypto.randomUUID(),
				workspaceId,
				workspaceHandle: workspaceId,
				displayName: draft.displayName,
				description: draft.description,
				// A local pipeline is just its policy set; the draft's definition
				// carries the policyIds (and optional defaultScope).
				definition: draft.definition ?? {},
				status: draft.status ?? "enabled",
				createdBy: LOCAL_AUTHOR,
				createdAt: now,
				updatedAt: now,
			};
			return upsert(workspaceId, pipeline);
		},

		updatePipeline: async (
			workspaceId: string,
			pipelineId: string,
			updates: UpdateWorkspacePipeline,
		): Promise<WorkspacePipeline> => {
			const current = await getPipeline(workspaceId, pipelineId);
			const next: WorkspacePipeline = {
				...current,
				displayName: updates.displayName ?? current.displayName,
				description: updates.description ?? current.description,
				definition: updates.definition ?? current.definition,
				status: updates.status ?? current.status,
				updatedAt: new Date().toISOString(),
			};
			return upsert(workspaceId, next);
		},

		deletePipeline: async (
			_workspaceId: string,
			pipelineId: string,
		): Promise<void> => {
			await storeDelete("pipelines", pipelineId);
		},
	};
}
