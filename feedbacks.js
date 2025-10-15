const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	// Stockage local des états des relais et inputs
	self.relayStates = {}
	self.inputStates = {}
	self.relayChoices = []
	self.inputChoices = []

	// Fonction pour mettre à jour les états des relais et inputs depuis l'IPX800
	async function pollIOStates() {
		try {
			if (!self.config || !self.config.host || !self.config.apiKey) return
			const fetch = require('node-fetch')
			const url = `http://${self.config.host}/api/core/io?ApiKey=${self.config.apiKey}`
			const response = await fetch(url, { method: 'GET', timeout: 2000 })
			if (response.ok) {
				const data = await response.json()
				
				// Les 8 premiers éléments (positions 0-7) sont les relais de commande
				// Tri par position uniquement (pas de filtre par nom)
				const relays = data.slice(0, 8)
				self.relayChoices = relays.map((relay, index) => ({
					id: relay._id.toString(),
					label: `${relay.name} (id:${relay._id} / R:${index + 1})`
				}))
				
				// Update relay states and variables
				const relayVariables = {}
				relays.forEach((relay, index) => {
					const state = relay.on ? 'ON' : 'OFF'
					self.relayStates[relay._id] = state
					relayVariables[`relay_${index + 1}_state`] = state
				})
				
				// Les 8 digital inputs sont aux positions 17-24 (index 16-23)
				const inputs = data.slice(16, 24)
				self.inputChoices = inputs.map((input, index) => ({
					id: input._id.toString(),
					label: `${input.name} (id:${input._id} / D:${index + 1})`
				}))
				
				// Update input states and variables
				const inputVariables = {}
				inputs.forEach((input, index) => {
					const state = input.on ? 'ON' : 'OFF'
					self.inputStates[input._id] = state
					inputVariables[`input_${index + 1}_state`] = state
				})
				
				// Update all variables at once
				self.setVariableValues({ ...relayVariables, ...inputVariables })
				
				self.checkFeedbacks && self.checkFeedbacks()
			}
		} catch (error) {
			self.log('debug', `Polling error: ${error.message}`)
		}
	}

	// Polling régulier toutes les 500ms
	if (!self._ioPollInterval) {
		self._ioPollInterval = setInterval(pollIOStates, 500)
	}
	await pollIOStates()

	// Feedbacks utilisant l'état local
	self.setFeedbackDefinitions({
		relay_status: {
			name: 'Relay Status (Default: Red=ON, Black=OFF)',
			type: 'boolean',
			label: 'Relay Status',
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
					choices: self.relayChoices.length > 0 ? self.relayChoices : [{ id: '65536', label: 'Loading...' }],
					minChoicesForSearch: 0,
				},
			],
			callback: (feedback) => {
				const relayId = feedback.options.relay
				return self.relayStates[relayId] === 'ON'
			},
		},
		// Feedbacks de comparaison commentés (non visibles pour les utilisateurs)
		/*
		relay_state: {
			name: 'Relay State Comparison',
			type: 'boolean',
			label: 'Relay State',
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
					choices: self.relayChoices.length > 0 ? self.relayChoices : [{ id: '65536', label: 'Loading...' }],
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
			callback: (feedback) => {
				const relayId = feedback.options.relay
				const expectedState = feedback.options.state === 'on' ? 'ON' : 'OFF'
				return self.relayStates[relayId] === expectedState
			},
		},
		*/
		input_status: {
			name: 'Digital Input Status (Default: Blue=ON, Black=OFF)',
			type: 'boolean',
			label: 'Input Status',
			defaultStyle: {
				bgcolor: combineRgb(0, 100, 255),
				color: combineRgb(255, 255, 255),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Digital Input',
					id: 'input',
					default: '65552',
					choices: self.inputChoices.length > 0 ? self.inputChoices : [{ id: '65552', label: 'Loading...' }],
					minChoicesForSearch: 0,
				},
			],
			callback: (feedback) => {
				const inputId = feedback.options.input
				return self.inputStates[inputId] === 'ON'
			},
		},
		/*
		input_state: {
			name: 'Digital Input State Comparison',
			type: 'boolean',
			label: 'Input State',
			defaultStyle: {
				bgcolor: combineRgb(0, 255, 0),
				color: combineRgb(0, 0, 0),
			},
			options: [
				{
					type: 'dropdown',
					label: 'Digital Input',
					id: 'input',
					default: '65552',
					choices: self.inputChoices.length > 0 ? self.inputChoices : [{ id: '65552', label: 'Loading...' }],
					minChoicesForSearch: 0,
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'Expected State',
					default: 'on',
					choices: [
						{ id: 'on', label: 'ON (True)' },
						{ id: 'off', label: 'OFF (False)' },
					],
				},
			],
			callback: (feedback) => {
				const inputId = feedback.options.input
				const expectedState = feedback.options.state === 'on' ? 'ON' : 'OFF'
				return self.inputStates[inputId] === expectedState
			},
		},
		*/
	})
}