// APP_PUBLISH_READ_ONLY registers only tools that read from the stores, so a
// session cannot change a live listing. Classification is by name; every
// list/get/search/query/download tool only sends GET requests (or POST queries
// that read), and tests pin the exceptions below.

const READ_PREFIX = /^(apple|google)_(list|get|search|query|download)_/;

const READ_EXCEPTIONS = new Set([
  // Polls with GET only (apple_wait_for_build_upload is excluded: it deletes failed reservations)
  'apple_wait_for_asset',
  // Google reads listings, tracks and images inside an edit. An edit that is
  // never committed changes nothing live; without these the read tools are unusable.
  'google_create_edit',
  'google_validate_edit',
  'google_delete_edit',
]);

const OFF_VALUES = /^(|0|false|no|off)$/i;

/** Fails closed: any value other than empty/0/false/no/off turns read-only mode on. */
export function isReadOnlyMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return !OFF_VALUES.test((env.APP_PUBLISH_READ_ONLY ?? '').trim());
}

export function isReadTool(name: string): boolean {
  return READ_PREFIX.test(name) || READ_EXCEPTIONS.has(name);
}
