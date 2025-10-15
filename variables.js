module.exports = function (self) {
	// Vérification que self existe et a les méthodes nécessaires
	if (!self || typeof self.setVariableDefinitions !== 'function') {
		console.error('Invalid self object passed to variables module')
		return
	}

	// Variables for IPX800 V5: 8 relays + 8 digital inputs
	const variables = []
	
	// Variables for 8 relays (R1-R8)
	for (let i = 1; i <= 8; i++) {
		variables.push({
			variableId: `relay_${i}_state`,
			name: `Relay ${i} State`,
		})
	}
	
	// Variables for 8 digital inputs (D1-D8)
	for (let i = 1; i <= 8; i++) {
		variables.push({
			variableId: `input_${i}_state`,
			name: `Digital Input ${i} State`,
		})
	}
	
	// Add general variables
	variables.push(
		{ variableId: 'connection_status', name: 'Connection Status' },
		{ variableId: 'last_command', name: 'Last Command Sent' },
		{ variableId: 'ipx800_host', name: 'IPX800 Host IP' }
	)

	self.setVariableDefinitions(variables)
	
	// Set initial values avec protection
	try {
		const initialValues = {
			connection_status: 'Disconnected',
			ipx800_host: (self.config && self.config.host) ? self.config.host : 'Not configured',
		}
		
		// Initialize all relay and input states to OFF
		for (let i = 1; i <= 8; i++) {
			initialValues[`relay_${i}_state`] = 'OFF'
			initialValues[`input_${i}_state`] = 'OFF'
		}
		
		self.setVariableValues(initialValues)
	} catch (error) {
		console.error('Error setting variable values:', error)
	}
}