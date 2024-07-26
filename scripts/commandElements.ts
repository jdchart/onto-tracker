// Create onto tracker obsidian commands

// Import onto tracker scripts
import { FreezeModal } from 'scripts/freezeModal';
import { UnpackOntologyModal } from 'scripts/unpackOntologyModal';
import { MapMakerModal } from 'scripts/mapMakerModal';
import { MapModal } from 'scripts/mapModal';

export const createCommands = (parent: any) => {
    parent.addCommand({
        id: 'open-new-freeze-modal',
        name: 'Perform a new freeze...',
        callback: () => {
            new FreezeModal(parent.app, parent.settings).open();
        }
    });

    parent.addCommand({
        id: 'open-map-modal',
        name: 'Perform a mapping...',
        callback: () => {
            new MapModal(parent.app, parent.settings).open();
        }
    });

    parent.addCommand({
        id: 'open-map-maker-modal',
        name: 'Create a new mapping file...',
        callback: () => {
            new MapMakerModal(parent.app, parent.settings).open();
        }
    });

    parent.addCommand({
        id: 'open-unpack-ontology-modal',
        name: 'Unpack an ontology file...',
        callback: () => {
            new UnpackOntologyModal(parent.app, parent.settings).open();
        }
    });
};