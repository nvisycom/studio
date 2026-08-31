/**
 * Save file content to the user's disk, natively where the host supports it.
 *
 * On the web this is a browser download (an anchor with `download`). On desktop
 * the {@link useFileBridge} `saveFile` provider is set, so the same call opens a
 * native save panel and writes the bytes to the chosen path. Consumers fetch the
 * content as a blob and hand it here, staying unaware of which host they run on.
 */
export function useFileDownload() {
	const { bridge } = useFileBridge();

	/**
	 * Save `blob` under `fileName`. Returns `true` once saved (always `true` on
	 * the web, where the browser owns the download), `false` if the user
	 * cancelled a native save panel.
	 */
	async function saveBlob(blob: Blob, fileName: string): Promise<boolean> {
		const save = bridge.value.saveFile;
		if (save) return save(blob, fileName);

		// Browser fallback: object URL + anchor download.
		triggerBrowserDownload(URL.createObjectURL(blob), fileName);
		return true;
	}

	return { saveBlob };
}
