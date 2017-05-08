import helper from 'jsdoc/util/templateHelper';
import {Service, Operation, Param, Void, JsDocError, Location} from 'swank-model';
import handleProperties from './jsdoc-handler-props';
import handleFunctions from './jsdoc-handler-operations';
import {dump} from './util';



//noinspection JSUnusedGlobalSymbols
export function publish(taffyData, opts) {
    opts.serviceModel.clear();

    let data = helper.prune(taffyData);
    var members = helper.getMembers(data);

    function find(spec) {
        return helper.find(data, spec);
    }

    const onError = (jsDocError) => opts.serviceModel.addError(jsDocError);

    opts.serviceModel.add(members.classes.map(handleService(find, onError)));
}



function handleService(find, onError) {
    return (service) => {
        let operations = handleFunctions(find, service, onError);
        let properties = handleProperties(find, service, onError);
        handleMembers(find)(service, 'namespace');
        handleMembers(find)(service, 'typedef');
        return Service(service.name, properties, operations);
    }
}

function handleMembers(find) {
    return (service, kind) => {
        var members = find({kind: kind, memberof: service.longname});
        if(members) {
            members.forEach(function(mem) {
                console.log('member', mem.kind, mem.longname);
            });
        }
    }
}

