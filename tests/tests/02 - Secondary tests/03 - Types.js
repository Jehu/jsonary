var exampleData = {
	"important_key": "B"
};

var exampleTypeA = {
	"title": "Schema A",
	"type": "object",
	"properties": {
		"important_key": {
			"enum": ["A"]
		},
	}
}

var exampleTypeB = {
	"title": "Schema B",
	"type": "object",
	"properties": {
		"important_key": {
			"enum": ["B"]
		},
	}
}

var exampleSchema = {
	"type": [
	exampleTypeA,
	exampleTypeB, "string"]
};

tests.add("Listing available types", function () {
	var data = Jsonary.create(exampleData);
	var schema = Jsonary.createSchema(exampleSchema);
	data.addSchema(schema);
	var schemas = data.schemas();
	var types = schema.types();
	this.assert(types.length == 3, "types.length should be 3, was " + JSON.stringify(types.length));
	return true;
});

tests.add("Validating a schema with types", function () {
	var thisTest = this;
	var data = Jsonary.create(exampleData);
	var schema = Jsonary.createSchema(exampleSchema);
	var callbackCount = 0;
	var lastMatch = null;
	var lastFailReason = null;
	var failReasons = [];

	var schemaKey = Jsonary.getMonitorKey();
	data.addSchemaMatchMonitor(schemaKey, schema, function (match, failReason) {
		callbackCount++;
		lastMatch = match;
		lastFailReason = failReason;
		failReasons.push(failReason);
	});
	thisTest.assert(callbackCount === 1, "callbackCount == 1");
	thisTest.assert(lastMatch === true, "initial match should be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.property("important_key").setValue(1);
	thisTest.assert(callbackCount === 2, "callbackCount == 2");
	thisTest.assert(lastMatch === false, "second match should be false, was " + JSON.stringify(lastMatch));

	data.setValue("some string");
	thisTest.assert(lastMatch === true, "third match should be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);
	thisTest.assert(callbackCount === 3, "callbackCount should be 3, was " + callbackCount);

	data.setValue({
		"important_key": "B"
	});
	thisTest.assert(callbackCount === 3, "callbackCount == 3 (no change)");
	thisTest.assert(lastMatch === true, "third match should still be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.setValue({
		"important_key": "X"
	});
	thisTest.assert(callbackCount === 4, "callbackCount == 4");
	thisTest.assert(lastMatch === false, "fourth match should be false, was " + JSON.stringify(lastMatch));

	data.setValue({
		"important_key": false
	});
	thisTest.assert(callbackCount === 4, "callbackCount == 4 (no change)");
	thisTest.assert(lastMatch === false, "fourth match should still be false, was " + JSON.stringify(lastMatch));

	data.property("important_key").setValue("A");
	thisTest.assert(callbackCount === 5, "callbackCount == 5");
	thisTest.assert(lastMatch === true, "fifth match should be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	return true;
});

tests.add("Validating a different schema with types, because I can't quite believe that just worked", function () {
	var thisTest = this;
	var schema = Jsonary.createSchema({
		"type": "object",
		"properties": {
			"switchContainer": {
				"type": [{
					"properties": {
						"switch": {
							"enum": [true]
						},
						"text": {
							"enum": ["true"]
						}
					}
				}, {
					"properties": {
						"switch": {
							"enum": [false]
						},
						"text": {
							"enum": ["false"]
						}
					}
				}],
				"properties": {
					"switch": {
						"type": "boolean"
					},
					"text": {
						"type": "string"
					}
				},
				"extends": {
					"type": "object"
				}
			}
		}
	});
	var data = Jsonary.create({
		"switchContainer": {
			"switch": true,
			"text": "maybe"
		}
	});

	var callbackCount = 0;
	var lastMatch = null;
	var lastFailReason = null;
	var schemaKey = Jsonary.getMonitorKey();
	data.addSchemaMatchMonitor(schemaKey, schema, function (match, failReason) {
		callbackCount++;
		lastMatch = match;
		lastFailReason = failReason;
	});

	thisTest.assert(callbackCount === 1, "callbackCount == 1, was " + callbackCount);
	thisTest.assert(lastMatch === false, "first match should be false, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	// Could count as the same error, or a different one
	if (callbackCount === 1) {
		callbackCount = 2;
	}
	data.property("switchContainer").property("switch").setValue(false);
	thisTest.assert(callbackCount === 2, "callbackCount == 2, was " + callbackCount);
	thisTest.assert(lastMatch === false, "second match should be false, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	// Could count as the same error, or a different one
	if (callbackCount === 2) {
		callbackCount = 3;
	}
	data.property("switchContainer").property("text").setValue("true");
	thisTest.assert(callbackCount === 3, "callbackCount == 3, was " + callbackCount);
	thisTest.assert(lastMatch === false, "third match should be false, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.property("switchContainer").property("switch").setValue(true);
	thisTest.assert(callbackCount === 4, "callbackCount == 4, was " + callbackCount);
	thisTest.assert(lastMatch === true, "fourth match should be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.property("switchContainer").property("switch").setValue(false);
	thisTest.assert(callbackCount === 5, "callbackCount == 5, was " + callbackCount);
	thisTest.assert(lastMatch === false, "fifth match should be false, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.property("switchContainer").removeProperty("text");
	thisTest.assert(callbackCount === 6, "callbackCount == 6, was " + callbackCount);
	thisTest.assert(lastMatch === true, "sixth match should be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.property("switchContainer").property("text").setValue("false");
	thisTest.assert(callbackCount === 6, "callbackCount == 6 (still), was " + callbackCount);
	thisTest.assert(lastMatch === true, "seventh match should be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	data.property("switchContainer").removeProperty("switch");
	thisTest.assert(callbackCount === 6, "callbackCount == 6, was " + callbackCount);
	thisTest.assert(lastMatch === true, "eighth match should still be true, was " + JSON.stringify(lastMatch) + ": " + lastFailReason);

	return true;
});