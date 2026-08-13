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

/**
 * Extensions rendered as images / as text in the studio preview. These are a
 * *rendering* concern, broader than {@link ACCEPTED_EXTENSIONS} (e.g. `bmp`,
 * `yaml`) — a file's preview mode, not whether it may be uploaded.
 */
export const IMAGE_EXTENSIONS = [
	"png",
	"jpg",
	"jpeg",
	"gif",
	"webp",
	"bmp",
	"svg",
] as const;
export const TEXT_EXTENSIONS = [
	"txt",
	"md",
	"log",
	"csv",
	"json",
	"xml",
	"yaml",
	"yml",
] as const;

/** Whether a file name should be previewed as an image. */
export function isImageFileName(fileName: string): boolean {
	return (IMAGE_EXTENSIONS as readonly string[]).includes(
		getFileExtension(fileName),
	);
}

/** Whether a file name should be previewed as text. */
export function isTextFileName(fileName: string): boolean {
	return (TEXT_EXTENSIONS as readonly string[]).includes(
		getFileExtension(fileName),
	);
}

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

/**
 * Pick a Lucide icon component for a file based on its extension.
 */
export function getFileIcon(fileName: string): Component {
	switch (getFileExtension(fileName)) {
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
