var amcnMVPDConfig = {
	// prevents multiple generations of picker
	addOnce: false,
	network: 'IFC',

	promotedlist : [
		'ATT',
		'Brighthouse',
		'Charter_Direct',
		'Cox',
		'Cablevision',
		'TWC',
		'Comcast_SSO',
		'Verizon',
		'DTV'
	],

	whitelist : [
		'ATT',
		'Brighthouse',
		'Charter',
		'Charter_Direct',
		'Cox',
		'Cablevision',
		'TWC',
		'Comcast_SSO',
		'Verizon',
		'auth_cableone_net',
		'CableOne',
		'Suddenlink',
		'Mediacom',
		'lus-fiber',
		'bektel',
		'liberty-cable',
		'msauth_midco_net',
		'auth_hawaiiantel_net',
		'DTV',
		'randolph',
		'farmerstel',
		'valunet',
		'swiftel',
		'sony_auth-gateway_net',
		'auth_metrocast_net',
		'nwcable_auth-gateway_net',
		'Grande',
		'plateau',
		'RCN',
		'consolidated_auth-gateway_net',
		'hotwirecommunications_auth-gateway_net',
		'intrmtncable',
		'grafton',
		'HTC',
		'service-electric',
		'Bend',
		'hbc_auth-gateway_net',
		'serviceelectric_auth-gateway_net',
		'gvtc_auth-gateway_net',
		'FRONTIER',
		'auth_atlanticbb_net',
		'googlefiber_auth-gateway_net',
		'tds_auth-gateway_net'
	],

	// This sets a new 'alphaName' Property for each provider.
	// That property should correspond to the image associated with each Provider's service.
	// For example, Adobe is represented graphically as 'Adobe'. However, Comcast is represented as 'Xfinity'.
	// The new property is then used to sort the list alphabetically.
	alphaNames : {
		'Comcast_SSO':'Comcast XFINITY',
		'Cablevision':'Optimum',
		'lus-fiber': 'LUS Fiber',
		'bektel': 'BEK Communications',
		'auth_cableone_net': 'Cable One',
		'liberty-cable': 'Liberty Cablevision of PR',
		'msauth_midco_net': 'Midcontinent Communications',
		'auth_hawaiiantel_net': 'Hawaiian Telcom',
		'DTV': 'DirecTV',
		'randolph': 'Randolph Communications',
		'farmerstel': 'FTCtv',
		'valunet': 'ValuNet',
		'swiftel': 'Swiftel',
		'sony_auth-gateway_net': 'PlayStation Vue',
		'auth_metrocast_net': 'MetroCast',
		'nwcable_auth-gateway_net': 'NewWave Communications',
		'Grande': 'Grande Communications',
		'consolidated_auth-gateway_net': 'Consolidated Communications',
		'plateau': 'Plateau Telecommunications',
		'hotwirecommunications_auth-gateway_net': 'Hotwire Communications',
		'intrmtncable': 'Inter Mountain Cable',
		'grafton': 'GTI TV',
		'HTC': 'HTC Digital Cable',
		'Bend': 'BendBroadband',
		'service-electric': 'Service Electric Cable &amp; Communications',
		'hbc_auth-gateway_net': 'HBC',
		'serviceelectric_auth-gateway_net': 'Service Electric Cablevision',
		'gvtc_auth-gateway_net':'GVTC',
		'auth_atlanticbb_net': 'Atlantic Broadband',
		'googlefiber_auth-gateway_net': 'Google Fiber',
		'tds_auth-gateway_net': 'TDS'
	},

	displayNames : {
		'TWC': 'Time Warner Cable',
		'Cable One': 'Cable ONE',
		'Brighthouse': 'Bright House Networks',
		'Charter': 'Charter Spectrum',
		'PlayStation Vue': 'PlayStation&trade; Vue',
		'service-electric': 'Service Electric Cable &amp; Communications',
		'Bend': 'BendBroadband',
		'hbc_auth-gateway_net': 'HBC',
		'Randolph Telephone': 'Randolph Communications',
		'Frontier Communications': 'FRONTIER',
		'tds_auth-gateway_net': 'TDS'
	}
};
