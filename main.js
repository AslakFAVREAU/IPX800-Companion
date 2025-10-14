const { InstanceBase, Regex, runEntrypoint, InstanceStatus } = require('@companion-module/base')
const UpgradeScripts = require('./upgrades')
const UpdateActions = require('./actions')
const UpdateFeedbacks = require('./feedbacks')
const UpdateVariableDefinitions = require('./variables')

// Vérification que les imports sont corrects
if (!InstanceBase || !runEntrypoint || !InstanceStatus) {
	throw new Error('Failed to import required components from @companion-module/base')
}

class ModuleInstance extends InstanceBase {
	constructor(internal) {
		super(internal)
		
		// S'assurer que le module démarre toujours dans un état actif
		this.log('info', 'IPX800 Module Instance created')
	}

	async init(config) {
		this.config = config || {}
		this.log('info', 'Initialisation du module IPX800...')

		// Si aucune configuration n'est chargée, définir des valeurs par défaut
		if (!config || Object.keys(config).length === 0) {
			this.log('info', 'Aucune configuration trouvée, configuration requise')
			this.config = {
				host: '',
				apiKey: ''
			}
			this.updateStatus(InstanceStatus.BadConfig, 'Configuration required - please set IP address and API key')
			this.updateActions() // export actions
			this.updateFeedbacks() // export feedbacks
			this.updateVariableDefinitions() // export variable definitions
			return
		}

		// Validation de la configuration
		if (!this.config.host || this.config.host.trim() === '') {
			this.updateStatus(InstanceStatus.BadConfig, 'IP address is required')
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			return
		}

		if (!this.config.apiKey || this.config.apiKey.trim() === '') {
			this.updateStatus(InstanceStatus.BadConfig, 'API Key is required')
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			return
		}

		// Test de connexion
		await this.testConnection()

		this.updateActions() // export actions
		this.updateFeedbacks() // export feedbacks
		this.updateVariableDefinitions() // export variable definitions
	}

	// When module gets deleted
	async destroy() {
		this.log('info', 'IPX800 Module shutting down...')
		
		// Nettoyage si nécessaire
		if (this.setVariableValues) {
			try {
				this.setVariableValues({
					connection_status: 'Disconnected'
				})
			} catch (error) {
				this.log('debug', 'Error updating variables during shutdown:', error.message)
			}
		}
		
		this.log('debug', 'IPX800 Module destroyed')
	}

	async configUpdated(config) {
		this.config = config || {}
		this.log('info', 'Configuration mise à jour')
		
		// Validation de la configuration
		if (!this.config.host || this.config.host.trim() === '') {
			this.updateStatus(InstanceStatus.BadConfig, 'IP address is required')
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			return
		}

		if (!this.config.apiKey || this.config.apiKey.trim() === '') {
			this.updateStatus(InstanceStatus.BadConfig, 'API Key is required')
			this.updateActions()
			this.updateFeedbacks()
			this.updateVariableDefinitions()
			return
		}

		// Test de connexion
		await this.testConnection()
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
				required: true,
			},
			{
				type: 'textinput',
				id: 'apiKey',
				label: 'API Key',
				width: 8,
				default: '',
				required: true,
				tooltip: 'API Key from your IPX800 device settings',
			},
		]
	}

	async getRelayList() {
		try {
			if (!this.config || !this.config.host || !this.config.apiKey) {
				this.log('warn', 'Configuration incomplète pour récupérer la liste des relais')
				return []
			}

			const fetch = require('node-fetch')
			const url = `http://${this.config.host}/api/core/io?ApiKey=${this.config.apiKey}`
			
			this.log('debug', `Récupération de la liste des relais: ${url}`)
			
			const response = await fetch(url, { 
				method: 'GET',
				timeout: 5000
			})
			
			if (response.ok) {
				const data = await response.json()
				this.log('debug', `Liste des I/O récupérée: ${data.length} éléments`)
				
				// Filtrer pour ne garder que les relais de commande (pas les states/inputs)
				const relays = data
					.filter(item => {
						const name = (item.name || '').toLowerCase()
						return name.includes('relay cmd') ||  // Relais de commande IPX
							name.includes('relay command') ||
							(name.includes('relay') && !name.includes('state') && !name.includes('input'))
					})
					.map(relay => ({
						id: relay._id.toString(),
						label: `${relay.name || `Relay ${relay._id}`} (ID: ${relay._id})`
					}))
				
				this.log('info', `${relays.length} relais de commande trouvés`)
				return relays
			} else {
				this.log('warn', `Erreur lors de la récupération des relais: ${response.status}`)
				return []
			}
		} catch (error) {
			this.log('error', `Erreur lors de la récupération des relais: ${error.message}`)
			return []
		}
	}

	async testConnection() {
		try {
			// Vérification des prérequis
			if (!this.config || !this.config.host || !this.config.apiKey) {
				this.updateStatus(InstanceStatus.BadConfig, 'Configuration incomplete')
				return
			}

			const fetch = require('node-fetch')
			
			this.log('info', `Testing connection to ${this.config.host}...`)
			this.updateStatus(InstanceStatus.Connecting, 'Testing connection...')
			
			// Test plusieurs endpoints et méthodes d'authentification
			const testUrls = [
				`http://${this.config.host}/api/core/info?ApiKey=${this.config.apiKey}`,
				`http://${this.config.host}/api/core/io?ApiKey=${this.config.apiKey}`,
				`http://${this.config.host}/api/core/devices?ApiKey=${this.config.apiKey}`
			]
			
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 5000)
			
			for (const url of testUrls) {
				try {
					this.log('debug', `Testing: ${url}`)
					
					const response = await fetch(url, { 
						signal: controller.signal,
						timeout: 5000
					})
					
					if (response.ok) {
						clearTimeout(timeoutId)
						this.updateStatus(InstanceStatus.Ok, 'Connected')
						this.log('info', 'Connection to IPX800 successful')
						
						// Mettre à jour les variables de statut
						if (this.setVariableValues) {
							this.setVariableValues({
								connection_status: 'Connected',
								ipx800_host: this.config.host
							})
						}
						return
					}
				} catch (error) {
					this.log('debug', `Test failed for ${url}: ${error.message}`)
				}
			}
			
			clearTimeout(timeoutId)
			
			// Si aucun endpoint n'a fonctionné
			this.updateStatus(InstanceStatus.Ok, `Ready - No working endpoint found`)
			this.log('warn', `No working API endpoint found, but module remains active`)
		} catch (error) {
			let errorMessage = error.message
			if (error.name === 'AbortError') {
				errorMessage = 'Connection timeout'
			}
			// Ne pas mettre en erreur, garder le module actif
			this.updateStatus(InstanceStatus.Ok, `Ready - ${errorMessage}`)
			this.log('warn', `Connection test failed: ${errorMessage}, but module remains active`)
		}
	}

	// Méthode de diagnostic pour forcer la réactivation
	async forceEnable() {
		this.log('info', 'Force enabling module...')
		this.updateStatus(InstanceStatus.Ok, 'Force enabled')
		
		this.updateActions()
		this.updateFeedbacks()
		this.updateVariableDefinitions()
		
		// Tenter une connexion si la config est disponible
		if (this.config && this.config.host && this.config.apiKey) {
			await this.testConnection()
		}
	}

	updateActions() {
		try {
			UpdateActions(this)
		} catch (error) {
			this.log('error', `Error updating actions: ${error.message}`)
		}
	}

	updateFeedbacks() {
		try {
			UpdateFeedbacks(this)
		} catch (error) {
			this.log('error', `Error updating feedbacks: ${error.message}`)
		}
	}

	updateVariableDefinitions() {
		try {
			UpdateVariableDefinitions(this)
		} catch (error) {
			this.log('error', `Error updating variables: ${error.message}`)
		}
	}
}

runEntrypoint(ModuleInstance, UpgradeScripts)