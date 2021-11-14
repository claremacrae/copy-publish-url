import { Notice, Plugin, TFile } from 'obsidian';
import type { CopyPublishUrlSettings } from './interfaces';
import CopyPublishUrlSettingTab from './settings';

const DEFAULT_SETTINGS: CopyPublishUrlSettings = {
    homeNote: '',
    publishPath: '',
};

export default class CopyPublishUrlPlugin extends Plugin {
    //@ts-ignore
    settings: CopyPublishUrlSettings;

    async copyPublishUrl(path: string) {
        let url = this.settings.publishPath;
        let publishedNote = path.slice(0, -3);
        // the index note is at the root level of the publish vault
        if (publishedNote === this.settings.homeNote) {
            if (publishedNote.includes('/')) {
                //@ts-ignore
                publishedNote = publishedNote.split('/').last();
            }
        }
        url = encodeURI(url + publishedNote);
        url = url.replace(/%20/g, '+');
        await navigator.clipboard.writeText(url);
        new Notice('Publish Url copied to your clipboard');
    }

    async onload() {
        console.log('loading Copy Publish URL plugin');

        await this.loadSettings();

        this.addCommand({
            id: 'copy-publish-url',
            name: 'Copy URL',
            checkCallback: (checking: boolean) => {
                const tfile = this.app.workspace.getActiveFile();
                if (tfile instanceof TFile) {
                    if (!checking) {
                        (async () => {
                            const fileCache =
                                this.app.metadataCache.getFileCache(tfile);
                            const frontMatter = fileCache?.frontmatter;
                            if (frontMatter !== undefined) {
                                try {
                                    const state = frontMatter.publish;
                                    if (
                                        state === false
                                    ) {
                                        new Notice(
                                            'This note contains the publish: false flag.'
                                        );
                                        return;
                                    }
                                } catch {
                                    // do nothing
                                }
                            }
                            const path = tfile.path;
                            await this.copyPublishUrl(path);
                        })();
                    }
                    return true;
                } else {
                    return false;
                }
            },
        });

        this.addSettingTab(new CopyPublishUrlSettingTab(this.app, this));
    }

    onunload() {
        console.log('unloading Copy Publish URL plugin');
    }

    async loadSettings() {
        this.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            await this.loadData()
        );
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}
