const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	// Vérification que self existe et a les méthodes nécessaires
	if (!self || typeof self.setFeedbackDefinitions !== 'function') {
		console.error('Invalid self object passed to feedbacks module')
		return
	}

	// Initialiser les choix de relais par défaut
	let relayChoices = [
		{ id: '65536', label: 'Chargement des relais...' }
	]

	// Fonction pour mettre à jour la liste des relais
	const updateRelayChoices = async () => {
		try {
			const relays = await self.getRelayList()
			if (relays.length > 0) {
				relayChoices = relays
				// Mettre à jour les définitions de feedbacks avec les nouvelles options
				self.setFeedbackDefinitions(getFeedbackDefinitions())
				self.log('info', `Liste des relais mise à jour pour les feedbacks: ${relays.length} relais trouvés`)
			}
		} catch (error) {
			self.log('error', `Erreur lors de la mise à jour des relais pour les feedbacks: ${error.message}`)
		}
	}

	// Fonction pour obtenir les définitions de feedbacks
	const getFeedbackDefinitions = () => ({
		relay_state: {
			name: 'Relay State',
			type: 'boolean',
			label: 'Relay State',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Relay',
					id: 'relay',
					default: '65536',
					choices: relayChoices,
					minChoicesForSearch: 0,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'ON' },
						{ id: 'off', label: 'OFF' },
					],
				},
			],
			callback: async (feedback) => {
				// Vérifier l'état du relais en interrogeant l'IPX800
				try {
					if (!self.config || !self.config.host || !self.config.apiKey) {
						return false
					}

					const fetch = require('node-fetch')
					const relayId = feedback.options.relay
					const expectedState = feedback.options.state
					const url = `http://${self.config.host}/api/core/io/${relayId}?ApiKey=${self.config.apiKey}`

					const response = await fetch(url, { 
						method: 'GET',
						timeout: 2000 // Timeout court pour les feedbacks
					})

					if (response.ok) {
						const data = await response.json()
						const currentState = data.on ? 'on' : 'off'
						return currentState === expectedState
					}
				} catch (error) {
					self.log('debug', `Erreur lors de la vérification de l'état du relais ${feedback.options.relay}: ${error.message}`)
				}
				return false
			},
		},
		relay_on: {
			name: 'Relay ON (Green when active)',
			type: 'boolean',
			label: 'Relay ON',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Relay',
					id: 'relay',
					default: '65536',
					choices: relayChoices,
					minChoicesForSearch: 0,
				},
			],
			callback: async (feedback) => {
				try {
					if (!self.config || !self.config.host || !self.config.apiKey) {
						return false
					}

					const fetch = require('node-fetch')
					const relayId = feedback.options.relay
					const url = `http://${self.config.host}/api/core/io/${relayId}?ApiKey=${self.config.apiKey}`

					const response = await fetch(url, { 
						method: 'GET',
						timeout: 2000
					})

					if (response.ok) {
						const data = await response.json()
						return data.on === true
					}
				} catch (error) {
					self.log('debug', `Erreur lors de la vérification de l'état ON du relais ${feedback.options.relay}: ${error.message}`)
				}
				return false
			},
		},
		relay_off: {
			name: 'Relay OFF (Red when inactive)',
			type: 'boolean',
			label: 'Relay OFF',
			defaultStyle: {
				bgcolor: combineRgb(128, 128, 128),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Relay',
					id: 'relay',
					default: '65536',
					choices: relayChoices,
					minChoicesForSearch: 0,
				},
			],
			callback: async (feedback) => {
				try {
					if (!self.config || !self.config.host || !self.config.apiKey) {
						return false
					}

					const fetch = require('node-fetch')
					const relayId = feedback.options.relay
					const url = `http://${self.config.host}/api/core/io/${relayId}?ApiKey=${self.config.apiKey}`

					const response = await fetch(url, { 
						method: 'GET',
						timeout: 2000
					})

					if (response.ok) {
						const data = await response.json()
						return data.on === false
					}
				} catch (error) {
					self.log('debug', `Erreur lors de la vérification de l'état OFF du relais ${feedback.options.relay}: ${error.message}`)
				}
				return false
			},
		},
	})

	// Initialiser les définitions de feedbacks avec les choix par défaut
	self.setFeedbackDefinitions(getFeedbackDefinitions())
	
	// Charger la liste des relais de manière asynchrone
	updateRelayChoices()
}