const { combineRgb } = require('@companion-module/base')

module.exports = async function (self) {
	self.setFeedbackDefinitions({
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
					id: 'relay',
					type: 'number',
					label: 'Relay Number',
					default: 1,
					min: 1,
					max: 32,
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
			callback: (feedback) => {
				// This would require polling the IPX800 status to provide accurate feedback
				// For now, return false as we don't have state tracking implemented
				return false
			},
		},
	})
}