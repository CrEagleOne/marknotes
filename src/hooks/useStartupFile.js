import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { isDesktop } from "../utils/path.utils";

// Open the file the app was launched with (double-click on a .md file,
// or "Open with" from the OS context menu), and keep listening for the
// same thing happening while the app is already running (a second
// process is started, forwarded to us by the Rust single-instance
// plugin, then closed).
//
// `openDocumentRef` always points at the latest openDocument closure, so
// this one-time effect never sees a stale `tabs` list.
export function useStartupFile(openDocumentRef) {
  useEffect(() => {
    if (!isDesktop()) return undefined;

    let isMounted = true;

    invoke("get_startup_file")
      .then((path) => {
        if (isMounted && path) {
          openDocumentRef.current?.(path);
        }
      })
      .catch(() => {
        // No startup file, or running outside of Tauri: nothing to do.
      });

    const unlistenPromise = listen("open-file", (event) => {
      if (event.payload) {
        openDocumentRef.current?.(event.payload);
      }
    });

    return () => {
      isMounted = false;
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);
}
