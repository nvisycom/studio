import type { PickedFile } from "#console/utils/connections/pickers/types";
import { ImportError } from "#console/utils/connections/pickers/types";

// OneDrive File Picker v8: opens the picker in a popup and drives its
// postMessage protocol over a MessagePort. The launch is a form POST to the
// picker with the options JSON in the `filePicker` query param and the access
// token in an `access_token` field; the picker then opens a message channel by
// posting `initialize` (carrying its MessagePort). The host answers the
// picker's `authenticate` command with a token and resolves with the items from
// the `pick` command.
// See https://learn.microsoft.com/onedrive/developer/controls/file-pickers.
const ONEDRIVE_BASE = "https://onedrive.live.com/picker";

/**
 * Open the OneDrive picker and resolve with the chosen files (or `null` if the
 * user cancelled).
 *
 * The picker authenticates per resource: its `authenticate` command names the
 * resource it needs a token for (consumer OneDrive asks for
 * `my.microsoftpersonalcontent.com` and `api.onedrive.com`, which need
 * differently-scoped tokens), so `getToken` mints a token server-side
 * (`getPickerToken`) for each requested resource. It's also called once with no
 * resource to seed the launch form (the server's default picker resource).
 */
export async function openOneDrivePicker(
	getToken: (resource?: string) => Promise<string>,
): Promise<PickedFile[] | null> {
	// The launch form needs a token synchronously, so mint the initial one before
	// opening the popup (a popup opened here stays the user-gesture window).
	const initialToken = await getToken();

	return new Promise((resolve, reject) => {
		const opened = window.open("", "onedrive-picker", "width=1080,height=680");
		if (!opened) {
			reject(new ImportError("files.errors.importPopupBlocked"));
			return;
		}
		// Non-null alias so the closures below see a `Window`, not `Window | null`.
		const popup: Window = opened;

		// A per-instance channel id (a GUID, per the v8 contract) the picker echoes
		// back on `initialize`, so we only adopt the channel meant for us.
		const channelId = crypto.randomUUID();

		// The v8 options object. `messaging` establishes the postMessage channel;
		// the `authentication` object (even empty) tells the picker the host
		// supplies tokens (answered on the `authenticate` command below).
		const options = {
			sdk: "8.0",
			messaging: { origin: window.location.origin, channelId },
			entry: { oneDrive: { files: {} } },
			authentication: {},
			typesAndSources: { mode: "files", pivots: { oneDrive: true } },
			selection: { mode: "multiple" },
		};

		// Launch: a self-submitting form POST. The options ride in the `filePicker`
		// query param (JSON); the token is an `access_token` form field.
		const query = new URLSearchParams({
			filePicker: JSON.stringify(options),
			locale: "en-us",
		});
		const form = popup.document.createElement("form");
		form.setAttribute("action", `${ONEDRIVE_BASE}?${query}`);
		form.setAttribute("method", "POST");
		const tokenInput = popup.document.createElement("input");
		tokenInput.setAttribute("type", "hidden");
		tokenInput.setAttribute("name", "access_token");
		tokenInput.setAttribute("value", initialToken);
		form.appendChild(tokenInput);
		popup.document.body.appendChild(form);
		form.submit();

		let port: MessagePort | null = null;
		let poll: ReturnType<typeof setInterval> | undefined;

		function cleanup() {
			if (poll) clearInterval(poll);
			window.removeEventListener("message", onWindowMessage);
			port?.close();
			if (!popup.closed) popup.close();
		}

		function onPortMessage(event: MessageEvent) {
			const msg = event.data;
			if (msg?.type !== "command") return;

			// The message id is at the top level (`msg.id`); the command name and its
			// arguments are under `msg.data`. Every command is acknowledged, then
			// answered with a result carrying the same id.
			const id = msg.id;
			const command = msg.data?.command as string | undefined;
			port?.postMessage({ type: "acknowledge", id });

			if (command === "authenticate") {
				// The picker asks for a token scoped to `msg.data.resource`; mint one
				// for exactly that resource and reply with it.
				const resource = msg.data?.resource as string | undefined;
				getToken(resource)
					.then((token) => {
						port?.postMessage({
							type: "result",
							id,
							data: { result: "token", token },
						});
					})
					.catch(() => {
						cleanup();
						reject(new ImportError("files.errors.importAuthFailed"));
					});
			} else if (command === "close") {
				cleanup();
				resolve(null);
			} else if (command === "pick") {
				port?.postMessage({
					type: "result",
					id,
					data: { result: "success" },
				});
				const items: PickedFile[] = (msg.data?.items ?? []).map(
					(it: { id: string; name: string }) => ({
						id: it.id,
						name: it.name,
					}),
				);
				cleanup();
				resolve(items);
			}
		}

		function onWindowMessage(event: MessageEvent) {
			// The picker initializes the channel by posting to the opener; adopt its
			// MessagePort (only for our channel) and drive the protocol over it.
			if (event.source !== popup) return;
			const msg = event.data;
			if (msg?.type !== "initialize" || msg.channelId !== channelId) return;
			port = event.ports[0] ?? null;
			if (!port) return;
			port.addEventListener("message", onPortMessage);
			port.start();
			port.postMessage({ type: "activate" });
		}

		window.addEventListener("message", onWindowMessage);

		// If the user closes the popup manually, treat it as a cancel. cleanup()
		// clears this interval, so the manual-close and protocol-complete paths
		// don't leave it running.
		poll = setInterval(() => {
			if (popup.closed) {
				cleanup();
				resolve(null);
			}
		}, 500);
	});
}
