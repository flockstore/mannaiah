import { Injectable, NotFoundException } from '@nestjs/common'
import { CreateContactDto } from './dto/create-contact.dto'
import { UpdateContactDto } from './dto/update-contact.dto'
import { Contact } from './entities/contact.entity'

@Injectable()
export class ContactsService {
  private contacts: Contact[] = []
  private idCounter = 1

  create(createContactDto: CreateContactDto) {
    const contact: Contact = {
      id: this.idCounter++,
      ...createContactDto,
    }
    this.contacts.push(contact)
    return contact
  }

  findAll() {
    return this.contacts
  }

  findOne(id: number) {
    const contact = this.contacts.find((c) => c.id === id)
    if (!contact) {
      throw new NotFoundException(`Contact with ID ${id} not found`)
    }
    return contact
  }

  update(id: number, updateContactDto: UpdateContactDto) {
    const contactIndex = this.contacts.findIndex((c) => c.id === id)
    if (contactIndex === -1) {
      throw new NotFoundException(`Contact with ID ${id} not found`)
    }
    const updatedContact = {
      ...this.contacts[contactIndex],
      ...updateContactDto,
    }
    this.contacts[contactIndex] = updatedContact
    return updatedContact
  }

  remove(id: number) {
    const contactIndex = this.contacts.findIndex((c) => c.id === id)
    if (contactIndex === -1) {
      throw new NotFoundException(`Contact with ID ${id} not found`)
    }
    const removedContact = this.contacts[contactIndex]
    this.contacts.splice(contactIndex, 1)
    return removedContact
  }
}
