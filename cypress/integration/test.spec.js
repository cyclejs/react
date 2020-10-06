/// <reference types="cypress" />

const { watchFile } = require("fs")

context('Page load', () => {
  beforeEach(() => {
    cy.visit('/')
    cy.wait(1000)
  })
  describe('React integration', () => {

    it('Should mount', () => {
      cy.get('#app')
        .should('exist', 'success')
    })
    it('Should have foo property on button', () => {
      cy.get('.clicker')
        // .its('foo')
        // .should('eq', 3)
        .then(($el) => {
          const el = $el[0]
          cy.wrap(el.foo).should('eq', 3)
        })
    })
    it('Should allow toggling className items based on domClass prop', () => {
      cy.get('.clicker')
        .then(($el) => {
          cy.wrap($el[0].className).should('eq', 'clicker hello')
        })
    })
    it('Should return element when ref function is sent', () => {
      cy.get('h1')
        .then(($el) => {
          const el = $el[0]
          cy.wrap(el.foo).should('eq', 'bar')
        })
    })
  })
})
