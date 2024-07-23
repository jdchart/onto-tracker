# Onto Tracker

**Manage projects according to an ontology.**

Create an obsidian vault that tracks the contents of a folder on your computer. Files are categorized accrodign to a given ontology according to a set of user-defined rules. This content can then be parsed for tasks such as uploading content to a CMS.

1. [Usage](#usage)
- [Project settings](#project-settings)
- [Unpacking ontologies](#unpacking-ontologies)
- [Creating freezes](#creating-freezes)
- [Ontology mapping](#ontology-mapping)
2. [Roadmap](#roadmap)
3. [Acknowledgements](#acknowledgements)

## Usage

### Project settings

![project settings](/docs/project_settings.png)

Activate the plugin, then in the settings, give your project a title and set the source folder that contains all of the files you wish to track.

Then set an ontology file - [here is an example](https://zenodo.org/records/8084209) of an ontology that is used to preserve electroacoustic music projects called Eulalie. Download the file [here](https://zenodo.org/records/8084209/files/Eulalie.php.xml?download=1).

### Unpacking ontologies

![unpack onto tab](/docs/ontos_1.png)

When the plugin is active, a menu will appear in Obsidian's main ribbon. You can click `Unpack ontology...` to get a better idea about how your ontology works.

![unpack onto settings tab](/docs/ontos_2.png)

You can set a name for the folder that will be created.

![ontoilogy unpacked](/docs/ontos_3.png)

You will see that a folder called `ontos` will be created at the root of your vault. Here you will find your ontology that has been unpacked which you can view as needed.

### Creating freezes

![freeze tab](/docs/freeze_1.png)

You can perform 'freezes' of the content in the source folder you're tracking. Click on the `New freeze...` button to get started.

![freeze settings tab](/docs/freeze_2.png)

You can give your freeze a name and a date.

![freeze example](/docs/freeze_3.png)

Now a folder called `freezes` will be created at the root of your vault, and a file will be created for each file in the folder you are tracking. 

The metadata of each file will give some basic information about the file.

The markdown content is intended to be used to take notes that give contextualising information about the file. Feel free to edit this however you feel fit.

A metadata file shall also be created giving information about the freeze.

### Ontology mapping

Finally, you can automatically update each file's metadata according to your ontology. To do this, you will first need to create some rules (we call this a 'mapping').

#### Creating a mapping

![create mapping](/docs/map1.png)

Click on `New mapping...` to create a new mapping.

![create mapping settings](/docs/map2.png)

You can give your mapping a name.

![mapping rule](/docs/map3.png)

A folder called `mappings` will have been created in the root of your vault. Here you can open the file called `mime_types_mapping` to create rules that will assign files to a certain class in your ontology according to file type.

The 6 basic mime types are already created, as well as an 'other' field. You can also add more types and subtypes which will replace main categories (fro example, you can set a rule for audio, and then another for audio/wav).

To create a rule, set the class name, a double equals, and then the index of the rule in the ontology (1-counting, as presented when unpacking an ontoilogy).

#### Mapping a freeze

![map ribbon](/docs/map4.png)

Now that the mapping rules have been created, you can map the files in a freeze by clicking the `Map...` button.

![map settings](/docs/map5.png)

Choose which freeze and which mapping you wish to use.

![map results](/docs/map6.png)

Observe now that the metadate of your freeze files will have been updated (and any notes you wrote in the markdown part of the file are retained).

## Roadmap

- [ ] Rule creation for folder placement.
- [ ] Rule creation for file name parsing.
- [ ] Detect already existing files in a new freeze and retain markdown content.
- [ ] Implement "other" mime type parsing.

## Acknowledgements

_Created by Jacob Hart._
_This project was initially created for the archival work at [Art Zoyd Studios](https://artzoydstudios.com/en/)._
_Avec le soutien de la Région Bretagne._