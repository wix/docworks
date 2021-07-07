import runJsDoc from '../lib/jsdoc-runner'
import {dump} from '../lib/util'
import chai from 'chai'
import chaiSubset from 'chai-subset'
import './test-util'
const expect = chai.expect
chai.use(chaiSubset)

chai.Assertion.addMethod('onlyCountOfErrorsWith', function (num, errorText) {
    let errors = this._obj
    let errorsWithText = errors.filter(_ => _.message.indexOf(errorText) > -1)
    let errorsWithTextNum = errorsWithText.length
    let match = errorsWithTextNum === num
    this.assert(
      match
      , `expected errors to have ${num} errors containing '${errorText}' but got ${errorsWithTextNum}
Errors: [
  ${errorsWithText.map(_ => `${JSON.stringify(_)}`).join(',\n  ')} ]`
      , `expected errors to not have ${num} errors containing ${errorText}
Errors: [
  ${errorsWithText.map(_ => `${JSON.stringify(_)}`).join(',\n  ')} ]`
      , num        // expected
      , errorsWithText   // actual
    )
})

describe('docs', function() {
    describe('service operations', function() {
        let jsDocRes
        beforeEach(() => {
            jsDocRes = runJsDoc({
                'include': [
                    'test/service-operations.js'
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


        it('should return methods with one parameter', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'oneParam', nameParams: [], params: [
                                {name: 'input', type: 'string'}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation oneParam')
        })

        it('should return method location', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'oneParam', locations: [{filename: 'service-operations.js'}]}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation oneParam')
        })

        it('should return methods with two parameter', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'twoParams', nameParams: [], params: [
                                {name: 'input', type: 'string'},
                                {name: 'input2', type: 'number'}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation twoParams')
        })

        it('should return a method with a return value', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'returns', nameParams: [], params: [], ret: {type: 'string'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation returns')
        })

        it('should return a method with an array return value', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'returnsArray', nameParams: [], params: [], ret: {type: {name: 'Array', typeParams: ['string']}}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation returnsArray')
        })

        it('should return a method with a promise return value', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'returnsPromise', nameParams: [], params: [], ret: {type: {name: 'Promise', typeParams: ['string']}}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation returnsPromise')
        })

        it('should return a method with a promise return void', function() {
        expect(jsDocRes).to.containSubset({
          services: [
            {
              name: 'ServiceOperations',
              operations: [
                {name: 'promiseVoid', nameParams: [], params: [], ret: {type: {name: 'Promise', typeParams: ['void']}}}
              ]
            }
          ]
        })
        expect(jsDocRes.errors).to.not.containError('Operation promiseVoid')
      })

        it('should error on multiple returns', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'multipleReturns', nameParams: [], params: [], ret: {type: 'string'}}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Operation multipleReturns has multiple returns annotations',
                        location: 'service-operations.js'
                    }
                ]
            })
            expect(jsDocRes.errors).to.have.onlyCountOfErrorsWith(1, 'Operation multipleReturns')
        })

        it('should error on duplicate operation', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'duplicate', nameParams: [], params: [], ret: {type: 'string'}}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Operation duplicate is defined two or more times',
                        location: 'service-operations.js'
                    }
                ]
            })
            expect(jsDocRes.errors).to.have.onlyCountOfErrorsWith(1, 'Operation duplicate')
        })

        it('should error on returns without type', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'brokenReturns1', nameParams: [], params: [], ret: {type: 'void'}}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Operation brokenReturns1 has return description but no type. Did you forget the {} around the type?',
                        location: 'service-operations.js'
                    }
                ]
            })
            expect(jsDocRes.errors).to.have.onlyCountOfErrorsWith(1, 'Operation brokenReturns1')
        })

        it('should error on returns without type or description', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'brokenReturns2', nameParams: [], params: [], ret: {type: 'void'}}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Operation brokenReturns2 has return without description or type',
                        location: 'service-operations.js'
                    }
                ]
            })
            expect(jsDocRes.errors).to.have.onlyCountOfErrorsWith(1, 'Operation brokenReturns2')
        })

        it('should error on a param without type', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'brokenParam', nameParams: [], params: [{'name': 'param', 'type': 'void'}], ret: {type: 'void'}}
                        ]
                    }
                ],
                errors: [
                    {
                        message: 'Operation brokenParam param param has a name but no type. Did you forget the {} around the type?',
                        location: 'service-operations.js'
                    }
                ]
            })
            expect(jsDocRes.errors).to.have.onlyCountOfErrorsWith(1, 'Operation brokenParam')
        })

        it('should support optional param', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'optional', nameParams: [], params: [
                                {name: 'param', type: 'string', optional: true}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation optional')
        })

        it('should support optional param with default value', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'defaultValue', nameParams: [], params: [
                                {name: 'param', type: 'string', optional: true, defaultValue:'default'}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation defaultValue')
        })

        it('should support varargs param', function() {
            expect(jsDocRes).to.containSubset({
                services: [
                    {
                        name: 'ServiceOperations',
                        operations: [
                            {name: 'varargs', nameParams: [], params: [
                                {name: 'param', type: 'string', spread: true}
                            ], ret: {type: 'void'}}
                        ]
                    }
                ]
            })
          expect(jsDocRes.errors).to.not.containError('Operation varargs')
        })

    })
})
