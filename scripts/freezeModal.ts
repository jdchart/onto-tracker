/**
 * Freeze Modal - Allows users to create "freezes" of project content
 * 
 * A freeze creates markdown files for each file in the source folder,
 * capturing metadata and allowing for version tracking over time.
 */

// Imports
import { App, Modal, Setting, Notice } from 'obsidian';
import { processFreeze } from 'scripts/procFreeze';
import { FreezeSettings, OntoTrackerSettings as ProjectSettings } from 'scripts/types';

/**
 * Modal for creating project freezes
 * Provides interface for configuring freeze settings including name, date, and options
 */
class FreezeModal extends Modal {
	projectSettings: ProjectSettings;
	thisApp: App;
	freezeSettings: FreezeSettings;

	/**
	 * Initialize the freeze modal
	 * @param app - Obsidian app instance
	 * @param settings - Project settings containing source folder and ontology info
	 */
	constructor(app: App, settings: ProjectSettings) {
		super(app);
		this.thisApp = app;
		this.projectSettings = settings;
		this.freezeSettings = {
			'freezeName' : 'untitled',
			'freezeDate' : '',
			'keepOld' : true,
			'forbidden' : "DS_Store"
		}
	}

	/**
	 * Display the freeze modal content
	 * Creates form elements for freeze configuration
	 */
	onOpen(): void {
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
						try {
							// Validate settings before processing
							if (!this.projectSettings.sourceFolder) {
								new Notice('Error: No source folder specified in settings');
								return;
							}

							if (!this.freezeSettings.freezeName.trim()) {
								new Notice('Error: Please enter a freeze name');
								return;
							}

							this.close();

							// Freeze is processed in procFreeze.ts:
							await processFreeze(this.projectSettings, this.freezeSettings, this.thisApp);
						} catch (error) {
							console.error('Error in freeze creation:', error);
							new Notice(`Error creating freeze: ${error instanceof Error ? error.message : 'Unknown error'}`);
						}
					})
			});
	}

	/**
	 * Clean up modal content when closed
	 */
	onClose(): void {
		const {contentEl} = this;
		contentEl.empty();
	}
}

/**
 * Create a custom date/time input element for freeze settings
 * @param parentElement - Parent HTML element to attach the input to
 * @param freezeSettings - Freeze settings object to update with selected date
 */
function customDateSetting(parentElement: HTMLElement, freezeSettings: FreezeSettings): void {
	const top_div = parentElement.createEl('div', {cls : "setting-item"})
	const info_div = top_div.createEl('div', {cls : "setting-item-info"})
	const control_div = top_div.createEl('div', {cls : "setting-item-control"})
	info_div.createEl('div', { text: 'Freeze date', cls : "setting-item-name" });
	info_div.createEl('div', { text: 'The date the freeze was performed.', cls : "setting-item-description" });
	
	// Get current date:
	const now = new Date();
	now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
	const current_date = now.toISOString().slice(0,16);

    const dateTimeInput = control_div.createEl('input', { attr: { type: 'datetime-local' }, value : current_date });

	(freezeSettings as any).freezeDate = dateTimeInput.value;

	dateTimeInput.addEventListener('change', () => {
		(freezeSettings as any).freezeDate = dateTimeInput.value;
	});
}

export {FreezeModal};