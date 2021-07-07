import runJsDoc from '../lib/jsdoc-runner'
import {dump} from '../lib/util'
import chai from 'chai'
import chaiSubset from 'chai-subset'
import './test-util'
const expect = chai.expect
chai.use(chaiSubset)

describe('docs', function() {
    describe('member docs', function() {
        let jsDocRes
        beforeEach(() => {
            jsDocRes = runJsDoc({
                'include': [
                    'test/service-docs.js'
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


        it('should support docs on the service', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceDocs',
                        location: {filename: 'service-docs.js'},
                        docs: {
                            summary: 'this is a docs test service',
                            description: 'this class is used to test how service docs work',
                            links: ['{@link http://somedomain2.com} a related site']
                        }
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Property propertyWithDocs')
        })

        it('should support docs on a property', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceDocs',
                        properties: [
                            {name: 'propertyWithDocs', get: true, set: false, type: 'string',
                                docs: {
                                    summary: 'the summary for propertyWithDocs',
                                    description: 'the description for propertyWithDocs\nanother line of description',
                                    links: ['aNamespace.ServiceProperties a related service',
                                        '{@link aNamespace.ServiceOperations) another related service',
                                        '{@link http://somedomain.com} a related site'],
                                    examples: [
                                        {title: undefined, body: '// returns 2\nlet z = x.propertyWithDocs;'},
                                        {title: 'the example caption', body: '// returns 3\nlet z = y.propertyWithDocs;'}
                                    ]
                                }
                            }
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Property propertyWithDocs')
        })

        it('should use the docs from the getter for read-write properties', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceDocs',
                        properties: [
                            {name: 'label', get: true, set: true, type: 'string',
                                docs: {
                                    summary: 'summary from the getter',
                                    description: 'desc from the getter',
                                    links: []
                                }
                            }
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Property label')
        })

        it('should support docs on an operation', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceDocs',
                        operations: [
                            {name: 'operationWithDocs',
                                params: [
                                    {name: 'input', type: 'string', doc: 'the input'}
                                ],
                                ret: {type: 'string', doc: 'the return value'},
                                docs: {
                                    summary: 'an operation',
                                    description: 'the description of the operation',
                                    links: []
                                }}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation operationWithDocs')
        })

        it('should support docs on a messages', function() {

            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceDocs',
                        messages: [
                            {
                                name: 'MessageWithDocs',
                                docs: {
                                    summary: 'a Message with docs',
                                    description: 'the description of the message',
                                    links: []
                                },
                                members: [
                                  {name: 'name', type: 'string', doc: 'the name'},
                                  {name: 'age', type: ['string', 'number'], doc: 'the age'}
                                ]
                            }
                        ]
                    }
                ]
            })
        })

    })
})
