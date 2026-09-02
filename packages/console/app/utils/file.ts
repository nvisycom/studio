import type { Nvisy } from "@nvisy/sdk";
import type { Component } from "vue";
import {
	FileText,
	FileImage,
	FileCode,
	FileSpreadsheet,
	FileAudio,
	File as FileIcon,
} from "@lucide/vue";

/**
 * Lowercased extension of a file name, without the dot (e.g. `"pdf"`), or an
 * empty string when there is none. The single place this repo derives an
 * extension — feed it a name or a `File.name`.
 */
export function getFileExtension(fileName: string): string {
	return fileName.split(".").pop()?.toLowerCase() ?? "";
}

/**
 * File extensions the upload flow accepts, kept in sync with the API's
 * supported inputs. The single source for both the `<input accept>` hint and
 * the client-side validation, so the OS picker and drag-drop enforce the same
 * rule.
 */
export const ACCEPTED_EXTENSIONS = [
	"csv",
	"docx",
	"htm",
	"html",
	"jpeg",
	"jpg",
	"json",
	"log",
	"mp3",
	"ogg",
	"pdf",
	"png",
	"rtf",
	"tif",
	"tiff",
	"txt",
	"wav",
	"xlsx",
	"xml",
] as const;

/** Ready-made `accept` attribute value (`.csv,.docx,…`) for a file input. */
export const ACCEPTED_ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map(
	(ext) => `.${ext}`,
).join(",");

/** Whether a file name's extension is one the upload flow accepts. */
export function isAcceptedFileName(fileName: string): boolean {
	return (ACCEPTED_EXTENSIONS as readonly string[]).includes(
		getFileExtension(fileName),
	);
}

// NOTE: how a file is *previewed* (image / text / DOCX / …) is no longer decided
// here. That classification now lives in the studio renderer registry
// (`components/pages/studio/preview/renderers.ts`), which maps an extension to its view
// component, detection source, and preview options in one place — so a new format
// is one registry entry, not a set of predicates + arrays to keep in sync. This
// file keeps only the *upload* allowlist (`ACCEPTED_EXTENSIONS`) and generic file
// helpers (extension, size, icon), which aren't preview-specific.

/**
 * Fetch a file's content and expose it as an object URL (e.g. for an <img>/
 * <iframe> preview or as a download source). The caller owns the URL's
 * lifecycle and must `URL.revokeObjectURL` it when done — on unmount, when the
 * value is replaced, or right after triggering a download.
 */
export async function fetchFileContentUrl(
	client: Nvisy,
	workspaceSlug: string,
	fileId: string,
): Promise<string> {
	const response = await client.files.downloadFile(workspaceSlug, fileId);
	const blob = await response.blob();
	return URL.createObjectURL(blob);
}

/**
 * Prompt the browser to save an object URL to disk under `fileName`, then
 * revoke it. For the one-shot download case where the URL isn't kept around.
 */
export function triggerBrowserDownload(url: string, fileName: string): void {
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = fileName;
	anchor.click();
	URL.revokeObjectURL(url);
}

/**
 * Format a byte count as a human-readable size (e.g. "1.5 MB").
 */
export function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

/** Pick a Lucide icon component from a file's extension. */
export function getFileIconForExtension(ext: string): Component {
	switch (ext.toLowerCase()) {
		case "pdf":
		case "doc":
		case "docx":
		case "rtf":
		case "txt":
		case "log":
		case "md":
			return FileText;
		case "png":
		case "jpg":
		case "jpeg":
		case "tif":
		case "tiff":
		case "gif":
		case "svg":
		case "webp":
			return FileImage;
		case "wav":
		case "mp3":
		case "ogg":
			return FileAudio;
		case "json":
		case "xml":
		case "htm":
		case "html":
		case "css":
		case "js":
		case "ts":
			return FileCode;
		case "csv":
		case "xlsx":
		case "xls":
			return FileSpreadsheet;
		default:
			return FileIcon;
	}
}

/**
 * Pick a Lucide icon component for a file based on its name's extension. For a
 * file with a known `fileExtension` (from the API), prefer
 * {@link getFileIconForExtension} so a `.redacted` display name doesn't misread.
 */
export function getFileIcon(fileName: string): Component {
	return getFileIconForExtension(getFileExtension(fileName));
}
