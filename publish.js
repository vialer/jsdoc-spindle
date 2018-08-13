// Based on the Haruki template.
const fs = require('fs')
const {promisify} = require('util')
const mkdirp = promisify(require('mkdirp'))
var hasOwnProp = Object.prototype.hasOwnProperty

function graft(parentNode, childNodes, parentLongname) {
    childNodes
        .filter(function(element) {
            return (element.memberof === parentLongname)
        })
        .forEach(function(element) {
            var i
            var len
            var thisClass
            var thisEvent
            var thisFunction
            var thisMixin
            var thisNamespace

            if (element.kind === 'namespace') {
                if (!parentNode.namespaces) {
                    parentNode.namespaces = []
                }

                thisNamespace = {
                    access: element.access || '',
                    description: element.description || '',
                    name: element.name,
                    virtual: Boolean(element.virtual)
                };

                parentNode.namespaces.push(thisNamespace);

                graft(thisNamespace, childNodes, element.longname);
            }
            else if (element.kind === 'mixin') {
                if (!parentNode.mixins) {
                    parentNode.mixins = [];
                }

                thisMixin = {
                    access: element.access || '',
                    description: element.description || '',
                    name: element.name,
                    virtual: Boolean(element.virtual)
                };

                parentNode.mixins.push(thisMixin);

                graft(thisMixin, childNodes, element.longname);
            }
            else if (element.kind === 'function') {
                if (!parentNode.functions) {
                    parentNode.functions = []
                }

                thisFunction = {
                    access: element.access || '',
                    description: element.description || '',
                    examples: [],
                    name: element.name,
                    parameters: [],
                    virtual: Boolean(element.virtual),
                };

                parentNode.functions.push(thisFunction);

                if (element.returns) {
                    thisFunction.returns = {
                        description: element.returns[0].description || '',
                        type: element.returns[0].type? (element.returns[0].type.names.length === 1? element.returns[0].type.names[0] : element.returns[0].type.names) : '',
                    };
                }

                if (element.examples) {
                    for (i = 0, len = element.examples.length; i < len; i++) {
                        thisFunction.examples.push(element.examples[i]);
                    }
                }

                if (element.params) {
                    for (i = 0, len = element.params.length; i < len; i++) {
                        thisFunction.parameters.push({
                            name: element.params[i].name,
                            type: element.params[i].type? (element.params[i].type.names.length === 1? element.params[i].type.names[0] : element.params[i].type.names) : '',
                            description: element.params[i].description || '',
                            default: hasOwnProp.call(element.params[i], 'defaultvalue') ? element.params[i].defaultvalue : '',
                            optional: typeof element.params[i].optional === 'boolean'? element.params[i].optional : '',
                            nullable: typeof element.params[i].nullable === 'boolean'? element.params[i].nullable : '',
                        });
                    }
                }
            }
            else if (element.kind === 'member') {
                if (!parentNode.properties) {
                    parentNode.properties = [];
                }
                parentNode.properties.push({
                    access: element.access || '',
                    description: element.description || '',
                    name: element.name,
                    type: element.type? (element.type.length === 1? element.type[0] : element.type) : '',
                    virtual: Boolean(element.virtual),
                });
            }

            else if (element.kind === 'event') {
                if (!parentNode.events) {
                    parentNode.events = [];
                }

                thisEvent = {
                    access: element.access || '',
                    description: element.description || '',
                    examples: [],
                    name: element.name,
                    parameters: [],
                    virtual: Boolean(element.virtual),
                };

                parentNode.events.push(thisEvent)

                if (element.returns) {
                    thisEvent.returns = {
                        type: element.returns.type ? (element.returns.type.names.length === 1 ? element.returns.type.names[0] : element.returns.type.names) : '',
                        description: element.returns.description || ''
                    };
                }

                if (element.examples) {
                    for (i = 0, len = element.examples.length; i < len; i++) {
                        thisEvent.examples.push(element.examples[i])
                    }
                }

                if (element.params) {
                    for (i = 0, len = element.params.length; i < len; i++) {
                        thisEvent.parameters.push({
                            name: element.params[i].name,
                            type: element.params[i].type? (element.params[i].type.names.length === 1? element.params[i].type.names[0] : element.params[i].type.names) : '',
                            description: element.params[i].description || '',
                            default: hasOwnProp.call(element.params[i], 'defaultvalue') ? element.params[i].defaultvalue : '',
                            optional: typeof element.params[i].optional === 'boolean'? element.params[i].optional : '',
                            nullable: typeof element.params[i].nullable === 'boolean'? element.params[i].nullable : ''
                        })
                    }
                }
            }
            else if (element.kind === 'class') {
                if (!parentNode.classes) {
                    parentNode.classes = [];
                }

                thisClass = {
                    access: element.access || '',
                    constructor: {
                        'name': element.name,
                        'description': element.description || '',
                        'parameters': [
                        ],
                        'examples': []
                    },
                    description: element.classdesc || '',
                    extends: element.augments || [],
                    fires: element.fires || '',
                    name: element.name,
                    virtual: Boolean(element.virtual),
                }

                parentNode.classes.push(thisClass);

                if (element.examples) {
                    for (i = 0, len = element.examples.length; i < len; i++) {
                        thisClass.constructor.examples.push(element.examples[i]);
                    }
                }

                if (element.params) {
                    for (i = 0, len = element.params.length; i < len; i++) {
                        thisClass.constructor.parameters.push({
                            name: element.params[i].name,
                            type: element.params[i].type? (element.params[i].type.names.length === 1? element.params[i].type.names[0] : element.params[i].type.names) : '',
                            description: element.params[i].description || '',
                            default: hasOwnProp.call(element.params[i], 'defaultvalue') ? element.params[i].defaultvalue : '',
                            optional: typeof element.params[i].optional === 'boolean'? element.params[i].optional : '',
                            nullable: typeof element.params[i].nullable === 'boolean'? element.params[i].nullable : ''
                        })
                    }
                }

                graft(thisClass, childNodes, element.longname);
           }
    });
}

/**
* @param {TAFFY} data - JSDoc data.
* @param {object} opts - JSDoc options.
*/
exports.publish = async function(data, opts) {
    var docs
    var root = {}

    data({undocumented: true}).remove()
    docs = data().get() // <-- an array of Doclet objects
    graft(root, docs)

    await mkdirp(opts.destination)
    fs.writeFileSync(`${opts.destination}/code.json`, JSON.stringify({docs: docs}, null, 2))
};
