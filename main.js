const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
	}

	async init(config) {
		this.config = config
		this.log('info', 'Initialisation du module IPX800...')

		this.updateStatus(InstanceStatus.Ok)

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}

	// When module gets deleted
	async destroy() {
		this.log('debug', 'destroy')
	}

	async configUpdated(config) {
		this.config = config
		this.log('info', 'Configuration mise à jour')
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
	}

	// Return config fields for web config
	getConfigFields() {
		this.log('info', 'Chargement des champs de configuration')
		return [
			{
				type: 'textinput',
				id: 'host',
				label: 'IP address of IPX800',
				width: 8,
				default: '192.168.1.100',
				regex: Regex.IP,
			},
			{
				type: 'textinput',
				id: 'apiKey',
				label: 'API Key',
				width: 8,
				default: '',
			},
		]
	}

	updateActions() {
		UpdateActions(this)
	}

	updateFeedbacks() {
		UpdateFeedbacks(this)
	}

	updateVariableDefinitions() {
		UpdateVariableDefinitions(this)
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)