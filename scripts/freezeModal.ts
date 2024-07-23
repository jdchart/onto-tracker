import { App, Modal, Setting, Notice } from 'obsidian';
import { processFreeze } from 'scripts/procFreeze';

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
			'freezeDate' : ''
		}
	};

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('New Freeze...');

		contentEl.createEl("div", { text : "Here you can create a freeze and give it a name and date.", cls : "setting-item-description"})

		contentEl.createEl("br");

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

		customDateSetting(contentEl, this.freezeSettings);


		new Setting(contentEl)
			.addButton((btn) => {
				btn
					.setButtonText("Freeze")
					.setCta()
					.onClick(async () => {
						new Notice('Performing freeze...');
						this.close();
						await processFreeze(this.projectSettings, this.freezeSettings, this.thisApp);
					})
			})
	};

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	};
};

function customDateSetting(parentElement : HTMLElement, freezeSettings : Object){
	let top_div = parentElement.createEl('div', {cls : "setting-item"})
	let info_div = top_div.createEl('div', {cls : "setting-item-info"})
	let control_div = top_div.createEl('div', {cls : "setting-item-control"})
	info_div.createEl('div', { text: 'Freeze date', cls : "setting-item-name" });
	info_div.createEl('div', { text: 'The date the freeze was performed.', cls : "setting-item-description" });
	
    const dateTimeInput = control_div.createEl('input', { attr: { type: 'datetime-local' } });

	dateTimeInput.addEventListener('change', () => {
		console.log(dateTimeInput.value)
		freezeSettings.freezeDate = dateTimeInput.value
	});
};

export {FreezeModal};