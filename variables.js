module.exports = function (self) {
	// Vérification que self existe et a les méthodes nécessaires
	if (!self || typeof self.setVariableDefinitions !== 'function') {
		console.error('Invalid self object passed to variables module')
		return
	}

	// Generate variables for each relay (1-32)
	const variables = []
	
	for (let i = 1; i <= 32; i++) {
		variables.push({
			variableId: `relay_${i}_state`,
			name: `Relay ${i} State`,
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
		self.setVariableValues({
			connection_status: 'Disconnected',
			ipx800_host: (self.config && self.config.host) ? self.config.host : 'Not configured',
		})
	} catch (error) {
		console.error('Error setting variable values:', error)
	}
}