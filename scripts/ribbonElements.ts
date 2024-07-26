// Create the ribbon menu

// Import elements from obsidian
import { Menu } from 'obsidian';

// Import onto tracker scripts
import { FreezeModal } from 'scripts/freezeModal';
import { UnpackOntologyModal } from 'scripts/unpackOntologyModal';
import { MapMakerModal } from 'scripts/mapMakerModal';
import { MapModal } from 'scripts/mapModal';

export const createRibbonElements = (parent : any) => {
    // Create menu in ribbon:
		const ribbonIconEl = parent.addRibbonIcon('go-to-file', 'Onto Tracker', (evt: MouseEvent) => {
        // Create menu on click:
        const menu = new Menu();

        //Add menu items:
        menu.addItem((item) =>
            item
            .setTitle("New freeze...")
            // .setIcon("documents")
            .onClick(() => {
                new FreezeModal(parent.app, parent.settings).open();
            })
        );
        menu.addItem((item) =>
            item
            .setTitle("Map...")
            // .setIcon("documents")
            .onClick(() => {
                new MapModal(parent.app, parent.settings).open();
            })
        );
        menu.addItem((item) =>
            item
            .setTitle("New mapping...")
            // .setIcon("documents")
            .onClick(() => {
                new MapMakerModal(parent.app, parent.settings).open();
            })
        );
        menu.addItem((item) =>
            item
            .setTitle("Unpack ontology...")
            // .setIcon("documents")
            .onClick(() => {
                new UnpackOntologyModal(parent.app, parent.settings).open();
            })
        );

        menu.showAtMouseEvent(evt);
    });
    ribbonIconEl.addClass('my-plugin-ribbon-class');
};