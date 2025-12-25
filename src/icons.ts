import { initializeIcons } from "@fluentui/react/lib/Icons";

let initialized = false;

export function initFluentIcons() {
    if (!initialized) {
        initializeIcons();
        initialized = true;
    }
}
