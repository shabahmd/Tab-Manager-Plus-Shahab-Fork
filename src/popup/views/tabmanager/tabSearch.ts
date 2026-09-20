"use strict";

// Search parsing and matching extracted from TabManager.search().
// "google mail" matches tabs containing both words (AND),
// "google OR mail" matches tabs containing either word.
export type TabSearchType = "normal" | "OR" | "AND";

export interface ParsedTabSearch {
	searchType: TabSearchType;
	searchTerms: string[];
}

export function parseTabSearch(searchQuery : string) : ParsedTabSearch {
	let searchType : TabSearchType = "normal";
	let searchTerms : string[] = [];
	if (searchQuery.indexOf(" ") === -1) {
		searchType = "normal";
	} else if (searchQuery.indexOf(" OR ") > -1) {
		searchTerms = searchQuery.split(" OR ");
		searchType = "OR";
	} else if (searchQuery.indexOf(" ") > -1) {
		searchTerms = searchQuery.split(" ");
		searchType = "AND";
	}
	if (searchType !== "normal") {
		searchTerms = searchTerms.filter(function(entry) { return entry.trim() !== ''; });
	}
	return { searchType, searchTerms };
}

export function matchTabSearch(tabSearchTerm : string, rawQuery : string, searchType : TabSearchType, searchTerms : string[]) : boolean {
	let match = false;
	if (searchType === "normal") {
		match = (tabSearchTerm.indexOf(rawQuery.toLowerCase()) >= 0);
	} else if (searchType === "OR") {
		for (let searchOR of searchTerms) {
			searchOR = searchOR.trim().toLowerCase();
			if (tabSearchTerm.indexOf(searchOR) >= 0) {
				match = true;
				break;
			}
		}
	} else if (searchType === "AND") {
		let andMatch = true;
		for (let searchAND of searchTerms) {
			searchAND = searchAND.trim().toLowerCase();
			if (tabSearchTerm.indexOf(searchAND) < 0) {
				andMatch = false;
				break;
			}
		}
		match = andMatch;
	}
	return match;
}
