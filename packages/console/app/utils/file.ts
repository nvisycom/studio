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
	const ext = fileName.split(".").pop()?.toLowerCase();
	switch (ext) {
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
