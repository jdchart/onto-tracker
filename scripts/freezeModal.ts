// A modal which allows the user to create a md file for each of the files in the source folder.

// Imports
import { App, Modal, Setting } from 'obsidian';
import { processFreeze } from 'scripts/procFreeze';

// Create modal:
class FreezeModal extends Modal {
	projectSettings : Object;
	thisApp : Object;
	freezeSettings : { [key: string]: any };

	constructor(app: App, settings : Object) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.freezeSettings = {
			'freezeName' : 'untitled',
			'freezeDate' : '',
			'keepOld' : true,
			'forbidden' : "DS_Store"
		}
	};

	onOpen() {
		// Create the modal elements:
		const {contentEl} = this;
		contentEl.setText('New freeze');
		contentEl.createEl("div", { text : "Here you can create a freeze and give it a name and date.", cls : "setting-item-description"})
		contentEl.createEl("br");

		// Freeze name:
		new Setting(contentEl)
			.setName('Freeze name')
			.setDesc('Give the freeze a name.')
			.addText(text => text
				// .setPlaceholder('Enter your secret')
				.setValue(this.freezeSettings.freezeName)
				.onChange((value) => {
					this.freezeSettings.freezeName = value;
				})
			);

		// Freeze date:
		customDateSetting(contentEl, this.freezeSettings);

		// Keep old:
		new Setting(contentEl)
			.setName('Detect existing files')
			.setDesc('If the file existed in previous freezes, a link shall be created between the two files.')
			.addToggle(tog => tog
				.setValue(this.freezeSettings.keepOld)
				.onChange((value) => {
					this.freezeSettings.keepOld = value;
				})
			);

		// Forbidden formats:
		new Setting(contentEl)
			.setName('Ignore files')
			.setDesc('Give a list of file formats (separated by commas) which will be ignored.')
			.addTextArea(text => text
				.setValue(this.freezeSettings.forbidden)
				.onChange((value) => {
					this.freezeSettings.forbidden = value;
				})
			);

		// Trigger freeze:
		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Freeze")
					.setCta()
					.onClick(async () => {
						this.close();

						// Freeze is processed in procFreeze.js:
						await processFreeze(this.projectSettings, this.freezeSettings, this.thisApp);
					})
			});
	};

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	};
};

// A custom date entry element:
function customDateSetting(parentElement : HTMLElement, freezeSettings : Object){
	let top_div = parentElement.createEl('div', {cls : "setting-item"})
	let info_div = top_div.createEl('div', {cls : "setting-item-info"})
	let control_div = top_div.createEl('div', {cls : "setting-item-control"})
	info_div.createEl('div', { text: 'Freeze date', cls : "setting-item-name" });
	info_div.createEl('div', { text: 'The date the freeze was performed.', cls : "setting-item-description" });
	
	// Get current date:
	let now = new Date();
	now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
	const current_date = now.toISOString().slice(0,16);

    const dateTimeInput = control_div.createEl('input', { attr: { type: 'datetime-local' }, value : current_date });

	freezeSettings.freezeDate = dateTimeInput.value;

	dateTimeInput.addEventListener('change', () => {
		freezeSettings.freezeDate = dateTimeInput.value;
	});
};

export {FreezeModal};