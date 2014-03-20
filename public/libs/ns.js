var TWRP = {
	ns: function(namespace) {
		var parts = namespace.split('.'),
			current = window;

		for (var i = 0; i < parts.length; i++) {
			var part = parts[i];
			current[part] = current[part] || {};
			current = current[part];
		}
	}
};