import { STORAGE_KEYS } from "../constants/app.constants";

export function createTab({ name, content, path = null }) {
  return {
    id: path || `untitled-${crypto.randomUUID()}`,
    name,
    content,
    path,
    dirty: false,
  };
}

export function getInitialDocument(translate) {
  try {
    const storedDocument = JSON.parse(localStorage.getItem(STORAGE_KEYS.document));

    return (
      storedDocument || {
        name: translate("untitled"),
        content: translate("sample"),
      }
    );
  } catch {
    return {
      name: translate("untitled"),
      content: translate("sample"),
    };
  }
}
