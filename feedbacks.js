const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	// Stockage local des états des relais et inputs
	self.relayStates = {}
	self.inputStates = {}

	// Fonction pour mettre à jour les états des relais et inputs depuis l'IPX800
	async function pollIOStates() {
		try {
			if (!self.config || !self.config.host || !self.config.apiKey) return
			const fetch = require('node-fetch')
			const url = `http://${self.config.host}/api/core/io?ApiKey=${self.config.apiKey}`
			const response = await fetch(url, { method: 'GET', timeout: 2000 })
			if (response.ok) {
				const data = await response.json()
				
				// Filtrer les relais comme avant (filtrage dynamique)
				const relays = data.filter(item => {
					const name = (item.name || '').toLowerCase()
					return name.includes('relay cmd') || 
					       name.includes('relay command') || 
					       (name.includes('relay') && !name.includes('state') && !name.includes('input'))
				})
				relays.forEach(relay => {
					self.relayStates[relay._id] = relay.on ? 'ON' : 'OFF'
				})
				
				// Les 8 digital inputs sont aux positions 17-24 (indépendants des relais)
				const inputs = data.slice(16, 24)
				inputs.forEach(input => {
					self.inputStates[input._id] = input.on ? 'ON' : 'OFF'
				})
				
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
			name: 'Relay Status (Red=ON, Black=OFF)',
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
					choices: Object.keys(self.relayStates).map(id => ({ id, label: `Relay ${id}` })),
					minChoicesForSearch: 0,
				},
			],
			callback: (feedback) => {
				const relayId = feedback.options.relay
				return self.relayStates[relayId] === 'ON'
			},
		},
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
					choices: Object.keys(self.relayStates).map(id => ({ id, label: `Relay ${id}` })),
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
		input_status: {
			name: 'Digital Input Status (Blue=ON, Black=OFF)',
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
					choices: Object.keys(self.inputStates).map(id => ({ id, label: `Input ${id}` })),
					minChoicesForSearch: 0,
				},
			],
			callback: (feedback) => {
				const inputId = feedback.options.input
				return self.inputStates[inputId] === 'ON'
			},
		},
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
					choices: Object.keys(self.inputStates).map(id => ({ id, label: `Input ${id}` })),
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
	})
}