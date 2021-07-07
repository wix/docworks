import runJsDoc from '../lib/jsdoc-runner'
import {dump} from '../lib/util'
import chai from 'chai'
import chaiSubset from 'chai-subset'
import './test-util'
const expect = chai.expect
chai.use(chaiSubset)

describe('docs', function() {
    describe('service types', function() {
        let jsDocRes
        beforeEach(() => {
            jsDocRes = runJsDoc({
                'include': [
                    'test/service-unknown-types.js'
                ]
            })
        })

        afterEach(function(){
            if (this.currentTest.state == 'failed') {
                // eslint-disable-next-line no-console
                console.log('the jsDocRes:')
                dump(jsDocRes)
            }
        })


        it('should report error on unknown operation types', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceUnknownTypes',
                        operations: [
                            {name: 'unknownType', nameParams: [], params: [
                                {name: 'unknown', type: 'Unknown1'}
                            ], ret: {type: 'Unknown2'}}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Operation unknownType has an unknown param type Unknown1',
                        location: 'service-unknown-types.js'
                    },
                    {
                        message: 'Operation unknownType has an unknown return type Unknown2',
                        location: 'service-unknown-types.js'
                    }

                ]
            })
        })

        it('should report error on unknown message types', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceUnknownTypes',
                        messages: [
                            {
                                name: 'Type1',
                                members: [
                                    {name: 'unknown', type: 'Unknown1'}
                                ]
                            }
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Message Type1 has an unknown property type Unknown1',
                        location: 'service-unknown-types.js'
                    }

                ]
            })
        })

        it('should not report error on function with full type reference', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceUnknownTypes',
                        operations: [
                            {name: 'typedefFullPath', nameParams: [], params: [
                                {name: 'type2', type: 'aNamespace.ServiceUnknownTypes.Type2'}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
            expect(jsDocRes.errors).to.not.deep.contains('Operation typedefFullPath')
        })

        it('should not report error on function with relative type reference', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceUnknownTypes',
                        operations: [
                            {name: 'typedefRelativePath', nameParams: [], params: [
                                {name: 'type2', type: 'aNamespace.ServiceUnknownTypes.Type2'}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation typedefRelativePath')
        })

        it('should not report error on function with relative type reference', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceUnknownTypes',
                        properties: [
                            {name: 'unknownProperty', get: true, set: false, type: 'Unknown1'}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Property unknownProperty has an unknown type Unknown1',
                        location: 'service-unknown-types.js'
                    }
                ]
            })
        })

        // todo extra types
    })
})
