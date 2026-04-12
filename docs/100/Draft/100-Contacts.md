# Contacts

## File Identity

- file name: `Contacts`
- file guide: `docs/100/Draft/100-Contacts.md`
- parent guide: `docs/001/Active/001-Files.md`
- file class: `L1`
- canonical entity: `Contacts`
- app-facing label: `Contacts`
- canonical owner identity: `Owner`

## Purpose

`Contacts` stores people and entity profiles.

It exists to keep the address-book layer separate from `Users`, which govern access identities.

## Glossary

| Term | Meaning |
| --- | --- |
| `Contact` | The person or entity profile. |
| `Linked User` | An optional access identity connected to the contact. |
| `Profile Layer` | The file layer for identity information without implying access. |

## Referenced Documents

- `docs/001/Active/001-Files.md`
- `docs/100/Draft/100-Users.md`
- `docs/020/Active/020_File_Steward.md`
- `docs/000-canonical-structure.json`

## Operating Rules

- Treat `Contacts` as the profile layer.
- Do not assume every contact is an access-enabled user.
- Preserve explicit contact-to-user linkage where access exists.

## Ownership

- owner: `Owner`
- steward: `File Steward`
- ownership mode: `root_owned`

## Owner

The `Owner` should use `Contacts` to understand who exists in the system as a person or entity profile.

## File Steward

The `File Steward` should validate that contact structure remains distinct from access and role governance.

## UX Steward

The `UX Steward` should keep it clear when the user is creating a profile versus an access identity.

## Governance

`Contacts` is governed by `Owner`, `File Steward`, and the access-separation rule between profiles and users.

## Provenance / Events

The system should preserve contact creation, linkage changes, and relationship changes to users, companies, projects, and notes.

## File Birth Checklist

- canonical JSON structure exists: `yes`
- `System Files` registry row exists: `yes`
- file guide exists: `yes`, `docs/100/Draft/100-Contacts.md`
- owner is declared: `yes`, `Owner`
- steward is declared: `yes`, `File Steward`
- UX fork questions are declared: `partial`
- `System` requirement is declared: `yes`
- `LDB` requirement is declared: `yes`
- runtime/sqlite ownership is declared: `yes`, table `Contacts`
- shell rendering path is declared: `yes`, route `/contacts`
- events/provenance path is declared: `partial`

## View Fork System

Definition note:

- view forks and subgroups are internal to a file, not separate file rows, unless `System Files` explicitly tracks them as such

### System

Tracks contact identity, creator, datetime, and event linkage.

### General

Tracks contact name and summary/profile fields.

### LDB

Tracks relationships to `Users`, `Companies`, `Projects`, `Notes`, and role-bearing files.

### File Specific

Tracks contact-specific identity and communication fields.

## Open Questions

- Which contact fields should be shared versus file-specific canon?
- Which relationships should be promoted for direct reverse-read behavior?
