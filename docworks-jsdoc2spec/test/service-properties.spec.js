import runJsDoc from '../lib/jsdoc-runner'
import {dump} from '../lib/util'
import chai from 'chai'
import chaiSubset from 'chai-subset'
const expect = chai.expect
chai.use(chaiSubset)

describe('docs', function() {
  describe('service properties', function() {
    let jsDocRes
    beforeEach(() => {
      jsDocRes = runJsDoc({
        'include': [
          'test/service-properties.js'
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


    it('should support readonly property', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              {name: 'readOnly', get: true, set: false, type: 'string'}
            ]
          }
        ]
      })
      expect(jsDocRes.errors).to.not.containError('Property readOnly')
    })

    it('should not allow writeonly properties', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              {name: 'writeOnly', get: false, set: true, type: 'string'}
            ]
          }
        ],
        errors: [
          {
            message: 'Property writeOnly is a write only property',
            location: 'service-properties.js'
          }
        ]
      })
    })

    it('should merge get and set members declaration into a single property', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              {name: 'label', get: true, set: true, type: 'string'}
            ]
          }
        ]
      })
      expect(jsDocRes.errors).to.not.containError('Property label')
    })

    it('should error on missing type', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              { name: 'missingType', get: false, set: false, type: 'void' }
            ]
          }
        ],
        errors: [
          {
            message: 'Property missingType is missing a type annotation',
            location: 'service-properties.js'
          }
        ]
      })
    })

    it('should error on mismatched type between get and set', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              { name: 'missMatchType', get: true, set: true, type: 'string' }
            ]
          }
        ],
        errors: [
          {
            message: 'Property missMatchType has mismatching types for get (string) and set (number)',
            location: 'service-properties.js'
          }
        ]
      })
    })

    it('should error on duplicate property definition', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              { name: 'dumplicate', get: true, set: true, type: 'string' }
            ]
          }
        ],
        errors: [
          {
            message: 'Property dumplicate is defined two or more times',
            location: 'service-properties.js'
          }
        ]
      })
    })

    it('should error on duplicate 3 times property definition', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              { name: 'dumplicate2', get: true, set: false, type: 'string' }
            ]
          }
        ],
        errors: [
          {
            message: 'Property dumplicate2 is defined two or more times',
            location: 'service-properties.js'
          }
        ]
      })
    })

    it('should support property with a default value', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              {name: 'withDefaultValue', get: true, set: true, type: 'string', defaultValue: 'a default value'}
            ]
          }
        ]
      })
      expect(jsDocRes.errors).to.not.containError('Property withDefaultValue')
    })

    it('should support property with a complex type', function() {

      expect(jsDocRes).to.containSubset({
        services: [
          {
            name: 'ServiceProperties',
            properties: [
              {name: 'complex', get: true, set: true, type: [{name: 'Array', typeParams: ['string']}, {name: 'Array', typeParams: ['number']}]}
            ]
          }
        ]
      })
      expect(jsDocRes.errors).to.not.containError('Property complex')
    })
  })
})
