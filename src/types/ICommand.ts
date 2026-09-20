import {ISavedSession} from "@types";
import * as browser from "webextension-polyfill";

export interface ICommand
{
    command: string,
    window_ids?: number[],
    window_id?: number,
    tab_id?: number,
    tabId?: number,
    color?: string,
    name?: string,
    session?: ISavedSession,
    tab?: browser.Tabs.Tab,
    saved_tab?: browser.Tabs.OnActivatedActiveInfoType,
    tabs?: browser.Tabs.Tab[],
    tab_ids?: number[],
    target_window?: number,
    target_index?: number,
    minutes?: number,
    incognito?: boolean,
    muted?: boolean
}