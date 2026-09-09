/** A file chosen in a provider's picker, in the shape `importFiles` expects. */
export interface PickedFile {
	/** The provider's file identifier (the server fetches the bytes by it). */
	id: string;
	/** The file's display name, as the picker reported it. */
	name: string;
}

/**
 * A user-facing import failure, carrying an i18n key the caller resolves through
 * `t()`. Pickers and the import flow throw this instead of a raw `Error` so no
 * hardcoded English reaches the toast.
 */
export class ImportError extends Error {
	constructor(readonly messageKey: string) {
		super(messageKey);
		this.name = "ImportError";
	}
}
