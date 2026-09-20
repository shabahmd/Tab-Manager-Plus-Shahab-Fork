# Research: Firefox MV3 Migration Path

wayfinder:research

## Question

How should Firefox transition from Manifest V2 to Manifest V3, and what approach minimizes risk while maintaining compatibility?

Chrome already uses MV3 (manifest.json: manifest_version: 3, service_worker, action). Firefox still uses MV2 (manifest-firefox.json: manifest_version: 2, persistent background, browser_action). Firefox penalizes MV2 submissions but still allows them.

## Context

- manifest-firefox.json uses: browser_action, sidebar_action, persistent background scripts, MV2 permissions model
- Chrome manifest.json already migrated: action, service_worker, MV3 permissions
- Firefox may reject new MV2 submissions (Mozilla policy direction)
- Source code already uses service_worker pattern on Chrome side (src/service_worker/)
- WebExtension API is largely cross-browser compatible, but MV3 introduces service workers, declarativeNetRequest, and other changes

## Sub-questions to resolve

1. Should Firefox get a parallel MV3 manifest (manifest-firefox.json → manifest_version: 3)?
2. Can the Chrome service_worker code (src/service_worker/) be shared or forked for Firefox?
3. What Firefox-specific APIs (sidebar_action, contextualIdentities) must be preserved?
4. What is the timeline pressure? (Firefox MV2 deprecation policy)
