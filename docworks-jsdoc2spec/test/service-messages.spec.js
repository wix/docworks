import runJsDoc from '../lib/jsdoc-runner'
import {dump} from '../lib/util'
import chai from 'chai'
import chaiSubset from 'chai-subset'
import './test-util'

const expect = chai.expect
chai.use(chaiSubset)

describe('docs', function() {
  describe('service', function() {
    let jsDocRes
    beforeEach(() => {
      jsDocRes = runJsDoc({
        'include': [
          'test/service-messages.js'
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

    it('should report service property of a message type', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            properties: [
              {name: 'prop', get: true, set: false, type: 'aNamespace.ServiceMessages.OutMessage'}
            ]
          }
        ]
      })
    })

    it('should support messages', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            messages: [
              {
                name: 'OutMessage',
                members: [
                  {name: 'name', type: 'string'},
                  {name: 'age', type: ['string', 'number']}
                ]
              },
              {
                name: 'InMessage',
                members: [
                  {name: 'name', type: 'string'},
                  {name: 'age', type: ['string', 'number']}
                ]
              }
            ]
          }
        ]
      })
    })

    it('should support message location', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            messages: [
              {
                name: 'OutMessage',
                locations: [{filename: 'service-messages.js'}]
              },
              {
                name: 'InMessage',
                locations: [{filename: 'service-messages.js'}]
              }
            ]
          }
        ]
      })
    })

    it('should support a function with message types', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            operations: [
              {name: 'operation', nameParams: [], params: [
                {name: 'input', type: 'aNamespace.ServiceMessages.InMessage'}
              ], ret: {type: 'aNamespace.ServiceMessages.OutMessage'}}
            ]
          }
        ]
      })
    })

    it('should support a function with a complex message type', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            operations: [
              {name: 'operationComplex', nameParams: [], params: [
                {name: 'input', type: 'aNamespace.ServiceMessages.ComplexMessage'}
              ], ret: {type: 'void'}}
            ]
          }
        ]
      })
    })

    it('should support a function with a complex message type referenced using aNamespace.ServiceMessages~ComplexMessage', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            operations: [
              {name: 'operationComplex2', nameParams: [], params: [
                {name: 'input', type: 'aNamespace.ServiceMessages.ComplexMessage'}
              ], ret: {type: 'void'}}
            ]
          }
        ]
      })
    })

    it('should support a complex message', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            messages: [
              {
                name: 'ComplexMessage',
                members: [
                  {name: 'in1', type: 'aNamespace.ServiceMessages.InMessage'},
                  {name: 'in2', type: 'aNamespace.ServiceMessages.InMessage'}
                ]
              },
              {
                name: 'InMessage',
                members: [
                  {name: 'name', type: 'string'},
                  {name: 'age', type: ['string', 'number']}
                ]
              }
            ]
          }
        ]
      })
    })

    it('should support a optional members of a message', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            messages: [
              {
                name: 'MessageWithOptionalMembers',
                members: [
                  {name: 'name', type: 'string', doc: 'is mandatory'},
                  {name: 'age', type: ['string', 'number'], doc: 'is optional', optional: true}
                ]
              }
            ]
          }
        ]
      })
    })

    it('should support messages defined using @typedef namespace~message', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            messages: [
              {
                name: 'OtherMessage',
                members: [
                  {name: 'name', type: 'string'},
                  {name: 'age', type: ['string', 'number']}
                ]
              }
            ]
          }
        ]
      })
    })

    it('should report service property of a message type defined as @typedef namespace~message', function() {
      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceMessages',
            properties: [
              {name: 'prop2', get: true, set: false, type: 'aNamespace.ServiceMessages.OtherMessage'}
            ]
          }
        ]
      })
      expect(jsDocRes.errors).to.not.containError('Property prop2')
    })

  })
})
