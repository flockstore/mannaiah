import { BaseDocument } from '../../../core/mongo/schemas/base.schema'

/**
 * Document type enum representing types of identification documents
 */
export enum DocumentType {
    /** Cédula de Ciudadanía */
    CC = 'CC',
    /** Cédula de Extranjería */
    CE = 'CE',
    /** Tarjeta de Identidad */
    TI = 'TI',
    /** Pasaporte */
    PAS = 'PAS',
    /** Número de Identificación Tributaria */
    NIT = 'NIT',
    /** Otro tipo de documento */
    OTHER = 'OTHER',
}

/**
 * Contact document interface representing a legal or natural entity
 */
export interface ContactDocument extends BaseDocument {
    /** Document type (CC, CE, TI, PAS, NIT, OTHER) */
    documentType: DocumentType

    /** Document number (digits only) */
    documentNumber: string

    /** Legal name (for entities with NIT) */
    legalName?: string

    /** First name (for natural persons) */
    firstName?: string

    /** Last name (for natural persons) */
    lastName?: string

    /** Main contact email */
    email: string

    /** Main contact phone number */
    phone?: string

    /** Main physical address */
    address?: string

    /** Address complement (apartment, floor, etc.) */
    addressExtra?: string

    /** City or town code (e.g., DANE code) */
    cityCode?: string
}

/**
 * DTO for creating a new contact
 */
export interface CreateContactDto {
    documentType: DocumentType
    documentNumber: string
    legalName?: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
    address?: string
    addressExtra?: string
    cityCode?: string
}

/**
 * DTO for updating an existing contact
 */
export interface UpdateContactDto {
    documentType?: DocumentType
    documentNumber?: string
    legalName?: string
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    addressExtra?: string
    cityCode?: string
}
