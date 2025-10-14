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
		relay_status: {
			name: 'Relay Status (Red=ON, Black=OFF)',
			type: 'boolean',
			label: 'Relay Status',
			defaultStyle: {
				bgcolor: combineRgb(255, 0, 0), // Rouge quand relais ON
				color: combineRgb(255, 255, 255), // Texte blanc
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
				// Retourne true si le relais est ON (applique le style rouge)
				// Retourne false si le relais est OFF (garde le style par défaut du bouton - noir)
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
						// Retourne true si le relais est ON (affichage rouge)
						return data.on === true
					}
				} catch (error) {
					self.log('debug', `Erreur lors de la vérification de l'état du relais ${feedback.options.relay}: ${error.message}`)
				}
				return false // Par défaut, considère le relais comme OFF
			},
		},
		relay_state: {
			name: 'Relay State Comparison',
			type: 'boolean',
			label: 'Relay State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0), // Vert quand état correspond
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
				{
					id: 'state',
					type: 'dropdown',
					label: 'Expected State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'ON' },
						{ id: 'off', label: 'OFF' },
					],
				},
			],
			callback: async (feedback) => {
				// Retourne true si l'état actuel correspond à l'état attendu
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
						timeout: 2000
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
	})

	// Initialiser les définitions de feedbacks avec les choix par défaut
	self.setFeedbackDefinitions(getFeedbackDefinitions())
	
	// Charger la liste des relais de manière asynchrone
	updateRelayChoices()
}