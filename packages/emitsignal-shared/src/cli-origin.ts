// Better Auth rejects an origin-less request the moment a cookie rides along
// (Cloudflare attaches `__cf_bm`), so the CLI sends this and the server trusts it.
export const CLI_ORIGIN = 'emitsignal-cli://';
