import {
  App,
  Editor,
  editorEditorField,
  FileSystemAdapter,
  MarkdownView,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from 'obsidian'
import { uploadToPaper } from 'src/dropbox'
import * as path from 'path'

// Remember to rename these classes and interfaces!

interface Settings {
  apiKey: string
  prefixPath: string
}

const DEFAULT_SETTINGS: Settings = {
  apiKey: 'default',
  prefixPath: '/paper/',
}
const DEFAULT_TOOLTIP_TEXT = 'Publish to Paper'
// const DEFAULT_ICON = 'cloud-upload';
const API_KEY_HELP_URL =
  'https://help.displayr.com/hc/en-us/articles/360004116315-How-to-Create-an-Access-Token-for-Dropbox'
export default class MyPlugin extends Plugin {
  settings: Settings

  async onload() {
    await this.loadSettings()

    // // This creates an icon in the left ribbon.
    // const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
    // 	// Called when the user clicks the icon.
    // 	new Notice('This is a notice!');
    // });
    // // Perform additional things with the ribbon
    // ribbonIconEl.addClass('my-plugin-ribbon-class');

    // This adds a status bar item to the bottom of the app. Does not work on mobile apps.
    const statusBarItemEl = this.addStatusBarItem()
    statusBarItemEl.setText(DEFAULT_TOOLTIP_TEXT)

    // This adds a simple command that can be triggered anywhere
    // this.addCommand({
    // 	id: 'open-sample-modal-simple',
    // 	name: 'Open sample modal ()',
    // 	callback: () => {
    // 		new SampleModal(this.app).open();
    // 	}
    // });
    // This adds an editor command that can perform some operation on the current editor instance
    const publish = async () => {
      const { apiKey, prefixPath } = this.settings
      if (!apiKey || !prefixPath) {
        new Notice('Please set your API key and prefix path in the settings.')
        return
      }

      const relativePath = this.app.workspace.getActiveFile().path
      let absolutePath = ''
      const adapter = app.vault.adapter
      if (adapter instanceof FileSystemAdapter) {
        absolutePath = path.join(adapter.getBasePath(), relativePath)
      } else {
        // throw error about adapter not being a FileSystemAdapter
        new Notice('This plugin only works with local files.')
        return
      }

      statusBarItemEl.setText('Publishing...')
      try {
        const url = await uploadToPaper(absolutePath, apiKey, prefixPath)
        statusBarItemEl.setText('Published')
        navigator.clipboard.writeText(url).then(() => {
          new Notice(`Published to Paper: ${url} copied to clipboard.`)
        })
        this.registerInterval(
          window.setInterval(() => {
            statusBarItemEl.setText(DEFAULT_TOOLTIP_TEXT)
          }, 3 * 1000),
        )
      } catch (e) {
        new Notice(`Error: ${e}`)
        statusBarItemEl.setText(DEFAULT_TOOLTIP_TEXT)
      }
      // console.log(editor.getSelection());
      // editor.replaceSelection('Sample Editor Command');
    }

    statusBarItemEl.onClickEvent(() => {
      publish()
    })

    this.addCommand({
      id: 'publish-to-paper',
      name: 'Publish to Dropbox Paper',
      callback: publish,
    })
    // This adds a complex command that can check whether the current state of the app allows execution of the command
    // this.addCommand({
    // 	id: 'open-sample-modal-complex',
    // 	name: 'Open sample modal (complex)',
    // 	checkCallback: (checking: boolean) => {
    // 		// Conditions to check
    // 		const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
    // 		if (markdownView) {
    // 			// If checking is true, we're simply "checking" if the command can be run.
    // 			// If checking is false, then we want to actually perform the operation.
    // 			if (!checking) {
    // 				new SampleModal(this.app).open();
    // 			}

    // 			// This command will only show up in Command Palette when the check function returns true
    // 			return true;
    // 		}
    // 	}
    // });

    this.addSettingTab(new SettingTab(this.app, this))

    // If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
    // Using this function will automatically remove the event listener when this plugin is disabled.
    // this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
    // 	console.log('click', evt);
    // });

    // When registering intervals, this function will automatically clear the interval when the plugin is disabled.
    // this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
  }

  onunload() {}

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
  }

  async saveSettings() {
    await this.saveData(this.settings)
  }
}

// class SampleModal extends Modal {
// 	constructor(app: App) {
// 		super(app);
// 	}

// 	onOpen() {
// 		const {contentEl} = this;
// 		contentEl.setText('Woah!');
// 	}

// 	onClose() {
// 		const {contentEl} = this;
// 		contentEl.empty();
// 	}
// }

class SettingTab extends PluginSettingTab {
  plugin: MyPlugin

  constructor(app: App, plugin: MyPlugin) {
    super(app, plugin)
    this.plugin = plugin
  }

  display(): void {
    const { containerEl } = this

    containerEl.empty()

    containerEl.createEl('h2', {
      text: 'Obsidian note publish to Dropbox Paper',
    })

    containerEl.createEl('a', {
      text: 'How to get Dropbox Paper API key',
      href: API_KEY_HELP_URL,
    })

    new Setting(containerEl)
      .setName('API Key')
      .setDesc('Enter your API key for Dropbox Paper')
      .addText((text) =>
        text
          .setPlaceholder('Enter your secret key here')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value
            await this.plugin.saveSettings()
          }),
      )

    new Setting(containerEl)
      .setName('Paper directory path')
      .setDesc(
        'Enter the path to the directory where you want to save your published notes',
      )
      .addText((text) =>
        text
          .setPlaceholder('/paper/')
          .setValue(this.plugin.settings.prefixPath)
          .onChange(async (value) => {
            this.plugin.settings.prefixPath = value
            await this.plugin.saveSettings()
          }),
      )
  }
}
