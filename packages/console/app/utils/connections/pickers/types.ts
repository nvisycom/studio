/** A file chosen in a provider's picker, in the shape `importFiles` expects. */
export interface PickedFile {
	/** The provider's file identifier (the server fetches the bytes by it). */
	id: string;
	/** The file's display name, as the picker reported it. */
	name: string;
}
