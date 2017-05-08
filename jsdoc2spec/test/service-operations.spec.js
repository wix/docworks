import runJsDoc from '../lib/jsdoc-runner';
import {dump} from '../lib/util';
import chai from 'chai';
import chaiSubset from 'chai-subset';
const expect = chai.expect;
chai.use(chaiSubset);

describe('docs', function() {
    describe.only('service operations', function() {
        let jsDocRes;
        beforeEach(() => {
            jsDocRes = runJsDoc({
                "include": [
                    "test/service-operations.js"
                ]
            });
        });

        afterEach(function(){
            if (this.currentTest.state == 'failed') {
                console.log('the jsDocRes:');
                dump(jsDocRes);
            }
        });


        it('should return methods with one parameter', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'oneParam', nameParams: [], params: [
                                {name: 'input', type: 'string'}
                            ], ret: 'void'}
                        ]
                    }
                ]
            });
        });

        it('should return methods with two parameter', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'twoParams', nameParams: [], params: [
                                {name: 'input', type: 'string'},
                                {name: 'input2', type: 'number'}
                            ], ret: 'void'}
                        ]
                    }
                ]
            });
        });

        it('should return a method with a return value', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'returns', nameParams: [], params: [], ret: 'string'}
                        ]
                    }
                ]
            });
        });
    });
});