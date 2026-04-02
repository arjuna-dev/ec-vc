<template>
  <q-page class="q-pa-md">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        Record View requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but the preload bridge is missing (<code>window.ecvc</code> not
        available).
      </q-banner>
    </div>

    <div v-else class="databook-page">
      <div
        v-if="!isStructuredDatabookView"
        class="databook-heading"
        :class="{ 'databook-heading--compact': isStructuredDatabookView }"
      >
        <div class="databook-heading__main">
          <div>
            <div class="databook-heading__eyebrow">{{ entityLabel }} record view</div>
            <template v-if="isContactView">
              <div class="databook-heading__subtitle">
                Version history and edit controls for this contact record.
              </div>
            </template>
            <template v-else-if="isCompanyView">
              <div class="databook-heading__subtitle">
                Version history and edit controls for this company record.
              </div>
            </template>
            <template v-else>
              <div class="databook-heading__title">{{ databookTitle }}</div>
              <div class="databook-heading__subtitle">
                Review the full record, make edits in one place, and save a new audited snapshot.
              </div>
            </template>
          </div>
        </div>

        <div class="databook-heading__actions">
          <q-btn
            v-if="backLink"
            flat
            no-caps
            icon="arrow_back"
            class="databook-heading__back databook-heading__action"
            label="Back"
            @click="handleBackNavigation"
          />

          <q-btn-dropdown
            no-caps
            unelevated
            class="databook-heading__action databook-heading__action--versions"
            label="Versions"
            :disable="loading || saving || !hasVersionBridge"
          >
            <q-list style="min-width: 260px">
              <q-item clickable v-close-popup @click="switchToLatestVersion">
                <q-item-section>
                  <q-item-label>Latest</q-item-label>
                  <q-item-label caption>Current editable record</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-for="v in versions" :key="v.id" clickable v-close-popup @click="openVersion(v.id)">
                <q-item-section>
                  <q-item-label>{{ v.created_at }}</q-item-label>
                  <q-item-label caption>by {{ v.created_by_label || 'Unknown editor' }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn
            no-caps
            unelevated
            class="databook-heading__action databook-heading__action--edit"
            :icon="editMode ? 'close' : 'edit'"
            :label="editMode ? 'Close edit' : 'Edit'"
            :disable="loading || saving || !fields.length || isHistoricalMode"
            @click="editMode ? cancelEdit() : enterEditMode()"
          />
        </div>
      </div>

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

        <template v-if="fields.length">
        <div v-if="isContactView" class="contact-databook">
          <section
            ref="contactHeroRef"
            class="contact-databook__hero"
            :style="contactHeroStyle"
            @pointerenter="startContactHeroPointerTracking"
            @pointermove="onContactHeroPointerMove"
          >
            <div class="contact-databook__hero-main">
              <figure
                class="contact-databook__portrait"
                :class="{ 'contact-databook__portrait--initials-only': !hasContactCustomImage }"
              >
                <img
                  v-if="hasContactCustomImage"
                  class="contact-databook__portrait-image"
                  :src="contactAvatarImage"
                  :alt="contactName || 'Contact portrait'"
                />
                <div v-else class="contact-databook__portrait-placeholder" aria-hidden="true">
                  <div
                    class="contact-databook__portrait-placeholder-initials"
                    :style="{ backgroundColor: contactAvatarColor }"
                  >
                    {{ contactInitials }}
                  </div>
                </div>
                <div class="contact-databook__portrait-actions">
                  <q-btn
                    round
                    dense
                    size="sm"
                    unelevated
                    icon="edit"
                    class="contact-databook__portrait-action"
                    :loading="uploadingContactImage"
                    :disable="saving || !contactImageField"
                  >
                    <q-menu
                      anchor="bottom right"
                      self="top right"
                      class="contact-databook__portrait-menu"
                    >
                      <q-list dense style="min-width: 168px">
                        <q-item clickable v-close-popup @click="triggerContactImagePicker">
                          <q-item-section avatar>
                            <q-icon name="image" />
                          </q-item-section>
                          <q-item-section>Change image</q-item-section>
                        </q-item>
                        <q-item
                          clickable
                          v-close-popup
                          :disable="!hasContactCustomImage"
                          @click="removeContactImage"
                        >
                          <q-item-section avatar>
                            <q-icon name="delete" />
                          </q-item-section>
                          <q-item-section>Delete image</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                    <q-tooltip>Change image</q-tooltip>
                  </q-btn>
                </div>
              </figure>

              <div class="contact-databook__hero-copy">
                <h1 class="contact-databook__name">
                  {{ contactName || 'Unnamed contact' }}
                </h1>
                <div class="contact-databook__role">
                  {{ contactRoleCompany || 'Role and company not added yet' }}
                </div>
                <div class="contact-databook__role contact-databook__role--location">
                  {{ contactLocation || 'Add country base' }}
                </div>

                <div v-if="contactHeroPills.length" class="contact-databook__pill-row">
                  <q-badge
                    v-for="pill in contactHeroPills"
                    :key="pill.label"
                    class="contact-databook__pill"
                  >
                    {{ pill.label }}
                  </q-badge>
                </div>

                <div v-if="contactActionLinks.length" class="contact-databook__actions">
                  <q-btn
                    v-for="link in contactActionLinks"
                    :key="link.label"
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="contact-databook__action"
                    :href="link.href"
                    :target="link.external ? '_blank' : undefined"
                    :rel="link.external ? 'noopener noreferrer' : undefined"
                  >
                    <q-icon :name="link.icon" size="16px" class="q-mr-sm" />
                    <span>{{ link.label }}</span>
                  </q-btn>
                </div>

                <div class="contact-databook__hero-notes-panel">
                  <div class="contact-databook__hero-tabs" role="tablist" aria-label="Contact context">
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': contactHeroPanelTab === 'notes' }"
                      @click="contactHeroPanelTab = 'notes'"
                    >
                      Latest notes
                    </button>
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': contactHeroPanelTab === 'documents' }"
                      @click="contactHeroPanelTab = 'documents'"
                    >
                      Related documents
                    </button>
                  </div>

                  <ul
                    v-if="contactHeroPanelTab === 'notes' && contactHeroNotes.length"
                    class="contact-databook__hero-notes"
                  >
                    <li
                      v-for="note in contactHeroNotes"
                      :key="note.id"
                      class="contact-databook__hero-note"
                    >
                      <div class="contact-databook__notes-row">
                        <div class="contact-databook__notes-title">{{ note.title }}</div>
                        <div class="contact-databook__notes-meta">{{ note.created_at }}</div>
                      </div>
                      <div v-if="note.content" class="contact-databook__notes-content">
                        {{ note.content }}
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="contactHeroPanelTab === 'notes'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No notes yet.
                  </div>

                  <ul
                    v-if="contactHeroPanelTab === 'documents' && contactHeroDocuments.length"
                    class="contact-databook__hero-documents"
                  >
                    <li class="contact-databook__hero-document-drop">
                      <div
                        class="contact-databook__hero-dropzone"
                        :class="{
                          'contact-databook__hero-dropzone--active': contactDocumentsDragOver,
                          'contact-databook__hero-dropzone--loading': uploadingContactDocuments,
                        }"
                        @dragover.prevent="contactDocumentsDragOver = true"
                        @dragleave.prevent="contactDocumentsDragOver = false"
                        @drop.prevent="onContactDocumentsDrop"
                      >
                        <q-icon
                          :name="uploadingContactDocuments ? 'sync' : 'upload_file'"
                          class="contact-databook__hero-dropzone-icon"
                        />
                        <div class="contact-databook__hero-dropzone-copy">
                          {{ uploadingContactDocuments ? 'Uploading documents...' : 'Drop files here to attach them' }}
                        </div>
                      </div>
                    </li>
                    <li
                      v-for="document in contactHeroDocuments"
                      :key="document.id"
                      class="contact-databook__hero-document"
                      :class="{
                        'contact-databook__hero-document--loading':
                          activeDocumentActionKey === `${document.artifactId}:preview`,
                      }"
                      tabindex="0"
                      @click="previewContactDocument(document)"
                      @keyup.enter.prevent="previewContactDocument(document)"
                    >
                      <div class="contact-databook__hero-document-thumb">
                        <img
                          v-if="document.thumbnailSrc"
                          :src="document.thumbnailSrc"
                          :alt="document.fileName"
                          class="contact-databook__hero-document-thumb-image"
                        />
                        <template v-else>
                          <q-icon
                            :name="document.thumbnailIcon"
                            class="contact-databook__hero-document-thumb-icon"
                          />
                          <div class="contact-databook__hero-document-thumb-ext">
                            {{ document.thumbnailLabel }}
                          </div>
                        </template>
                      </div>
                      <div class="contact-databook__hero-document-copy">
                        <div class="contact-databook__hero-document-meta">
                          <div class="contact-databook__hero-document-name">{{ document.fileName }}</div>
                          <div class="contact-databook__hero-document-date">{{ document.created_at }}</div>
                          <div v-if="document.fileTypeLabel" class="contact-databook__hero-document-type">
                            {{ document.fileTypeLabel }}
                          </div>
                        </div>
                        <div class="contact-databook__hero-document-actions">
                          <q-btn
                            flat
                            no-caps
                            dense
                            size="sm"
                            icon="download"
                            class="contact-databook__hero-document-action"
                            :loading="activeDocumentActionKey === `${document.artifactId}:download`"
                            @click.stop="downloadContactDocument(document)"
                          >
                            <span>Download</span>
                          </q-btn>
                          <q-btn
                            flat
                            no-caps
                            dense
                            size="sm"
                            icon="share"
                            class="contact-databook__hero-document-action"
                            :loading="activeDocumentActionKey === `${document.artifactId}:share`"
                            @click.stop="shareContactDocument(document)"
                          >
                            <span>Share</span>
                          </q-btn>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="contactHeroPanelTab === 'documents'"
                    class="contact-databook__hero-documents-state"
                  >
                    <div
                      class="contact-databook__hero-dropzone"
                      :class="{
                        'contact-databook__hero-dropzone--active': contactDocumentsDragOver,
                        'contact-databook__hero-dropzone--loading': uploadingContactDocuments,
                      }"
                      @dragover.prevent="contactDocumentsDragOver = true"
                      @dragleave.prevent="contactDocumentsDragOver = false"
                      @drop.prevent="onContactDocumentsDrop"
                    >
                      <q-icon
                        :name="uploadingContactDocuments ? 'sync' : 'upload_file'"
                        class="contact-databook__hero-dropzone-icon"
                      />
                      <div class="contact-databook__hero-dropzone-copy">
                        {{
                          uploadingContactDocuments
                            ? 'Uploading documents...'
                            : 'Drop files here to attach them to this contact'
                        }}
                      </div>
                    </div>
                    <div class="contact-databook__hero-panel-empty">No related documents yet.</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="contact-databook__summary">
              <div class="contact-databook__summary-header">
                <div class="contact-databook__summary-label">Contact Feed</div>
              </div>

              <div class="contact-databook__summary-feed-toggle">
                <div class="contact-databook__summary-feed-toolbar">
                  <button
                    v-for="option in contactFeedChannelOptions"
                    :key="option.value"
                    type="button"
                    class="contact-databook__summary-feed-button"
                    :class="{ 'contact-databook__summary-feed-button--active': contactFeedChannel === option.value }"
                    @click="contactFeedChannel = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div class="contact-databook__summary-feed-state">
                Feed view is inactive for now.
              </div>
            </div>
          </section>

          <section class="contact-databook__nav" aria-label="Contact sections">
            <button
              v-for="section in contactNavItems"
              :key="section.anchor"
              type="button"
              class="contact-databook__nav-item"
              :class="{
                'contact-databook__nav-item--active': activeContactSection === section.anchor,
                'contact-databook__nav-item--kdb': section.isKdb,
                'contact-databook__nav-item--system': section.isSystem,
                'contact-databook__nav-item--push-right': section.pushRight,
              }"
              @click="activeContactSection = section.anchor"
            >
              <span class="contact-databook__nav-item-label">{{ section.title }}</span>
              <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
            </button>
          </section>

          <section class="contact-databook__details">
            <article v-if="activeContentSection" class="contact-section-card contact-section-card--active">
              <div v-if="!activeContentSection.isKdb" class="contact-section-card__header">
                <div class="contact-section-card__intro">
                  <h2 class="contact-section-card__title">{{ activeContentSection.title }}</h2>
                  <div v-if="activeContentSection.caption" class="contact-section-card__caption">
                    {{ activeContentSection.caption }}
                  </div>
                </div>
                <svg
                  v-if="activeContentSection.icon"
                  class="contact-section-card__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    v-for="(shape, index) in activeContentSection.icon.circles || []"
                    :key="`circle-${index}`"
                    :cx="shape.cx"
                    :cy="shape.cy"
                    :r="shape.r"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    v-for="(shape, index) in activeContentSection.icon.paths || []"
                    :key="`path-${index}`"
                    :d="shape"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>

              <div v-if="activeContentSection.isKdb" class="contact-kdb">
                <div class="contact-kdb-toolbar">
                  <div class="contact-kdb-toolbar__block">
                    <q-btn-toggle
                      v-model="activeContactKdbSection"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-kdb-toolbar__toggle contact-kdb-toolbar__section-toggle"
                      :options="contactKdbSectionOptions"
                    />
                  </div>
                </div>

                <div class="contact-kdb-artifacts-toolbar">
                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--view">
                    <q-btn-toggle
                      v-model="contactKdbViewMode"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__view-toggle"
                      :options="contactKdbViewOptions"
                    />
                  </div>

                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--kind">
                    <q-btn-toggle
                      v-model="contactKdbKindFilter"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__kind-toggle"
                      :options="contactKdbKindOptions"
                    />
                  </div>

                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--search">
                    <q-icon name="tune" size="18px" class="contact-kdb-artifacts-toolbar__filters-icon" />
                    <q-input
                      v-model="contactKdbSearchQuery"
                      dense
                      outlined
                      borderless
                      class="contact-kdb-artifacts-toolbar__search"
                      :placeholder="contactKdbSearchPlaceholder"
                    >
                      <template #prepend>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </div>
                </div>

                <q-banner
                  v-if="!displayContactKdbItems.length"
                  class="contact-section-card__empty bg-grey-1 text-black"
                  rounded
                >
                  No records in this subsection yet.
                </q-banner>

                <div v-else-if="contactKdbViewMode === 'table'" class="contact-kdb-rows">
                  <article
                    v-for="item in displayContactKdbItems"
                    :key="`${activeContactKdbSection}-${item.id}`"
                    class="contact-kdb-row"
                  >
                    <div class="contact-kdb-row__main">
                      <div class="contact-field-card__label">{{ item.title }}</div>
                      <div v-if="item.content" class="contact-field-card__value">{{ item.content }}</div>
                    </div>
                    <div v-if="item.meta" class="contact-kdb-row__meta">{{ item.meta }}</div>
                  </article>
                </div>

                <div v-else class="row q-col-gutter-md">
                  <div
                    v-for="item in displayContactKdbItems"
                    :key="`${activeContactKdbSection}-${item.id}`"
                    class="col-12 col-md-6"
                  >
                    <article class="contact-field-card contact-kdb-card">
                      <div class="contact-field-card__label">{{ item.title }}</div>
                      <div v-if="item.meta" class="contact-section-card__modified">{{ item.meta }}</div>
                      <div class="contact-field-card__value">
                        {{ item.content || '-' }}
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <q-banner
                v-else-if="!activeContentSection.fields.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No fields are mapped to this section in the current contact schema yet.
              </q-banner>

              <div v-else-if="activeContentSection.layout === 'note'" class="contact-field-grid contact-field-grid--single">
                <article
                  v-if="activeContentSection.fields[0]"
                  class="contact-field-card contact-field-card--note"
                >
                  <div class="contact-field-card__label">
                    {{
                      activeContentSection.fields[0].displayLabel || activeContentSection.fields[0].label
                    }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[activeContentSection.fields[0].key]"
                      type="textarea"
                      autogrow
                      outlined
                      class="contact-field-card__input"
                      :disable="saving || !activeContentSection.fields[0].editable"
                      :placeholder="activeContentSection.fields[0].editable ? 'Add context, notes, or next steps' : ''"
                    />
                  </template>
                  <template v-else>
                    <p class="contact-note-card__text">
                      {{ displayValue(activeContentSection.fields[0]?.value) }}
                    </p>
                    <div
                      v-if="
                        isHistoricalMode &&
                        modifiedByMap[activeContentSection.fields[0].key]
                      "
                      class="contact-section-card__modified"
                    >
                      modified by {{ modifiedByMap[activeContentSection.fields[0].key] }}
                    </div>
                  </template>
                </article>
              </div>

              <div v-else class="contact-field-grid">
                <article
                  v-for="field in activeContentSection.fields"
                  :key="field.key"
                  class="contact-field-card"
                >
                  <div class="contact-field-card__label">{{ field.displayLabel || field.label }}</div>
                  <div
                    v-if="isHistoricalMode && modifiedByMap[field.key]"
                    class="contact-section-card__modified"
                  >
                    modified by {{ modifiedByMap[field.key] }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[field.key]"
                      dense
                      outlined
                      :disable="saving || !field.editable"
                      :placeholder="field.editable ? 'Enter value' : ''"
                    />
                  </template>
                  <template v-else>
                    <div class="contact-field-card__value">
                      {{ displayValue(field.value) }}
                    </div>
                  </template>
                </article>
              </div>
            </article>

            <div v-else-if="activeContactSection === 'system'" class="contact-system-grid">
              <article class="contact-side-card">
                <div class="contact-side-card__header">
                  <div class="contact-side-card__intro">
                    <h2 class="contact-side-card__title">Record status</h2>
                    <div class="contact-side-card__eyebrow">System</div>
                  </div>
                </div>
                <div class="contact-side-card__meta-list">
                  <div
                    v-for="item in contactMetaItems"
                    :key="item.label"
                    class="contact-side-card__meta-item"
                  >
                    <div class="contact-side-card__meta-label">{{ item.label }}</div>
                    <div class="contact-side-card__meta-value">{{ item.value }}</div>
                  </div>
                </div>
              </article>

              <article v-if="visibleSystemFields.length" class="contact-side-card">
                <div class="contact-side-card__header">
                  <div class="contact-side-card__intro">
                    <h2 class="contact-side-card__title">System fields</h2>
                    <div class="contact-side-card__eyebrow">Full record</div>
                  </div>
                </div>
                <div class="contact-side-card__stack">
                  <div
                    v-for="field in visibleSystemFields"
                    :key="field.key"
                    class="contact-side-card__field"
                  >
                    <div class="contact-field-card__label">{{ field.label }}</div>
                    <div
                      v-if="isHistoricalMode && modifiedByMap[field.key]"
                      class="contact-section-card__modified"
                    >
                      modified by {{ modifiedByMap[field.key] }}
                    </div>
                    <template v-if="editMode">
                      <q-input
                        v-model="draftValues[field.key]"
                        dense
                        outlined
                        :disable="saving || !field.editable"
                        :placeholder="field.editable ? 'Enter value' : ''"
                      />
                    </template>
                    <template v-else>
                      <div class="contact-field-card__value">
                        {{ displayValue(field.value) }}
                      </div>
                    </template>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div v-else-if="isCompanyView" class="contact-databook">
          <section
            ref="contactHeroRef"
            class="contact-databook__hero"
            :style="contactHeroStyle"
            @pointerenter="startContactHeroPointerTracking"
            @pointermove="onContactHeroPointerMove"
          >
            <div class="contact-databook__hero-main">
              <figure class="contact-databook__portrait contact-databook__portrait--badge-only">
                <div class="contact-databook__portrait-placeholder" aria-hidden="true">
                  <div
                    class="contact-databook__portrait-badge"
                    :class="{ 'contact-databook__portrait-badge--logo': hasCompanyCustomLogo }"
                    :style="!hasCompanyCustomLogo ? { backgroundColor: companyAvatarColor } : undefined"
                  >
                    <img
                      v-if="hasCompanyCustomLogo"
                      class="contact-databook__portrait-logo"
                      :src="companyLogoImage"
                      :alt="companyName || 'Company logo'"
                    />
                    <template v-else>
                      {{ companyInitials }}
                    </template>
                  </div>
                </div>
                <div class="contact-databook__portrait-actions">
                  <q-btn
                    round
                    dense
                    size="sm"
                    unelevated
                    icon="edit"
                    class="contact-databook__portrait-action"
                    :loading="uploadingContactImage"
                    :disable="saving || !companyLogoField"
                  >
                    <q-menu
                      anchor="bottom right"
                      self="top right"
                      class="contact-databook__portrait-menu"
                    >
                      <q-list dense style="min-width: 168px">
                        <q-item clickable v-close-popup @click="triggerCompanyLogoPicker">
                          <q-item-section avatar>
                            <q-icon name="image" />
                          </q-item-section>
                          <q-item-section>Change logo</q-item-section>
                        </q-item>
                        <q-item
                          clickable
                          v-close-popup
                          :disable="!hasCompanyCustomLogo"
                          @click="removeCompanyLogo"
                        >
                          <q-item-section avatar>
                            <q-icon name="delete" />
                          </q-item-section>
                          <q-item-section>Delete logo</q-item-section>
                        </q-item>
                      </q-list>
                    </q-menu>
                    <q-tooltip>Change logo</q-tooltip>
                  </q-btn>
                </div>
              </figure>

              <div class="contact-databook__hero-copy">
                <div class="contact-databook__eyebrow">Company profile</div>
                <h1 class="contact-databook__name">
                  {{ companyName || 'Unnamed company' }}
                </h1>
                <div class="contact-databook__role">
                  {{ companyOneLiner || companyType || 'Company story not added yet' }}
                </div>

                <div v-if="companyHeroPills.length" class="contact-databook__pill-row">
                  <q-badge
                    v-for="pill in companyHeroPills"
                    :key="pill.label"
                    class="contact-databook__pill"
                  >
                    {{ pill.label }}
                  </q-badge>
                </div>

                <div v-if="companyActionLinks.length" class="contact-databook__actions">
                  <q-btn
                    v-for="link in companyActionLinks"
                    :key="link.label"
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="contact-databook__action"
                    :href="link.href"
                    :target="link.external ? '_blank' : undefined"
                    :rel="link.external ? 'noopener noreferrer' : undefined"
                  >
                    <q-icon :name="link.icon" size="16px" class="q-mr-sm" />
                    <span>{{ link.label }}</span>
                  </q-btn>
                </div>

                <div class="contact-databook__hero-notes-panel">
                  <div class="contact-databook__hero-tabs" role="tablist" aria-label="Company context">
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': companyHeroPanelTab === 'notes' }"
                      @click="companyHeroPanelTab = 'notes'"
                    >
                      Latest notes
                    </button>
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': companyHeroPanelTab === 'documents' }"
                      @click="companyHeroPanelTab = 'documents'"
                    >
                      Related documents
                    </button>
                  </div>

                  <ul
                    v-if="companyHeroPanelTab === 'notes' && companyHeroNotes.length"
                    class="contact-databook__hero-notes"
                  >
                    <li
                      v-for="note in companyHeroNotes"
                      :key="note.id"
                      class="contact-databook__hero-note"
                    >
                      <div class="contact-databook__notes-row">
                        <div class="contact-databook__notes-title">{{ note.title }}</div>
                        <div class="contact-databook__notes-meta">{{ note.created_at }}</div>
                      </div>
                      <div v-if="note.content" class="contact-databook__notes-content">
                        {{ note.content }}
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="companyHeroPanelTab === 'notes'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No notes yet.
                  </div>

                  <ul
                    v-if="companyHeroPanelTab === 'documents' && companyHeroDocuments.length"
                    class="contact-databook__hero-documents"
                  >
                    <li
                      v-for="document in companyHeroDocuments"
                      :key="document.id"
                      class="contact-databook__hero-document"
                      :class="{
                        'contact-databook__hero-document--loading':
                          activeDocumentActionKey === `${document.artifactId}:preview`,
                      }"
                      tabindex="0"
                      @click="previewContactDocument(document)"
                      @keyup.enter.prevent="previewContactDocument(document)"
                    >
                      <div class="contact-databook__hero-document-thumb">
                        <img
                          v-if="document.thumbnailSrc"
                          :src="document.thumbnailSrc"
                          :alt="document.fileName"
                          class="contact-databook__hero-document-thumb-image"
                        />
                        <template v-else>
                          <q-icon
                            :name="document.thumbnailIcon"
                            class="contact-databook__hero-document-thumb-icon"
                          />
                          <div class="contact-databook__hero-document-thumb-ext">
                            {{ document.thumbnailLabel }}
                          </div>
                        </template>
                      </div>
                      <div class="contact-databook__hero-document-copy">
                        <div class="contact-databook__hero-document-meta">
                          <div class="contact-databook__hero-document-name">{{ document.fileName }}</div>
                          <div class="contact-databook__hero-document-date">{{ document.created_at }}</div>
                          <div v-if="document.fileTypeLabel" class="contact-databook__hero-document-type">
                            {{ document.fileTypeLabel }}
                          </div>
                        </div>
                        <div class="contact-databook__hero-document-actions">
                          <q-btn
                            flat
                            no-caps
                            dense
                            size="sm"
                            icon="download"
                            class="contact-databook__hero-document-action"
                            :loading="activeDocumentActionKey === `${document.artifactId}:download`"
                            @click.stop="downloadContactDocument(document)"
                          >
                            <span>Download</span>
                          </q-btn>
                          <q-btn
                            flat
                            no-caps
                            dense
                            size="sm"
                            icon="share"
                            class="contact-databook__hero-document-action"
                            :loading="activeDocumentActionKey === `${document.artifactId}:share`"
                            @click.stop="shareContactDocument(document)"
                          >
                            <span>Share</span>
                          </q-btn>
                        </div>
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="companyHeroPanelTab === 'documents'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No related documents yet.
                  </div>
                </div>
              </div>
            </div>

            <div class="contact-databook__summary">
              <div class="contact-databook__summary-header">
                <div class="contact-databook__summary-label">Company snapshot</div>
                <q-btn
                  round
                  flat
                  dense
                  icon="add"
                  aria-label="Customize company snapshot"
                  class="contact-databook__summary-add"
                >
                  <q-menu
                    anchor="bottom right"
                    self="top right"
                    class="contact-databook__summary-menu"
                  >
                    <q-list dense style="min-width: 220px">
                      <q-item-label header>Snapshot fields</q-item-label>
                      <q-item
                        v-for="option in availableCompanySummaryOptions"
                        :key="option.id"
                        clickable
                        @click="toggleCompanySummaryStat(option.id)"
                      >
                        <q-item-section>{{ option.label }}</q-item-section>
                        <q-item-section side>
                          <q-icon :name="isCompanySummaryStatSelected(option.id) ? 'check' : 'add'" />
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-menu>
                </q-btn>
              </div>

              <div v-if="companySummaryStats.length" class="contact-databook__summary-grid">
                <div
                  v-for="stat in companySummaryStats"
                  :key="stat.id"
                  class="contact-databook__summary-item"
                >
                  <div class="contact-databook__summary-item-label">{{ stat.label }}</div>
                  <div class="contact-databook__summary-item-value">{{ stat.displayValue }}</div>
                </div>
              </div>
              <div v-else class="contact-databook__summary-empty">
                Use the + button to add the company details you want to keep in view here.
              </div>
            </div>
          </section>

          <section class="contact-databook__nav" aria-label="Company sections">
            <button
              v-for="section in companyNavItems"
              :key="section.anchor"
              type="button"
              class="contact-databook__nav-item"
              :class="{
                'contact-databook__nav-item--active': activeCompanySection === section.anchor,
                'contact-databook__nav-item--kdb': section.isKdb,
                'contact-databook__nav-item--system': section.isSystem,
                'contact-databook__nav-item--push-right': section.pushRight,
              }"
              @click="activeCompanySection = section.anchor"
            >
              <span class="contact-databook__nav-item-label">{{ section.title }}</span>
              <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
            </button>
          </section>

          <section class="contact-databook__details">
            <article v-if="activeCompanyContentSection" class="contact-section-card contact-section-card--active">
              <div v-if="!activeCompanyContentSection.isKdb" class="contact-section-card__header">
                <div class="contact-section-card__intro">
                  <h2 class="contact-section-card__title">{{ activeCompanyContentSection.title }}</h2>
                  <div v-if="activeCompanyContentSection.caption" class="contact-section-card__caption">
                    {{ activeCompanyContentSection.caption }}
                  </div>
                </div>
                <svg
                  v-if="activeCompanyContentSection.icon"
                  class="contact-section-card__icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    v-for="(shape, index) in activeCompanyContentSection.icon.circles || []"
                    :key="`company-circle-${index}`"
                    :cx="shape.cx"
                    :cy="shape.cy"
                    :r="shape.r"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    vector-effect="non-scaling-stroke"
                  />
                  <path
                    v-for="(shape, index) in activeCompanyContentSection.icon.paths || []"
                    :key="`company-path-${index}`"
                    :d="shape"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.75"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    vector-effect="non-scaling-stroke"
                  />
                </svg>
              </div>

              <div v-if="activeCompanyContentSection.isKdb" class="contact-kdb">
                <div class="contact-kdb-toolbar">
                  <div class="contact-kdb-toolbar__block">
                    <q-btn-toggle
                      v-model="activeCompanyKdbSection"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-kdb-toolbar__toggle contact-kdb-toolbar__section-toggle"
                      :options="companyKdbSectionOptions"
                    />
                  </div>
                </div>

                <div class="contact-kdb-artifacts-toolbar">
                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--view">
                    <q-btn-toggle
                      v-model="companyKdbViewMode"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__view-toggle"
                      :options="companyKdbViewOptions"
                    />
                  </div>

                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--kind">
                    <q-btn-toggle
                      v-model="companyKdbKindFilter"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__kind-toggle"
                      :options="companyKdbKindOptions"
                    />
                  </div>

                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--search">
                    <q-icon name="tune" size="18px" class="contact-kdb-artifacts-toolbar__filters-icon" />
                    <q-input
                      v-model="companyKdbSearchQuery"
                      dense
                      outlined
                      borderless
                      class="contact-kdb-artifacts-toolbar__search"
                      :placeholder="companyKdbSearchPlaceholder"
                    >
                      <template #prepend>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </div>
                </div>

                <q-banner
                  v-if="!displayCompanyKdbItems.length"
                  class="contact-section-card__empty bg-grey-1 text-black"
                  rounded
                >
                  No records in this subsection yet.
                </q-banner>

                <div v-else-if="companyKdbViewMode === 'table'" class="contact-kdb-rows">
                  <article
                    v-for="item in displayCompanyKdbItems"
                    :key="`${activeCompanyKdbSection}-${item.id}`"
                    class="contact-kdb-row"
                  >
                    <div class="contact-kdb-row__main">
                      <div class="contact-field-card__label">{{ item.title }}</div>
                      <div v-if="item.content" class="contact-field-card__value">{{ item.content }}</div>
                    </div>
                    <div v-if="item.meta" class="contact-kdb-row__meta">{{ item.meta }}</div>
                  </article>
                </div>

                <div v-else class="row q-col-gutter-md">
                  <div
                    v-for="item in displayCompanyKdbItems"
                    :key="`${activeCompanyKdbSection}-${item.id}`"
                    class="col-12 col-md-6"
                  >
                    <article class="contact-field-card contact-kdb-card">
                      <div class="contact-field-card__label">{{ item.title }}</div>
                      <div v-if="item.meta" class="contact-section-card__modified">{{ item.meta }}</div>
                      <div class="contact-field-card__value">
                        {{ item.content || '-' }}
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <q-banner
                v-else-if="!activeCompanyContentSection.fields.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No fields are mapped to this section in the current company schema yet.
              </q-banner>

              <div
                v-else-if="activeCompanyContentSection.layout === 'note'"
                class="contact-field-grid contact-field-grid--single"
              >
                <article
                  v-if="activeCompanyContentSection.fields[0]"
                  class="contact-field-card contact-field-card--note"
                >
                  <div class="contact-field-card__label">
                    {{
                      activeCompanyContentSection.fields[0].displayLabel ||
                      activeCompanyContentSection.fields[0].label
                    }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[activeCompanyContentSection.fields[0].key]"
                      type="textarea"
                      autogrow
                      outlined
                      class="contact-field-card__input"
                      :disable="saving || !activeCompanyContentSection.fields[0].editable"
                      :placeholder="
                        activeCompanyContentSection.fields[0].editable
                          ? 'Add updates, narrative, or context'
                          : ''
                      "
                    />
                  </template>
                  <template v-else>
                    <p class="contact-note-card__text">
                      {{ displayValue(activeCompanyContentSection.fields[0]?.value) }}
                    </p>
                    <div
                      v-if="
                        isHistoricalMode &&
                        modifiedByMap[activeCompanyContentSection.fields[0].key]
                      "
                      class="contact-section-card__modified"
                    >
                      modified by {{ modifiedByMap[activeCompanyContentSection.fields[0].key] }}
                    </div>
                  </template>
                </article>
              </div>

              <div v-else class="contact-field-grid">
                <article
                  v-for="field in activeCompanyContentSection.fields"
                  :key="field.key"
                  class="contact-field-card"
                >
                  <div class="contact-field-card__label">{{ field.displayLabel || field.label }}</div>
                  <div
                    v-if="isHistoricalMode && modifiedByMap[field.key]"
                    class="contact-section-card__modified"
                  >
                    modified by {{ modifiedByMap[field.key] }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[field.key]"
                      dense
                      outlined
                      :disable="saving || !field.editable"
                      :placeholder="field.editable ? 'Enter value' : ''"
                    />
                  </template>
                  <template v-else>
                    <div class="contact-field-card__value">
                      {{ displayValue(field.value) }}
                    </div>
                  </template>
                </article>
              </div>
            </article>

            <div v-else-if="activeCompanySection === 'system'" class="contact-system-grid">
              <article class="contact-side-card">
                <div class="contact-side-card__header">
                  <div class="contact-side-card__intro">
                    <h2 class="contact-side-card__title">Record status</h2>
                    <div class="contact-side-card__eyebrow">System</div>
                  </div>
                </div>
                <div class="contact-side-card__meta-list">
                  <div
                    v-for="item in companyMetaItems"
                    :key="item.label"
                    class="contact-side-card__meta-item"
                  >
                    <div class="contact-side-card__meta-label">{{ item.label }}</div>
                    <div class="contact-side-card__meta-value">{{ item.value }}</div>
                  </div>
                </div>
              </article>

              <article v-if="visibleSystemFields.length" class="contact-side-card">
                <div class="contact-side-card__header">
                  <div class="contact-side-card__intro">
                    <h2 class="contact-side-card__title">System fields</h2>
                    <div class="contact-side-card__eyebrow">Full record</div>
                  </div>
                </div>
                <div class="contact-side-card__stack">
                  <div
                    v-for="field in visibleSystemFields"
                    :key="field.key"
                    class="contact-side-card__field"
                  >
                    <div class="contact-field-card__label">{{ field.label }}</div>
                    <div
                      v-if="isHistoricalMode && modifiedByMap[field.key]"
                      class="contact-section-card__modified"
                    >
                      modified by {{ modifiedByMap[field.key] }}
                    </div>
                    <template v-if="editMode">
                      <q-input
                        v-model="draftValues[field.key]"
                        dense
                        outlined
                        :disable="saving || !field.editable"
                        :placeholder="field.editable ? 'Enter value' : ''"
                      />
                    </template>
                    <template v-else>
                      <div class="contact-field-card__value">
                        {{ displayValue(field.value) }}
                      </div>
                    </template>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </div>

        <div v-else-if="isUserView || isArtifactView" class="contact-databook">
          <section
            ref="contactHeroRef"
            class="contact-databook__hero"
            :style="structuredRecordHeroStyle"
            @pointerenter="startContactHeroPointerTracking"
            @pointermove="onContactHeroPointerMove"
          >
            <div class="contact-databook__hero-main">
              <figure class="contact-databook__portrait contact-databook__portrait--initials-only">
                <div class="contact-databook__portrait-placeholder" aria-hidden="true">
                  <div
                    class="contact-databook__portrait-placeholder-initials"
                    :style="{ backgroundColor: genericRecordAvatarColor }"
                  >
                    {{ genericRecordInitials }}
                  </div>
                </div>
              </figure>

              <div class="contact-databook__hero-copy">
                <h1 class="contact-databook__name">
                  {{ genericRecordName }}
                </h1>
                <div class="contact-databook__role">
                  {{ genericRecordSubtitle }}
                </div>
                <div class="contact-databook__role contact-databook__role--location">
                  {{ genericRecordSecondaryLine }}
                </div>

                <div v-if="genericRecordPills.length" class="contact-databook__pill-row">
                  <q-badge
                    v-for="pill in genericRecordPills"
                    :key="pill"
                    class="contact-databook__pill"
                  >
                    {{ pill }}
                  </q-badge>
                </div>

                <div v-if="genericRecordActionLinks.length" class="contact-databook__actions">
                  <q-btn
                    v-for="link in genericRecordActionLinks"
                    :key="link.label"
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="contact-databook__action"
                    :href="link.href"
                    :target="link.external ? '_blank' : undefined"
                    :rel="link.external ? 'noopener noreferrer' : undefined"
                  >
                    <q-icon :name="link.icon" size="16px" class="q-mr-sm" />
                    <span>{{ link.label }}</span>
                  </q-btn>
                </div>

                <div class="contact-databook__hero-notes-panel">
                  <div class="contact-databook__hero-tabs" role="tablist" :aria-label="`${entityLabel} context`">
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'notes' }"
                      @click="genericHeroPanelTab = 'notes'"
                    >
                      Latest notes
                    </button>
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'documents' }"
                      @click="genericHeroPanelTab = 'documents'"
                    >
                      Related artifacts
                    </button>
                  </div>

                  <ul
                    v-if="genericHeroPanelTab === 'notes' && genericHeroNotes.length"
                    class="contact-databook__hero-notes"
                  >
                    <li
                      v-for="note in genericHeroNotes"
                      :key="note.id"
                      class="contact-databook__hero-note"
                    >
                      <div class="contact-databook__notes-row">
                        <div class="contact-databook__notes-title">{{ note.title }}</div>
                        <div class="contact-databook__notes-meta">{{ note.created_at }}</div>
                      </div>
                      <div v-if="note.content" class="contact-databook__notes-content">
                        {{ note.content }}
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="genericHeroPanelTab === 'notes'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No notes yet for this {{ entityLabel.toLowerCase() }}.
                  </div>

                  <ul
                    v-if="genericHeroPanelTab === 'documents' && genericHeroDocuments.length"
                    class="contact-databook__hero-documents"
                  >
                    <li
                      v-for="document in genericHeroDocuments"
                      :key="document.id"
                      class="contact-databook__hero-document"
                    >
                      <div class="contact-databook__notes-row">
                        <div class="contact-databook__notes-title">{{ document.title }}</div>
                        <div class="contact-databook__notes-meta">{{ document.meta }}</div>
                      </div>
                      <div v-if="document.content" class="contact-databook__notes-content">
                        {{ document.content }}
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="genericHeroPanelTab === 'documents'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No related artifacts yet for this {{ entityLabel.toLowerCase() }}.
                  </div>
                </div>
              </div>
            </div>

            <div class="contact-databook__summary">
              <div class="contact-databook__summary-header">
                <div class="contact-databook__summary-label">{{ entityLabel }} Feed</div>
              </div>

              <div class="contact-databook__summary-feed-toggle">
                <div class="contact-databook__summary-feed-toolbar">
                  <button
                    v-for="option in contactFeedChannelOptions"
                    :key="option.value"
                    type="button"
                    class="contact-databook__summary-feed-button"
                    :class="{ 'contact-databook__summary-feed-button--active': genericRecordFeedChannel === option.value }"
                    @click="genericRecordFeedChannel = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div class="contact-databook__summary-feed-state">
                Feed view is inactive for now.
              </div>
            </div>
          </section>

          <section v-if="genericRecordNavItems.length" class="contact-databook__nav" :aria-label="`${entityLabel} sections`">
            <button
              v-for="section in genericRecordNavItems"
              :key="section.value"
              type="button"
              class="contact-databook__nav-item"
              :class="{
                'contact-databook__nav-item--active': activeGenericSection === section.value,
                'contact-databook__nav-item--kdb': section.isKdb,
                'contact-databook__nav-item--system': section.isSystem,
                'contact-databook__nav-item--push-right': section.pushRight,
              }"
              @click="activeGenericSection = section.value"
            >
              <span class="contact-databook__nav-item-label">{{ section.title }}</span>
              <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
            </button>
          </section>

          <section class="contact-databook__details">
            <article class="contact-section-card contact-section-card--active">
              <div class="contact-section-card__header">
                <div class="contact-section-card__intro">
                  <h2 class="contact-section-card__title">{{ activeGenericNavTitle || 'System' }}</h2>
                  <div class="contact-section-card__caption">
                    Review the structured fields and relationships tied to this {{ entityLabel.toLowerCase() }} record.
                  </div>
                </div>
              </div>

              <div v-if="/kdb/i.test(activeGenericSection)" class="contact-kdb">
                <div class="contact-kdb-toolbar">
                  <div class="contact-kdb-toolbar__block">
                    <q-btn-toggle
                      v-model="activeGenericKdbSection"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-kdb-toolbar__toggle contact-kdb-toolbar__section-toggle"
                      :options="genericKdbSectionOptions"
                    />
                  </div>
                </div>

                <div class="contact-kdb-artifacts-toolbar">
                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--view">
                    <q-btn-toggle
                      v-model="genericKdbViewMode"
                      dense
                      unelevated
                      toggle-color="primary"
                      color="grey-3"
                      text-color="grey-8"
                      class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__view-toggle"
                      :options="CONTACT_KDB_VIEW_OPTIONS"
                    />
                  </div>

                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--kind">
                    <q-btn-toggle
                      v-model="genericKdbKindFilter"
                      dense
                      no-caps
                      unelevated
                      toggle-color="dark"
                      color="white"
                      text-color="grey-8"
                      class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__kind-toggle"
                      :options="genericKdbKindOptions"
                    />
                  </div>

                  <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--search">
                    <q-icon name="tune" size="18px" class="contact-kdb-artifacts-toolbar__filters-icon" />
                    <q-input
                      v-model="genericKdbSearchQuery"
                      dense
                      outlined
                      borderless
                      class="contact-kdb-artifacts-toolbar__search"
                      :placeholder="genericKdbSearchPlaceholder"
                    >
                      <template #prepend>
                        <q-icon name="search" />
                      </template>
                    </q-input>
                  </div>
                </div>

                <q-banner
                  v-if="!displayGenericKdbItems.length"
                  class="contact-section-card__empty bg-grey-1 text-black"
                  rounded
                >
                  No records in this subsection yet.
                </q-banner>

                <div v-else-if="genericKdbViewMode === 'table'" class="contact-kdb-rows">
                  <article
                    v-for="item in displayGenericKdbItems"
                    :key="item.id"
                    class="contact-kdb-row"
                  >
                    <div class="contact-kdb-row__main">
                      <div class="contact-field-card__label">{{ item.title }}</div>
                      <div class="contact-field-card__value">{{ displayValue(item.content || item.meta) }}</div>
                    </div>
                    <div v-if="item.meta" class="contact-kdb-row__meta">
                      {{ item.meta }}
                    </div>
                  </article>
                </div>

                <div v-else class="row q-col-gutter-md">
                  <div
                    v-for="item in displayGenericKdbItems"
                    :key="item.id"
                    class="col-12 col-md-6"
                  >
                    <article class="contact-field-card contact-kdb-card">
                      <div class="contact-field-card__label">{{ item.title }}</div>
                      <div v-if="item.meta" class="contact-section-card__modified">
                        {{ item.meta }}
                      </div>
                      <div class="contact-field-card__value">
                        {{ displayValue(item.content || item.meta) }}
                      </div>
                    </article>
                  </div>
                </div>
              </div>

              <q-banner
                v-else-if="!visibleGenericFields.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No fields are mapped to this section in the current {{ entityLabel.toLowerCase() }} schema yet.
              </q-banner>

              <div v-else class="contact-field-grid">
                <article
                  v-for="field in visibleGenericFields"
                  :key="field.key"
                  class="contact-field-card"
                >
                  <div class="contact-field-card__label">{{ field.label }}</div>
                  <div
                    v-if="isHistoricalMode && modifiedByMap[field.key]"
                    class="contact-section-card__modified"
                  >
                    modified by {{ modifiedByMap[field.key] }}
                  </div>
                  <template v-if="editMode">
                    <q-input
                      v-model="draftValues[field.key]"
                      dense
                      outlined
                      :disable="saving || !field.editable"
                      :placeholder="field.editable ? 'Enter value' : ''"
                    />
                  </template>
                  <template v-else>
                    <div class="contact-field-card__value">
                      {{ displayValue(field.value) }}
                    </div>
                  </template>
                </article>
              </div>
            </article>
          </section>
        </div>

        <div v-else-if="isStructuredGenericRecordView" class="contact-databook">
          <section
            ref="contactHeroRef"
            class="contact-databook__hero"
            :style="structuredRecordHeroStyle"
            @pointerenter="startContactHeroPointerTracking"
            @pointermove="onContactHeroPointerMove"
          >
            <div class="contact-databook__hero-main">
              <figure class="contact-databook__portrait contact-databook__portrait--initials-only">
                <div class="contact-databook__portrait-placeholder" aria-hidden="true">
                  <div
                    class="contact-databook__portrait-placeholder-initials"
                    :style="{ backgroundColor: genericRecordAvatarColor }"
                  >
                    {{ genericRecordInitials }}
                  </div>
                </div>
              </figure>

              <div class="contact-databook__hero-copy">
                <h1 class="contact-databook__name">
                  {{ genericRecordName }}
                </h1>
                <div class="contact-databook__role">
                  {{ genericRecordSubtitle }}
                </div>
                <div class="contact-databook__role contact-databook__role--location">
                  {{ genericRecordSecondaryLine }}
                </div>

                <div v-if="genericRecordPills.length" class="contact-databook__pill-row">
                  <q-badge
                    v-for="pill in genericRecordPills"
                    :key="pill"
                    class="contact-databook__pill"
                  >
                    {{ pill }}
                  </q-badge>
                </div>

                <div v-if="genericRecordActionLinks.length" class="contact-databook__actions">
                  <q-btn
                    v-for="link in genericRecordActionLinks"
                    :key="link.label"
                    outline
                    no-caps
                    unelevated
                    size="sm"
                    class="contact-databook__action"
                    :href="link.href"
                    :target="link.external ? '_blank' : undefined"
                    :rel="link.external ? 'noopener noreferrer' : undefined"
                  >
                    <q-icon :name="link.icon" size="16px" class="q-mr-sm" />
                    <span>{{ link.label }}</span>
                  </q-btn>
                </div>

                <div class="contact-databook__hero-notes-panel">
                  <div class="contact-databook__hero-tabs" role="tablist" :aria-label="`${entityLabel} context`">
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'notes' }"
                      @click="genericHeroPanelTab = 'notes'"
                    >
                      Latest notes
                    </button>
                    <button
                      type="button"
                      class="contact-databook__hero-tab"
                      :class="{ 'contact-databook__hero-tab--active': genericHeroPanelTab === 'documents' }"
                      @click="genericHeroPanelTab = 'documents'"
                    >
                      Related artifacts
                    </button>
                  </div>

                  <ul
                    v-if="genericHeroPanelTab === 'notes' && genericHeroNotes.length"
                    class="contact-databook__hero-notes"
                  >
                    <li
                      v-for="note in genericHeroNotes"
                      :key="note.id"
                      class="contact-databook__hero-note"
                    >
                      <div class="contact-databook__notes-row">
                        <div class="contact-databook__notes-title">{{ note.title }}</div>
                        <div class="contact-databook__notes-meta">{{ note.created_at }}</div>
                      </div>
                      <div v-if="note.content" class="contact-databook__notes-content">
                        {{ note.content }}
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="genericHeroPanelTab === 'notes'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No notes yet for this {{ entityLabel.toLowerCase() }}.
                  </div>

                  <ul
                    v-if="genericHeroPanelTab === 'documents' && genericHeroDocuments.length"
                    class="contact-databook__hero-documents"
                  >
                    <li
                      v-for="document in genericHeroDocuments"
                      :key="document.id"
                      class="contact-databook__hero-document"
                    >
                      <div class="contact-databook__notes-row">
                        <div class="contact-databook__notes-title">{{ document.title }}</div>
                        <div class="contact-databook__notes-meta">{{ document.meta }}</div>
                      </div>
                      <div v-if="document.content" class="contact-databook__notes-content">
                        {{ document.content }}
                      </div>
                    </li>
                  </ul>
                  <div
                    v-else-if="genericHeroPanelTab === 'documents'"
                    class="contact-databook__hero-panel-empty"
                  >
                    No related artifacts yet for this {{ entityLabel.toLowerCase() }}.
                  </div>
                </div>
              </div>
            </div>

            <div class="contact-databook__summary">
              <div class="contact-databook__summary-header">
                <div class="contact-databook__summary-label">{{ entityLabel }} Feed</div>
              </div>

              <div class="contact-databook__summary-feed-toggle">
                <div class="contact-databook__summary-feed-toolbar">
                  <button
                    v-for="option in contactFeedChannelOptions"
                    :key="option.value"
                    type="button"
                    class="contact-databook__summary-feed-button"
                    :class="{ 'contact-databook__summary-feed-button--active': genericRecordFeedChannel === option.value }"
                    @click="genericRecordFeedChannel = option.value"
                  >
                    {{ option.label }}
                  </button>
                </div>
              </div>

              <div class="contact-databook__summary-feed-state">
                Feed view is inactive for now.
              </div>
            </div>
          </section>

          <section v-if="genericRecordNavItems.length" class="contact-databook__nav" aria-label="Record sections">
            <button
              v-for="section in genericRecordNavItems"
              :key="section.value"
              type="button"
              class="contact-databook__nav-item"
              :class="{
                'contact-databook__nav-item--active': activeGenericSection === section.value,
                'contact-databook__nav-item--kdb': section.isKdb,
                'contact-databook__nav-item--system': section.isSystem,
                'contact-databook__nav-item--push-right': section.pushRight,
              }"
              @click="activeGenericSection = section.value"
            >
              <span class="contact-databook__nav-item-label">{{ section.title }}</span>
              <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
            </button>
          </section>

          <template v-if="/kdb/i.test(activeGenericSection)">
            <div class="contact-kdb">
              <div class="contact-kdb-toolbar">
                <div class="contact-kdb-toolbar__block">
                  <q-btn-toggle
                    v-model="activeGenericKdbSection"
                    dense
                    no-caps
                    unelevated
                    toggle-color="dark"
                    color="white"
                    text-color="grey-8"
                    class="contact-kdb-toolbar__toggle contact-kdb-toolbar__section-toggle"
                    :options="genericKdbSectionOptions"
                  />
                </div>
              </div>

              <div class="contact-kdb-artifacts-toolbar">
                <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--view">
                  <q-btn-toggle
                    v-model="genericKdbViewMode"
                    dense
                    unelevated
                    toggle-color="primary"
                    color="grey-3"
                    text-color="grey-8"
                    class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__view-toggle"
                    :options="CONTACT_KDB_VIEW_OPTIONS"
                  />
                </div>

                <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--kind">
                  <q-btn-toggle
                    v-model="genericKdbKindFilter"
                    dense
                    no-caps
                    unelevated
                    toggle-color="dark"
                    color="white"
                    text-color="grey-8"
                    class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__kind-toggle"
                    :options="genericKdbKindOptions"
                  />
                </div>

                <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--search">
                  <q-icon name="tune" size="18px" class="contact-kdb-artifacts-toolbar__filters-icon" />
                  <q-input
                    v-model="genericKdbSearchQuery"
                    dense
                    outlined
                    borderless
                    class="contact-kdb-artifacts-toolbar__search"
                    :placeholder="genericKdbSearchPlaceholder"
                  >
                    <template #prepend>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </div>
              </div>

              <q-banner
                v-if="!displayGenericKdbItems.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No records in this subsection yet.
              </q-banner>

              <div v-else-if="genericKdbViewMode === 'table'" class="contact-kdb-rows">
                <article
                  v-for="item in displayGenericKdbItems"
                  :key="item.id"
                  class="contact-kdb-row"
                >
                  <div class="contact-kdb-row__main">
                    <div class="contact-field-card__label">{{ item.title }}</div>
                    <div class="contact-field-card__value">{{ displayValue(item.content || item.meta) }}</div>
                  </div>
                  <div v-if="item.meta" class="contact-kdb-row__meta">
                    {{ item.meta }}
                  </div>
                </article>
              </div>

              <div v-else class="row q-col-gutter-md">
                <div
                  v-for="item in displayGenericKdbItems"
                  :key="item.id"
                  class="col-12 col-md-6"
                >
                  <article class="contact-field-card contact-kdb-card">
                    <div class="contact-field-card__label">{{ item.title }}</div>
                    <div v-if="item.meta" class="contact-section-card__modified">
                      {{ item.meta }}
                    </div>
                    <div class="contact-field-card__value">
                      {{ displayValue(item.content || item.meta) }}
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </template>

          <q-list v-else bordered separator>
            <q-item v-for="field in visibleGenericFields" :key="field.key">
              <q-item-section>
                <q-item-label caption class="text-weight-medium">{{ field.section }}</q-item-label>
                <q-item-label class="text-caption text-grey-7">{{ field.label }}</q-item-label>
                <q-item-label
                  v-if="isHistoricalMode && modifiedByMap[field.key]"
                  class="text-caption text-negative text-italic"
                >
                  modified by {{ modifiedByMap[field.key] }}
                </q-item-label>
              </q-item-section>
              <q-item-section side class="databook-value-section">
                <template v-if="editMode">
                  <q-input
                    v-model="draftValues[field.key]"
                    dense
                    outlined
                    :disable="saving || !field.editable"
                    :placeholder="field.editable ? 'Enter value' : ''"
                  />
                </template>
                <template v-else>
                  <div class="text-body2 databook-value">{{ displayValue(field.value) }}</div>
                </template>
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <template v-else>
          <section v-if="genericRecordNavItems.length" class="contact-databook__nav" aria-label="Record sections">
            <button
              v-for="section in genericRecordNavItems"
              :key="section.value"
              type="button"
              class="contact-databook__nav-item"
              :class="{
                'contact-databook__nav-item--active': activeGenericSection === section.value,
                'contact-databook__nav-item--kdb': section.isKdb,
                'contact-databook__nav-item--system': section.isSystem,
                'contact-databook__nav-item--push-right': section.pushRight,
              }"
              @click="activeGenericSection = section.value"
            >
              <span class="contact-databook__nav-item-label">{{ section.title }}</span>
              <q-icon v-if="section.isKdb" name="share" size="14px" class="contact-databook__nav-item-icon" />
            </button>
          </section>

          <template v-if="/kdb/i.test(activeGenericSection)">
            <div class="contact-kdb">
              <div class="contact-kdb-toolbar">
                <div class="contact-kdb-toolbar__block">
                  <q-btn-toggle
                    v-model="activeGenericKdbSection"
                    dense
                    no-caps
                    unelevated
                    toggle-color="dark"
                    color="white"
                    text-color="grey-8"
                    class="contact-kdb-toolbar__toggle contact-kdb-toolbar__section-toggle"
                    :options="genericKdbSectionOptions"
                  />
                </div>
              </div>

              <div class="contact-kdb-artifacts-toolbar">
                <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--view">
                  <q-btn-toggle
                    v-model="genericKdbViewMode"
                    dense
                    unelevated
                    toggle-color="primary"
                    color="grey-3"
                    text-color="grey-8"
                    class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__view-toggle"
                    :options="CONTACT_KDB_VIEW_OPTIONS"
                  />
                </div>

                <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--kind">
                  <q-btn-toggle
                    v-model="genericKdbKindFilter"
                    dense
                    no-caps
                    unelevated
                    toggle-color="dark"
                    color="white"
                    text-color="grey-8"
                    class="contact-kdb-artifacts-toolbar__toggle contact-kdb-artifacts-toolbar__kind-toggle"
                    :options="genericKdbKindOptions"
                  />
                </div>

                <div class="contact-kdb-artifacts-toolbar__block contact-kdb-artifacts-toolbar__block--search">
                  <q-icon name="tune" size="18px" class="contact-kdb-artifacts-toolbar__filters-icon" />
                  <q-input
                    v-model="genericKdbSearchQuery"
                    dense
                    outlined
                    borderless
                    class="contact-kdb-artifacts-toolbar__search"
                    :placeholder="genericKdbSearchPlaceholder"
                  >
                    <template #prepend>
                      <q-icon name="search" />
                    </template>
                  </q-input>
                </div>
              </div>

              <q-banner
                v-if="!displayGenericKdbItems.length"
                class="contact-section-card__empty bg-grey-1 text-black"
                rounded
              >
                No records in this subsection yet.
              </q-banner>

              <div v-else-if="genericKdbViewMode === 'table'" class="contact-kdb-rows">
                <article
                  v-for="item in displayGenericKdbItems"
                  :key="item.id"
                  class="contact-kdb-row"
                >
                  <div class="contact-kdb-row__main">
                    <div class="contact-field-card__label">{{ item.title }}</div>
                    <div class="contact-field-card__value">{{ displayValue(item.content || item.meta) }}</div>
                  </div>
                  <div v-if="item.meta" class="contact-kdb-row__meta">
                    {{ item.meta }}
                  </div>
                </article>
              </div>

              <div v-else class="row q-col-gutter-md">
                <div
                  v-for="item in displayGenericKdbItems"
                  :key="item.id"
                  class="col-12 col-md-6"
                >
                  <article class="contact-field-card contact-kdb-card">
                    <div class="contact-field-card__label">{{ item.title }}</div>
                    <div v-if="item.meta" class="contact-section-card__modified">
                      {{ item.meta }}
                    </div>
                    <div class="contact-field-card__value">
                      {{ displayValue(item.content || item.meta) }}
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </template>

          <q-list v-else bordered separator>
            <q-item v-for="field in visibleGenericFields" :key="field.key">
              <q-item-section>
                <q-item-label caption class="text-weight-medium">{{ field.section }}</q-item-label>
                <q-item-label class="text-caption text-grey-7">{{ field.label }}</q-item-label>
                <q-item-label
                  v-if="isHistoricalMode && modifiedByMap[field.key]"
                  class="text-caption text-negative text-italic"
                >
                  modified by {{ modifiedByMap[field.key] }}
                </q-item-label>
              </q-item-section>
              <q-item-section side class="databook-value-section">
                <template v-if="editMode">
                  <q-input
                    v-model="draftValues[field.key]"
                    dense
                    outlined
                    :disable="saving || !field.editable"
                    :placeholder="field.editable ? 'Enter value' : ''"
                  />
                </template>
                <template v-else>
                  <div class="text-body2 databook-value">{{ displayValue(field.value) }}</div>
                </template>
              </q-item-section>
            </q-item>
          </q-list>
        </template>
      </template>

      <q-banner v-else-if="!loading" class="bg-grey-2 text-black" rounded>
        No record fields available for this record.
      </q-banner>

      <q-page-sticky v-if="editMode" position="bottom" :offset="[0, 16]">
        <q-banner class="bg-grey-10 text-white q-pa-sm rounded-borders">
          <div class="row items-center q-gutter-sm">
            <div class="col">Edit mode enabled. Save or cancel your changes.</div>
            <q-btn dense color="positive" label="Save" :loading="saving" @click="saveChanges" />
            <q-btn dense flat color="white" label="Cancel" :disable="saving" @click="cancelEdit" />
          </div>
        </q-banner>
      </q-page-sticky>

      <q-dialog v-model="showUserLabelDialog" persistent>
        <q-card style="min-width: 360px">
          <q-card-section>
            <div class="text-h6">Set Editor Name</div>
            <div class="text-caption text-grey-7">
              A display name is required before saving audited changes. You can also update it
              later in Settings.
            </div>
          </q-card-section>
          <q-card-section>
            <q-input
              v-model="userLabelInput"
              autofocus
              outlined
              dense
              label="Display name"
              :disable="savingUserLabel"
            />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat label="Cancel" :disable="savingUserLabel" @click="showUserLabelDialog = false" />
            <q-btn color="primary" label="Save" :loading="savingUserLabel" @click="saveUserLabel" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showContactImageCropDialog" persistent>
        <q-card class="contact-image-cropper-dialog">
          <q-card-section>
            <div class="text-h6">Crop image</div>
            <div class="text-caption text-grey-7">
              {{ contactImageCropCaption }}
            </div>
          </q-card-section>

          <q-card-section class="contact-image-cropper-dialog__body">
            <div class="contact-image-cropper" @pointerdown="startContactImageCropDrag">
              <div
                class="contact-image-cropper__frame"
                :class="{ 'contact-image-cropper__frame--circle': isCompanyImageCropTarget }"
                :style="contactImageCropFrameStyle"
              >
                <img
                  v-if="pendingContactImageSrc"
                  :src="pendingContactImageSrc"
                  alt="Selected image preview"
                  class="contact-image-cropper__image"
                  :style="contactImageCropStyle"
                  draggable="false"
                />
                <div
                  class="contact-image-cropper__overlay"
                  :class="{ 'contact-image-cropper__overlay--circle': isCompanyImageCropTarget }"
                />
              </div>
            </div>

            <div class="contact-image-cropper__controls">
              <div class="text-caption text-grey-7">Zoom</div>
              <q-slider
                v-model="contactImageCropZoom"
                :min="1"
                :max="3"
                :step="0.01"
                color="primary"
              />
            </div>
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" :disable="uploadingContactImage" @click="cancelContactImageCrop" />
            <q-btn
              color="primary"
              label="Save image"
              :loading="uploadingContactImage"
              @click="confirmContactImageCrop"
            />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <q-dialog v-model="showDocumentPreviewDialog" maximized @hide="closeDocumentPreview">
        <q-card class="contact-document-preview-dialog">
          <q-card-section class="contact-document-preview-dialog__header">
            <div>
              <div class="text-h6">{{ documentPreview.fileName || 'Document preview' }}</div>
              <div class="text-caption text-grey-7">
                {{
                  documentPreviewLoading
                    ? 'Loading preview...'
                    : documentPreview.kind === 'pdf'
                      ? 'PDF preview'
                      : documentPreview.kind === 'text'
                        ? 'Text preview'
                        : documentPreview.kind === 'image'
                          ? 'Image preview'
                          : 'Preview unavailable'
                }}
              </div>
            </div>
            <q-btn flat round dense icon="close" @click="closeDocumentPreview" />
          </q-card-section>

          <q-separator />

          <q-card-section class="contact-document-preview-dialog__body">
            <div v-if="documentPreviewLoading" class="contact-document-preview-dialog__state">
              <q-spinner size="32px" color="primary" />
            </div>

            <div v-else-if="documentPreview.kind === 'pdf'" class="contact-document-preview-dialog__pdf">
              <div class="contact-document-preview-dialog__pdf-sidebar">
                <button
                  v-for="page in pdfPreviewPages"
                  :key="page.pageNumber"
                  type="button"
                  class="contact-document-preview-dialog__pdf-thumb"
                  :class="{
                    'contact-document-preview-dialog__pdf-thumb--active':
                      page.pageNumber === pdfPreviewSelectedPage,
                  }"
                  @click="selectPdfPreviewPage(page.pageNumber)"
                >
                  <img
                    v-if="page.thumbnailSrc"
                    :src="page.thumbnailSrc"
                    :alt="`Page ${page.pageNumber}`"
                    class="contact-document-preview-dialog__pdf-thumb-image"
                  />
                  <div class="contact-document-preview-dialog__pdf-thumb-label">
                    {{ page.pageNumber }}
                  </div>
                </button>
              </div>

              <div class="contact-document-preview-dialog__pdf-main">
                <img
                  v-if="pdfPreviewCurrentPageSrc"
                  :src="pdfPreviewCurrentPageSrc"
                  :alt="`${documentPreview.fileName || 'PDF preview'} page ${pdfPreviewSelectedPage}`"
                  class="contact-document-preview-dialog__pdf-page"
                />
                <div v-else class="contact-document-preview-dialog__state">
                  <q-spinner size="32px" color="primary" />
                </div>
              </div>
            </div>

            <img
              v-else-if="documentPreview.kind === 'image' && documentPreview.fileUrl"
              :src="documentPreview.fileUrl"
              :alt="documentPreview.fileName || 'Document preview'"
              class="contact-document-preview-dialog__image"
            />

            <pre
              v-else-if="documentPreview.kind === 'text'"
              class="contact-document-preview-dialog__text"
            ><code>{{ documentPreview.content || '' }}</code></pre>

            <div v-else class="contact-document-preview-dialog__state">
              <div class="text-body1">This file can’t be previewed in-app yet.</div>
              <div class="text-caption text-grey-7">
                Use Download or Share for this document type.
              </div>
            </div>
          </q-card-section>
        </q-card>
      </q-dialog>

      <input
        ref="contactImageInput"
        type="file"
        accept="image/*"
        style="display: none"
        @change="onContactImageSelected"
      />
    </div>
  </q-page>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { countFilledContactFields, getContactCompletenessTheme } from 'src/utils/contactCompleteness'
import canonicalStructure from '../../docs/canonical-structure.json'

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

const TABLE_LABELS = {
  Companies: 'Company',
  Contacts: 'Contact',
  Users: 'User',
  Artifacts: 'Artifact',
  Opportunities: 'Opportunity',
  Funds: 'Fund',
  Rounds: 'Round',
  Projects: 'Project',
  Pipelines: 'Project',
  Tasks: 'Task',
  Notes: 'Note',
}

const TABLE_LIST_ROUTES = {
  Companies: { routeName: 'companies', label: 'Back to Companies' },
  Contacts: { routeName: 'contacts', label: 'Back to Contacts' },
  Users: { routeName: 'users', label: 'Back to Users' },
  Artifacts: { routeName: 'artifacts', label: 'Back to Artifacts' },
  Opportunities: { routeName: 'opportunities', label: 'Back to Opportunities' },
  Funds: { routeName: 'funds', label: 'Back to Funds' },
  Rounds: { routeName: 'rounds', label: 'Back to Rounds' },
  Projects: { routeName: 'projects', label: 'Back to Projects' },
  Pipelines: { routeName: 'projects', label: 'Back to Projects' },
  Tasks: { routeName: 'tasks', label: 'Back to Tasks' },
  Notes: { routeName: 'notes', label: 'Back to Notes' },
}

const DEFAULT_CONTACT_SUMMARY_STAT_IDS = ['role', 'stakeholder', 'country', 'phone']
const DEFAULT_COMPANY_SUMMARY_STAT_IDS = ['type', 'status', 'website', 'raised']
const CONTACT_HERO_NOTES_LIMIT = 10
const CONTACT_HERO_DOCUMENTS_LIMIT = 6
const CONTACT_KDB_VIEW_OPTIONS = [
  { value: 'grid', icon: 'grid_view' },
  { value: 'table', icon: 'view_list' },
]
const CONTACT_KDB_SECTION_OPTIONS = [
  { label: 'Artifacts', value: 'artifacts', icon: 'attach_file' },
  { label: 'Users', value: 'users', icon: 'badge' },
  { label: 'Contacts', value: 'contacts', icon: 'people' },
  { label: 'Companies', value: 'companies', icon: 'apartment' },
  { label: 'Funds', value: 'funds', icon: 'work' },
  { label: 'Rounds', value: 'rounds', icon: 'work' },
  { label: 'Projects', value: 'projects', icon: 'schema' },
  { label: 'Tasks', value: 'tasks', icon: 'check_circle' },
  { label: 'Notes', value: 'notes', icon: 'note' },
]
const CONTACT_IMAGE_CROP_CONTACT_FRAME_WIDTH = 280
const CONTACT_IMAGE_CROP_CONTACT_FRAME_HEIGHT = 420
const CONTACT_IMAGE_CROP_COMPANY_FRAME_SIZE = 280
const CONTACT_IMAGE_OUTPUT_CONTACT_WIDTH = 800
const CONTACT_IMAGE_OUTPUT_CONTACT_HEIGHT = 1200
const CONTACT_IMAGE_OUTPUT_COMPANY_SIZE = 800
const CONTACT_HERO_GRADIENT_DEFAULT = {
  x: 88,
  y: 14,
  size: 52,
}
const CONTACT_SUMMARY_OPTIONS = [
  { id: 'role', label: 'Current role', aliases: ['Current_Roles', 'Role'] },
  { id: 'company', label: 'Current company', aliases: ['Current_Companies'] },
  { id: 'expertise', label: 'Expertise', aliases: ['Expertise'] },
  { id: 'stakeholder', label: 'Stakeholder type', aliases: ['Stakeholder_type'] },
  { id: 'closeness', label: 'Closeness level', aliases: ['Closeness_Level'] },
  { id: 'country', label: 'Based in', aliases: ['Country_based'] },
  { id: 'phone', label: 'Phone', aliases: ['Phone'] },
  { id: 'email', label: 'Business email', aliases: ['Business_Email', 'Email'] },
  { id: 'personal-email', label: 'Personal email', aliases: ['Personal_Email'] },
  { id: 'linkedin', label: 'LinkedIn', aliases: ['LinkedIn'] },
  { id: 'tenure', label: 'Tenure at firm', aliases: ['Tenure_at_Firm', 'Tenure_at_Firm_yrs'] },
  { id: 'university', label: 'University', aliases: ['University'] },
  { id: 'credentials', label: 'Credentials', aliases: ['Credentials'] },
  { id: 'updated', label: 'Updated', aliases: ['updated_at'] },
]
const COMPANY_SUMMARY_OPTIONS = [
  { id: 'type', label: 'Company type', aliases: ['Company_Type'] },
  { id: 'status', label: 'Status', aliases: ['Status'] },
  { id: 'website', label: 'Website', aliases: ['Website'] },
  { id: 'one-liner', label: 'One liner', aliases: ['One_Liner'] },
  { id: 'raised', label: 'Amount raised / AUMs', aliases: ['Amount_Raised_AUMs'] },
  { id: 'pax', label: 'Team size', aliases: ['Pax'] },
  { id: 'founded', label: 'Date of incorporation', aliases: ['Date_of_Incorporation'] },
  { id: 'updates', label: 'Updates', aliases: ['Updates'] },
  { id: 'city', label: 'City', aliases: ['city_id'] },
  { id: 'country', label: 'Country', aliases: ['country_id'] },
  { id: 'region', label: 'Region', aliases: ['region_id'] },
  { id: 'created', label: 'Created', aliases: ['created_at'] },
  { id: 'updated', label: 'Updated', aliases: ['updated_at'] },
]

const CONTACT_SECTION_ICONS = {
  building: {
    paths: [
      'M6 20V6.75A1.75 1.75 0 0 1 7.75 5h8.5A1.75 1.75 0 0 1 18 6.75V20',
      'M3.5 20h17',
      'M9 9.25h1.75',
      'M13.25 9.25H15',
      'M9 12.75h1.75',
      'M13.25 12.75H15',
      'M11.25 20v-3.5h1.5V20',
    ],
  },
  person: {
    circles: [{ cx: 12, cy: 7.25, r: 3.15 }],
    paths: ['M5 19.25c1.55-3.45 4.08-5.18 7-5.18s5.45 1.73 7 5.18'],
  },
  briefcase: {
    paths: [
      'M4.75 8.5h14.5a1.75 1.75 0 0 1 1.75 1.75v7a1.75 1.75 0 0 1-1.75 1.75H4.75A1.75 1.75 0 0 1 3 17.25v-7A1.75 1.75 0 0 1 4.75 8.5Z',
      'M9 8.5V6.75A1.75 1.75 0 0 1 10.75 5h2.5A1.75 1.75 0 0 1 15 6.75V8.5',
      'M3 12.25h18',
    ],
  },
  book: {
    paths: [
      'M6.25 5.25h9.5A2.25 2.25 0 0 1 18 7.5v11.25H8.5A2.5 2.5 0 0 0 6 21.25V7.5a2.25 2.25 0 0 1 2.25-2.25Z',
      'M6 18.75c0-1.38 1.12-2.5 2.5-2.5H18',
      'M9.5 9.25h5',
      'M9.5 12.25h5',
    ],
  },
  note: {
    paths: [
      'M7.25 4.75h9.5A2.25 2.25 0 0 1 19 7v10a2.25 2.25 0 0 1-2.25 2.25h-9.5A2.25 2.25 0 0 1 5 17V7a2.25 2.25 0 0 1 2.25-2.25Z',
      'M8.75 9.25h6.5',
      'M8.75 12.25h6.5',
      'M8.75 15.25h4.5',
    ],
  },
}

const CANONICAL_STRUCTURE_BY_ENTITY = Object.freeze(
  Object.fromEntries((canonicalStructure?.entities || []).map((entity) => [entity.entity, entity])),
)

const CANONICAL_TOKEN_ALIAS_OVERRIDES = Object.freeze({
  Contacts: {
    Contact_ID: ['id'],
    Contact_DateTime_Stamp: ['updated_at', 'created_at'],
    Contact_Creator: ['created_by_label', 'created_by'],
    Contact_Name: ['Name'],
    Contact_PEmail: ['Personal_Email'],
    Contact_BEmail: ['Business_Email', 'Email'],
    Contact_Phone: ['Phone'],
    Contact_HQ: ['Country_based'],
    Contact_LinkedIn: ['LinkedIn'],
    Contact_Employment: [
      'Current_Companies',
      'Previous_Companies',
      'Current_Roles',
      'Role',
      'Expertise',
      'Tenure_at_Firm',
      'Tenure_at_Firm_yrs',
    ],
    Contact_Studies: ['Degrees_Program', 'University', 'Credentials'],
  },
  Companies: {
    Company_ID: ['id'],
    Company_Creator: ['created_by_label', 'created_by'],
    Company_DateTime_Stamp: ['updated_at', 'created_at'],
    Company_Status: ['Status'],
    Company_Short_Name: ['Short_Name'],
    Company_Website: ['Website'],
    Company_Tagline: ['One_Liner', 'Tagline'],
    Company_Legal_Name: ['Legal_Name', 'Company_Name'],
    Company_Inc_Date: ['Date_of_Incorporation'],
    Company_Inc_Country: ['Country_of_Incorporation', 'country_id'],
    Company_Entity_Type: ['Company_Type'],
    Company_Founders: ['Founders'],
    Company_HQ_Locations: ['HQ_Locations', 'country_id', 'city_id', 'region_id'],
    Company_Ops_Locations: ['Ops_Locations'],
    Company_Pax_Count: ['Pax'],
    Company_Pax_Known: ['Pax_Known'],
    Company_Description: ['Description'],
    Company_News: ['News'],
    Company_Updates: ['Updates'],
    Company_Objectives: ['Objectives'],
    Company_Products: ['Products'],
    Company_Key_Features: ['Key_Features'],
    Company_Backlog_Features: ['Backlog_Features'],
    Company_ICP: ['ICP'],
    Company_Business_Model: ['Business_Model'],
    Company_Pricing: ['Pricing'],
    Company_Placement: ['Placement'],
    Company_Promotion: ['Promotion'],
    Company_Market: ['Market'],
    Company_Demand_Analysis: ['Demand_Analysis'],
    Company_Supply_Analysis: ['Supply_Analysis'],
    Company_Traction: ['Traction'],
    Company_Sales: ['Sales'],
    Company_Revenue: ['Revenue'],
    Company_Clients_Analysis: ['Clients_Analysis'],
    Company_Cohorts_Analysis: ['Cohorts_Analysis'],
    Company_Costs_Direct: ['Costs_Direct'],
    Company_Costs_Indirect: ['Costs_Indirect'],
    Company_Costs_Marketing: ['Costs_Marketing'],
    Company_Unit_Economics: ['Unit_Economics'],
    Company_CAC: ['CAC'],
    Company_LTV: ['LTV'],
    Company_Costs_Admin: ['Costs_Admin'],
    Company_Costs_Tech_RD: ['Costs_Tech_RD'],
    Company_BP_Overview: ['BP_Overview'],
    Company_BP_Fcst: ['BP_Fcst'],
    Company_BP_ST_Obj: ['BP_ST_Obj'],
    Company_BP_LT_Obj: ['BP_LT_Obj'],
    Company_BP_Resources_Uses: ['BP_Resources_Uses'],
    Company_BP_Runway: ['BP_Runway'],
    Company_BP_Capital_Need: ['BP_Capital_Need'],
    Company_BP_Funding_Strategy: ['BP_Funding_Strategy'],
    Company_Amount_Raised: ['Amount_Raised_AUMs', 'Amount_Raised'],
  },
})

const isElectronRuntime = computed(() => {
  if (typeof navigator === 'undefined') return false
  return /Electron/i.test(navigator.userAgent || '')
})

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const hasBridge = computed(
  () =>
    !!bridge.value?.databooks?.view &&
    !!bridge.value?.databooks?.update &&
    !!bridge.value?.audit?.me,
)
const hasVersionBridge = computed(
  () =>
    !!bridge.value?.databooks?.versions &&
    !!bridge.value?.databooks?.viewSnapshot &&
    !!bridge.value?.audit?.events,
)

const loading = ref(false)
const error = ref('')
const fields = ref([])
const currentView = ref(null)
const actor = ref(null)
const editMode = ref(false)
const saving = ref(false)
const draftValues = ref({})
const showUserLabelDialog = ref(false)
const userLabelInput = ref('')
const savingUserLabel = ref(false)
const versions = ref([])
const selectedVersionId = ref(null)
const modifiedByMap = ref({})
const activeContactSection = ref('general-information')
const activeCompanySection = ref('general-information')
const activeGenericSection = ref('')
const activeContactKdbSection = ref('artifacts')
const contactKdbViewMode = ref('grid')
const contactKdbKindFilter = ref('all')
const contactKdbSearchQuery = ref('')
const activeCompanyKdbSection = ref('contacts')
const companyKdbViewMode = ref('grid')
const companyKdbKindFilter = ref('all')
const companyKdbSearchQuery = ref('')
const activeGenericKdbSection = ref('')
const genericKdbViewMode = ref('grid')
const genericKdbKindFilter = ref('all')
const genericKdbSearchQuery = ref('')
const contactHeroRef = ref(null)
const contactImageInput = ref(null)
const currentImageUploadTarget = ref('contact')
const uploadingContactImage = ref(false)
const showContactImageCropDialog = ref(false)
const pendingContactImageSrc = ref('')
const pendingContactImageNaturalSize = ref({ width: 0, height: 0 })
const contactImageCropZoom = ref(1)
const contactImageCropOffset = ref({ x: 0, y: 0 })
const selectedContactSummaryStatIds = ref([])
const selectedCompanySummaryStatIds = ref([])
const contactNotes = ref([])
const companyNotes = ref([])
const contactDocuments = ref([])
const companyDocuments = ref([])
const companyLinkedContacts = ref([])
const companyLinkedRounds = ref([])
const companyLinkedFunds = ref([])
const contactHeroPanelTab = ref('documents')
const companyHeroPanelTab = ref('documents')
const contactFeedChannel = ref('linkedin')
const contactFeedChannelOptions = [
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Mail', value: 'mail' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'X', value: 'x' },
]
const contactDocumentsDragOver = ref(false)
const uploadingContactDocuments = ref(false)
const workspaceRoot = ref('')
const activeDocumentActionKey = ref('')
const showDocumentPreviewDialog = ref(false)
const documentPreviewLoading = ref(false)
const genericRecordNotes = ref([])
const genericHeroPanelTab = ref('notes')
const genericRecordFeedChannel = ref('linkedin')
const documentPreview = ref({
  artifactId: '',
  fileName: '',
  kind: '',
  fileUrl: '',
  fileDataBase64: '',
  content: '',
})
const pdfPreviewDocument = shallowRef(null)
const pdfPreviewPages = ref([])
const pdfPreviewSelectedPage = ref(1)
const pdfPreviewCurrentPageSrc = ref('')
let pdfPreviewRequestToken = 0
const contactHeroGradient = ref({ ...CONTACT_HERO_GRADIENT_DEFAULT })
let contactHeroTrackingActive = false

const isHistoricalMode = computed(() => !!selectedVersionId.value)
const tableNameParam = computed(() => String(route.params.tableName || '').trim())
const recordIdParam = computed(() => String(route.params.recordId || '').trim())
const entityLabel = computed(
  () => currentView.value?.entity_label || TABLE_LABELS[tableNameParam.value] || 'Record',
)
const databookTitle = computed(() => {
  const name = String(currentView.value?.entity_name || '').trim()
  if (name) return `${name} Record`
  return recordIdParam.value ? `${recordIdParam.value} Record` : 'Record'
})
const returnToPath = computed(() => String(route.query.returnTo || '').trim())
const backLink = computed(
  () => TABLE_LIST_ROUTES[currentView.value?.table_name || tableNameParam.value] || null,
)
const isContactView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Contacts',
)
const isCompanyView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Companies',
)
const isUserView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Users',
)
const isArtifactView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Artifacts',
)
const isProjectView = computed(
  () => ['Projects', 'Pipelines'].includes(currentView.value?.table_name || tableNameParam.value),
)
const isOpportunityRecordView = computed(() =>
  ['Opportunities', 'Funds', 'Rounds'].includes(currentView.value?.table_name || tableNameParam.value),
)
const isTaskView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Tasks',
)
const isNoteView = computed(
  () => (currentView.value?.table_name || tableNameParam.value) === 'Notes',
)
const isStructuredGenericRecordView = computed(
  () =>
    isUserView.value ||
    isArtifactView.value ||
    isProjectView.value ||
    isOpportunityRecordView.value ||
    isTaskView.value ||
    isNoteView.value,
)
const isStructuredDatabookView = computed(
  () => isContactView.value || isCompanyView.value || isStructuredGenericRecordView.value,
)
const fieldByName = computed(() =>
  Object.fromEntries((fields.value || []).map((field) => [field.field_name, field])),
)
const contactImageField = computed(() => fieldByName.value.Profile_Image || null)
const companyLogoField = computed(() => fieldByName.value.Company_Logo || null)
const contactName = computed(() => getFieldDisplayValue('Name'))
const contactRole = computed(() => getFieldDisplayValue('Role'))
const contactCompany = computed(() =>
  getFieldDisplayValue('Current_Company_Name') ||
  getFieldDisplayValue('Company_Name') ||
  getFieldDisplayValue('company_name') ||
  getFieldDisplayValue('Organization_Name'),
)
const contactRoleCompany = computed(() => {
  if (contactRole.value && contactCompany.value) return `${contactRole.value} • ${contactCompany.value}`
  return contactRole.value || contactCompany.value || ''
})
const contactLocation = computed(() => getFieldDisplayValue('Country_based'))
const contactAvatarImage = computed(() => getFieldDisplayValue('Profile_Image'))
const hasContactCustomImage = computed(() => String(getFieldDisplayValue('Profile_Image') || '').trim().length > 0)
const contactInitials = computed(() => {
  const label = contactName.value || 'Contact'
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'CO'
  )
})
const contactAvatarColor = computed(() => {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(contactName.value || 'Contact')) % palette.length]
})
const companyLogoImage = computed(() => getFieldDisplayValue('Company_Logo'))
const hasCompanyCustomLogo = computed(() => String(getFieldDisplayValue('Company_Logo') || '').trim().length > 0)
const isCompanyImageCropTarget = computed(() => currentImageUploadTarget.value === 'company')
const contactImageCropFrameWidth = computed(() =>
  isCompanyImageCropTarget.value
    ? CONTACT_IMAGE_CROP_COMPANY_FRAME_SIZE
    : CONTACT_IMAGE_CROP_CONTACT_FRAME_WIDTH,
)
const contactImageCropFrameHeight = computed(() =>
  isCompanyImageCropTarget.value
    ? CONTACT_IMAGE_CROP_COMPANY_FRAME_SIZE
    : CONTACT_IMAGE_CROP_CONTACT_FRAME_HEIGHT,
)
const contactImageOutputWidth = computed(() =>
  isCompanyImageCropTarget.value ? CONTACT_IMAGE_OUTPUT_COMPANY_SIZE : CONTACT_IMAGE_OUTPUT_CONTACT_WIDTH,
)
const contactImageOutputHeight = computed(() =>
  isCompanyImageCropTarget.value ? CONTACT_IMAGE_OUTPUT_COMPANY_SIZE : CONTACT_IMAGE_OUTPUT_CONTACT_HEIGHT,
)
const contactImageCropFrameStyle = computed(() => ({
  width: `${contactImageCropFrameWidth.value}px`,
  height: `${contactImageCropFrameHeight.value}px`,
}))
const contactImageCropCaption = computed(() =>
  isCompanyImageCropTarget.value
    ? 'Drag to position the logo inside the circular frame.'
    : 'Drag to reposition and use zoom to fit the portrait frame.',
)
const contactImageCropBaseScale = computed(() => {
  const { width, height } = pendingContactImageNaturalSize.value
  if (!width || !height) return 1
  return Math.max(contactImageCropFrameWidth.value / width, contactImageCropFrameHeight.value / height)
})
const contactImageCropDisplaySize = computed(() => ({
  width: pendingContactImageNaturalSize.value.width * contactImageCropBaseScale.value * contactImageCropZoom.value,
  height:
    pendingContactImageNaturalSize.value.height * contactImageCropBaseScale.value * contactImageCropZoom.value,
}))
const contactImageCropStyle = computed(() => ({
  width: `${contactImageCropDisplaySize.value.width}px`,
  height: `${contactImageCropDisplaySize.value.height}px`,
  transform: `translate(-50%, -50%) translate(${contactImageCropOffset.value.x}px, ${contactImageCropOffset.value.y}px)`,
}))
const contactFilledFieldCount = computed(() =>
  countFilledContactFields(
    fields.value.map((field) => ({
      field_name: field.field_name,
      value: getFieldDisplayValue(field.field_name),
    })),
  ),
)
const contactHeroTheme = computed(() => getContactCompletenessTheme(contactFilledFieldCount.value))
const contactHeroStyle = computed(() => ({
  '--contact-hero-blob-x': `${contactHeroGradient.value.x}%`,
  '--contact-hero-blob-y': `${contactHeroGradient.value.y}%`,
  '--contact-hero-blob-size': `${contactHeroGradient.value.size}%`,
  '--contact-hero-blob-strong': contactHeroTheme.value.blobStrong,
  '--contact-hero-blob-soft': contactHeroTheme.value.blobSoft,
  '--contact-hero-blob-fade': contactHeroTheme.value.blobFade,
}))
const contactHeroPills = computed(() =>
  [
    getContactPill('Stakeholder_type', 'Stakeholder'),
    getContactPill('Closeness_Level', 'Closeness'),
  ].filter(Boolean),
)
const contactSummaryStorageKey = computed(() => {
  const userKey = normalizeUserLabel(actor.value?.user_label || '') || 'guest'
  return `ecvc.contactSummary.${userKey}`
})
const companySummaryStorageKey = computed(() => {
  const userKey = normalizeUserLabel(actor.value?.user_label || '') || 'guest'
  return `ecvc.companySummary.${userKey}`
})
const availableContactSummaryOptions = computed(() =>
  CONTACT_SUMMARY_OPTIONS.map((option) => ({
    ...option,
    value: resolveContactSummaryValue(option),
  })),
)
const availableCompanySummaryOptions = computed(() =>
  COMPANY_SUMMARY_OPTIONS.map((option) => ({
    ...option,
    value: resolveCompanySummaryValue(option),
  })),
)
const companyName = computed(() => getFieldDisplayValue('Company_Name'))
const companyType = computed(() => getFieldDisplayValue('Company_Type'))
const companyOneLiner = computed(() => getFieldDisplayValue('One_Liner'))
const companyWebsite = computed(() => getFieldDisplayValue('Website'))
const companyInitials = computed(() => {
  const label = companyName.value || 'Company'
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'CO'
  )
})
const companyAvatarColor = computed(() => {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(companyName.value || 'Company')) % palette.length]
})
const companyHeroPills = computed(() =>
  [
    getCompanyPill('Company_Type', 'Type'),
    getCompanyPill('Status', 'Status'),
    getCompanyPill('Date_of_Incorporation', 'Founded'),
    getCompanyPill('Pax', 'Team'),
  ].filter(Boolean),
)
const companySummaryStats = computed(() => {
  const selectedIds = new Set(selectedCompanySummaryStatIds.value)
  return availableCompanySummaryOptions.value
    .filter((option) => selectedIds.has(option.id))
    .map((option) => ({
      ...option,
      displayValue: option.value || 'Not added yet',
    }))
})
const companyActionLinks = computed(() => {
  const website = companyWebsite.value
  return [
    website
      ? {
          label: 'Website',
          icon: 'public',
          href: normalizeExternalUrl(website),
          external: true,
        }
      : null,
  ].filter(Boolean)
})
const contactActionLinks = computed(() => {
  const email = getFieldDisplayValue('Email')
  const phone = getFieldDisplayValue('Phone')
  return [
    email ? { label: 'Email', icon: 'mail', href: `mailto:${email}`, external: false } : null,
    phone ? { label: 'Message', icon: 'chat_bubble', href: `sms:${phone}`, external: false } : null,
    phone ? { label: 'Phone', icon: 'call', href: `tel:${phone}`, external: false } : null,
  ].filter(Boolean)
})
function slugifyCanonicalSection(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatCanonicalLabel(value, entityPrefix = '') {
  const raw = String(value || '').trim()
  if (!raw) return ''
  const withoutPrefix = entityPrefix && raw.startsWith(`${entityPrefix}_`) ? raw.slice(entityPrefix.length + 1) : raw
  const label = withoutPrefix
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
  if (/^general information$/i.test(label)) return 'General'
  if (/^system data$/i.test(label)) return 'System'
  if (/^kdb relations$/i.test(label)) return 'KDB'
  if (/^inc info$/i.test(label)) return 'Incorporation'
  if (/^docs$/i.test(label)) return 'Documents'
  if (/^ops overview$/i.test(label)) return 'Operations'
  if (/^business overview$/i.test(label)) return 'Business'
  if (/^market overview$/i.test(label)) return 'Market'
  if (/^results overview$/i.test(label)) return 'Results'
  if (/^business plan$/i.test(label)) return 'Planning'
  return label
}

function getCanonicalSectionIcon(subsection) {
  const normalized = String(subsection || '').trim()
  if (/general|contact/i.test(normalized)) return CONTACT_SECTION_ICONS.person
  if (/employment|ops|plan|fund/i.test(normalized)) return CONTACT_SECTION_ICONS.briefcase
  if (/studies|docs|business|market|results/i.test(normalized)) return CONTACT_SECTION_ICONS.book
  if (/kdb/i.test(normalized)) return CONTACT_SECTION_ICONS.note
  return CONTACT_SECTION_ICONS.building
}

function getCanonicalTokenAliases(entityName, tokenName) {
  const overrides = CANONICAL_TOKEN_ALIAS_OVERRIDES[entityName]?.[tokenName]
  if (overrides?.length) return overrides

  const entityPrefix = entityName === 'Contacts' ? 'Contact' : entityName === 'Companies' ? 'Company' : ''
  const stripped = entityPrefix && tokenName.startsWith(`${entityPrefix}_`) ? tokenName.slice(entityPrefix.length + 1) : ''
  return [tokenName, stripped].filter(Boolean)
}

function createCanonicalSection(entityName, subsectionConfig = {}) {
  const entityPrefix = entityName === 'Contacts' ? 'Contact' : entityName === 'Companies' ? 'Company' : ''
  const subsectionName = String(subsectionConfig.subsection || '').trim()
  const sectionFields = (subsectionConfig.tokens || [])
    .map((token) =>
      resolveDatabookField({
        label: formatCanonicalLabel(token?.token_name, entityPrefix),
        aliases: getCanonicalTokenAliases(entityName, String(token?.token_name || '').trim()),
      }),
    )
    .filter(Boolean)

  return {
    anchor: slugifyCanonicalSection(subsectionName),
    category: formatCanonicalLabel(subsectionName),
    title: formatCanonicalLabel(subsectionName),
    icon: getCanonicalSectionIcon(subsectionName),
    caption: '',
    layout: 'grid',
    fields: sectionFields,
    isKdb: /kdb/i.test(subsectionName),
    isSystem: /system/i.test(subsectionName),
  }
}

function createCanonicalGeneralInformationFallback(entityName) {
  const aliasesByEntity = {
    Contacts: ['Name', 'Personal_Email', 'Business_Email', 'Phone', 'Country_based', 'LinkedIn'],
    Companies: ['Company_Name', 'Short_Name', 'One_Liner', 'Website', 'Status'],
  }
  const fields = (aliasesByEntity[entityName] || [])
    .map((alias) =>
      resolveDatabookField({
        label: formatCanonicalLabel(alias, entityName === 'Contacts' ? 'Contact' : 'Company'),
        aliases: [alias],
      }),
    )
    .filter(Boolean)

  return {
    anchor: 'general-information',
    category: 'General',
    title: 'General',
    icon: CONTACT_SECTION_ICONS.person,
    caption: '',
    layout: 'grid',
    fields,
    isKdb: false,
    isSystem: false,
  }
}

function orderCanonicalSectionsForNav(entityName, sections = []) {
  const normalizedSections = [...sections]
  const generalIndex = normalizedSections.findIndex((section) => /^general( information)?$/i.test(section.title))
  const kdbIndex = normalizedSections.findIndex((section) => section.isKdb)
  const systemIndex = normalizedSections.findIndex((section) => section.isSystem)

  const ordered = []
  if (generalIndex > -1) {
    ordered.push(normalizedSections[generalIndex])
  } else {
    ordered.push(createCanonicalGeneralInformationFallback(entityName))
  }

  const middleSections = normalizedSections.filter(
    (_, index) => index !== generalIndex && index !== kdbIndex && index !== systemIndex,
  )
  if (entityName === 'Companies') {
    const preferredOrder = [
      'Business',
      'Market',
      'Operations',
      'Results',
      'Planning',
      'Fund Raising',
      'Documents',
      'Incorporation',
    ]
    const rank = Object.fromEntries(preferredOrder.map((label, index) => [label.toLowerCase(), index]))
    middleSections
      .map((section, index) => ({ section, index }))
      .sort((a, b) => {
        const aRank = rank[String(a.section.title || '').toLowerCase()]
        const bRank = rank[String(b.section.title || '').toLowerCase()]
        const aScore = Number.isInteger(aRank) ? aRank : Number.MAX_SAFE_INTEGER
        const bScore = Number.isInteger(bRank) ? bRank : Number.MAX_SAFE_INTEGER
        if (aScore !== bScore) return aScore - bScore
        return a.index - b.index
      })
      .forEach(({ section }) => ordered.push(section))
  } else {
    middleSections.forEach((section) => ordered.push(section))
  }

  if (kdbIndex > -1) {
    ordered.push({ ...normalizedSections[kdbIndex], isKdb: true })
  }

  if (systemIndex > -1) {
    ordered.push({ ...normalizedSections[systemIndex], isSystem: true })
  }

  return ordered
}

function getCanonicalEntitySections(entityName) {
  const sections = (CANONICAL_STRUCTURE_BY_ENTITY[entityName]?.subsections || []).map((subsection) =>
    createCanonicalSection(entityName, subsection),
  )
  return orderCanonicalSectionsForNav(entityName, sections)
}

const companySections = computed(() => getCanonicalEntitySections('Companies'))
const contactSections = computed(() => getCanonicalEntitySections('Contacts'))
const companyNavItems = computed(() => {
  const hasKdb = companySections.value.some((section) => section.isKdb)
  return companySections.value.map((section) => ({
    anchor: section.anchor,
    title: section.title,
    isKdb: section.isKdb,
    isSystem: section.isSystem,
    pushRight: section.isKdb || (section.isSystem && !hasKdb),
  }))
})
const activeCompanyContentSection = computed(
  () => companySections.value.find((section) => section.anchor === activeCompanySection.value) || null,
)
const contactNavItems = computed(() => {
  const hasKdb = contactSections.value.some((section) => section.isKdb)
  return contactSections.value.map((section) => ({
    anchor: section.anchor,
    title: section.title,
    isKdb: section.isKdb,
    isSystem: section.isSystem,
    pushRight: section.isKdb || (section.isSystem && !hasKdb),
  }))
})
const activeContentSection = computed(
  () => contactSections.value.find((section) => section.anchor === activeContactSection.value) || null,
)
const GENERIC_METADATA_SECTION_LABEL = 'System Data'
const GENERIC_GENERAL_SECTION_LABEL = 'General Information'
const GENERIC_KDB_SECTION_LABEL = 'KDB Relationships'
const GENERIC_SECTION_CONTRACTS = Object.freeze({
  Users: {
    sections: [GENERIC_METADATA_SECTION_LABEL, GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'User_Name', 'User_PEmail', 'created_at', 'updated_at'],
      [GENERIC_KDB_SECTION_LABEL]: [],
    },
  },
  Artifacts: {
    sections: [GENERIC_METADATA_SECTION_LABEL, GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: [
        'artifact_id',
        'created_by',
        'artifact_format',
        'type',
        'title',
        'description',
        'created_at',
        'updated_at',
      ],
      [GENERIC_KDB_SECTION_LABEL]: ['round_id', 'fund_id'],
    },
  },
  Notes: {
    sections: [GENERIC_METADATA_SECTION_LABEL, GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'created_by', 'Note_Name', 'Note_Content', 'created_at', 'updated_at'],
      [GENERIC_KDB_SECTION_LABEL]: [],
    },
  },
  Projects: {
    sections: [GENERIC_METADATA_SECTION_LABEL, 'Overview', 'Team', GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'created_by', 'Project_Name', 'created_at', 'updated_at'],
      Overview: [
        'Project_Status',
        'Project_Priority_Rank',
        'Project_Start_Date',
        'Project_Due_Date',
        'Project_End_Date',
        'Project_Target_Amount',
        'Project_Summary',
        'install_status',
        'install_error',
        'installed_at',
      ],
      Team: [
        'Project_Team_Owner',
        'Project_Team_Lead',
        'Project_Team_Senior',
        'Project_Team_Mid',
        'Project_Team_Junior',
        'Project_Team_Agents',
        'Project_Team_Other',
        'Project_Team',
      ],
      [GENERIC_KDB_SECTION_LABEL]: [
        'Project_Artifact',
        'Project_User',
        'Project_Contact',
        'Project_Company',
        'Project_Fund',
        'Project_Round',
        'Project_Project',
        'Project_Task',
        'Project_Note',
      ],
    },
  },
  Pipelines: {
    sections: [GENERIC_METADATA_SECTION_LABEL, 'Overview', 'Team', GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'created_by', 'Project_Name', 'created_at', 'updated_at'],
      Overview: [
        'Project_Status',
        'Project_Priority_Rank',
        'Project_Start_Date',
        'Project_Due_Date',
        'Project_End_Date',
        'Project_Target_Amount',
        'Project_Summary',
        'install_status',
        'install_error',
        'installed_at',
      ],
      Team: [
        'Project_Team_Owner',
        'Project_Team_Lead',
        'Project_Team_Senior',
        'Project_Team_Mid',
        'Project_Team_Junior',
        'Project_Team_Agents',
        'Project_Team_Other',
        'Project_Team',
      ],
      [GENERIC_KDB_SECTION_LABEL]: [
        'Project_Artifact',
        'Project_User',
        'Project_Contact',
        'Project_Company',
        'Project_Fund',
        'Project_Round',
        'Project_Project',
        'Project_Task',
        'Project_Note',
      ],
    },
  },
  Tasks: {
    sections: [GENERIC_METADATA_SECTION_LABEL, 'Overview', 'Team', GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'created_by', 'Task_Name', 'created_at', 'updated_at'],
      Overview: ['Task_Summary', 'Task_Status', 'Task_Priority_Rank', 'Task_Start_Date', 'Task_Due_Date', 'Task_End_Date'],
      Team: ['Task_Team_Owner', 'Task_Team_Assigned', 'Task_Team_Support', 'Task_Team'],
      [GENERIC_KDB_SECTION_LABEL]: [
        'Task_Artifact',
        'Task_User',
        'Task_Contact',
        'Task_Company',
        'Task_Fund',
        'Task_Round',
        'Task_Project',
        'Task_Task',
        'Task_Note',
      ],
    },
  },
  Funds: {
    sections: [GENERIC_METADATA_SECTION_LABEL, 'Overview', 'Economics', 'Controls', GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'Fund_Name', 'created_by', 'created_at', 'updated_at'],
      Overview: [
        'Fund_Raising_Status',
        'Fund_Period',
        'Fund_Target_Size',
        'Fund_Commited_Amounts',
        'Fund_Min_Ticket_Size',
        'Fund_Close_Date',
        'Fund_Summary',
        'Fund_Reserve',
        'Fund_Initial_Ticket_Size',
        'Fund_Target_Positions',
        'Fund_Target_Regions',
        'Fund_Target_Asset_Types',
        'Fund_Target_Industries',
        'Fund_Target_Stages',
        'Fund_Other',
        'Fund_Manager',
      ],
      Economics: [
        'Fund_Economic_Provisions',
        'Fund_Fees',
        'Fund_Promote',
        'Fund_Target_Hurdles',
        'Fund_Target_MOIC',
        'Fund_Strategy',
        'Fund_Economics',
      ],
      Controls: [
        'Fund_Control_Provisions',
        'Fund_Information_Rights',
        'Fund_Board_Representation',
        'Fund_Item_Voting',
        'Fund_Controls',
      ],
      [GENERIC_KDB_SECTION_LABEL]: [
        'Fund_Artifact',
        'Fund_User',
        'Fund_Contact',
        'Fund_Company',
        'Fund_Fund',
        'Fund_Round',
        'Fund_Project',
        'Fund_Task',
        'Fund_Note',
      ],
    },
  },
  Rounds: {
    sections: [GENERIC_METADATA_SECTION_LABEL, 'Overview', 'Economics', 'Controls', GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: ['id', 'Round_Name', 'created_by', 'created_at', 'updated_at'],
      Overview: [
        'Round_Raising_Status',
        'Round_Security_Type',
        'Round_Target_Size',
        'Round_Commited_Amounts',
        'Round_Min_Ticket_Size',
        'Round_Close_Date',
        'Round_Summary',
        'Round_Sponsor',
      ],
      Economics: [
        'Round_Pre_Valuation',
        'Round_Post_Valuation',
        'Round_Previous_Post_Valuation',
        'Round_Economic_Provisions',
        'Round_Liquidation_Preference',
        'Round_Drag_Tag',
        'Round_Put_Call',
        'Round_Conversion',
        'Round_Economics',
      ],
      Controls: [
        'Round_Control_Provisions',
        'Round_Information_Rights',
        'Round_Board_Representation',
        'Round_Item_Voting',
        'Round_Controls',
      ],
      [GENERIC_KDB_SECTION_LABEL]: [
        'Round_Artifact',
        'Round_User',
        'Round_Contact',
        'Round_Company',
        'Round_Fund',
        'Round_Project',
        'Round_Task',
        'Round_Note',
      ],
    },
  },
  Opportunities: {
    sections: [GENERIC_METADATA_SECTION_LABEL, 'Overview', 'Economics', 'Controls', GENERIC_KDB_SECTION_LABEL],
    fieldsBySection: {
      [GENERIC_METADATA_SECTION_LABEL]: [],
      Overview: [],
      Economics: [],
      Controls: [],
      [GENERIC_KDB_SECTION_LABEL]: [],
    },
  },
})

function normalizeGenericSectionLabel(sectionName) {
  const raw = String(sectionName || '').trim()
  if (!raw) return ''
  if (/kdb/i.test(raw)) return GENERIC_KDB_SECTION_LABEL
  if (/general/i.test(raw)) return GENERIC_GENERAL_SECTION_LABEL
  if (raw === entityLabel.value) return GENERIC_METADATA_SECTION_LABEL
  return raw
}

function getPayloadSectionContract() {
  const sections = Array.isArray(currentView.value?.sections) ? currentView.value.sections : []
  if (!sections.length) return null

  return {
    sections: sections.map((section) => String(section?.label || '').trim()).filter(Boolean),
    fieldsBySection: Object.fromEntries(
      sections.map((section) => [
        String(section?.label || '').trim(),
        (Array.isArray(section?.items) ? section.items : [])
          .map((item) => String(item?.field_name || '').trim())
          .filter(Boolean),
      ]),
    ),
  }
}

function getGenericSectionContract(tableName) {
  const payloadContract = getPayloadSectionContract()
  if (payloadContract?.sections?.length) return payloadContract
  return GENERIC_SECTION_CONTRACTS[tableName] || null
}

function getGenericSectionFieldLookup(tableName) {
  const contract = getGenericSectionContract(tableName)
  if (!contract) return null

  return Object.fromEntries(
    Object.entries(contract.fieldsBySection || {}).flatMap(([sectionLabel, fieldNames]) =>
      (fieldNames || []).map((fieldName) => [String(fieldName), sectionLabel]),
    ),
  )
}

function resolveGenericFieldSection(field) {
  const tableName = structuredRecordTableName.value
  const fieldName = String(field?.field_name || '').trim()
  const fieldLookup = getGenericSectionFieldLookup(tableName)
  if (fieldLookup?.[fieldName]) {
    return fieldLookup[fieldName]
  }

  const contract = getGenericSectionContract(tableName)
  if (contract) return GENERIC_METADATA_SECTION_LABEL
  return normalizeGenericSectionLabel(field?.section)
}

const genericRecordNavItems = computed(() => {
  const tableName = structuredRecordTableName.value
  const contract = getGenericSectionContract(tableName)
  const preferredMiddleOrderByTable = {
    Companies: ['Business', 'Market', 'Operations', 'Results', 'Planning', 'Fund Raising', 'Documents', 'Incorporation'],
  }

  const mapSectionTitle = (sectionLabel) =>
    formatCanonicalLabel(String(sectionLabel || '').trim().replace(/\s+/g, '_'))

  const buildOrderedSectionLabels = (sections = []) => {
    const unique = []
    sections.forEach((section) => {
      const value = String(section || '').trim()
      if (!value) return
      if (!unique.includes(value)) unique.push(value)
    })

    const general = unique.find((section) => /general/i.test(section))
    const system = unique.find((section) => /system data/i.test(section))
    const kdb = unique.find((section) => /kdb/i.test(section))
    const middle = unique.filter((section) => section !== general && section !== system && section !== kdb)

    if (tableName === 'Companies') {
      const preferred = preferredMiddleOrderByTable.Companies
      const rank = Object.fromEntries(preferred.map((label, index) => [label.toLowerCase(), index]))
      middle.sort((a, b) => {
        const aTitle = mapSectionTitle(a).toLowerCase()
        const bTitle = mapSectionTitle(b).toLowerCase()
        const aRank = Number.isInteger(rank[aTitle]) ? rank[aTitle] : Number.MAX_SAFE_INTEGER
        const bRank = Number.isInteger(rank[bTitle]) ? rank[bTitle] : Number.MAX_SAFE_INTEGER
        if (aRank !== bRank) return aRank - bRank
        return unique.indexOf(a) - unique.indexOf(b)
      })
    }

    return [
      general || GENERIC_GENERAL_SECTION_LABEL,
      ...middle,
      ...(kdb ? [kdb] : []),
      ...(system ? [system] : []),
    ]
  }

  const toNavObjects = (orderedSections = []) => {
    const hasKdb = orderedSections.some((section) => /kdb/i.test(section))
    return orderedSections.map((section) => {
      const value = String(section || '').trim()
      const isKdb = /kdb/i.test(value)
      const isSystem = /system data/i.test(value)
      return {
        value,
        title: mapSectionTitle(value),
        isKdb,
        isSystem,
        pushRight: isKdb || (isSystem && !hasKdb),
      }
    })
  }

  if (contract?.sections?.length) {
    return toNavObjects(buildOrderedSectionLabels(contract.sections))
  }

  const seen = new Set()
  const discovered = (fields.value || [])
    .map((field) => resolveGenericFieldSection(field))
    .filter((section) => {
      if (!section || section === GENERIC_KDB_SECTION_LABEL || seen.has(section)) return false
      seen.add(section)
      return true
    })
  return toNavObjects(buildOrderedSectionLabels(discovered))
})
const activeGenericNavTitle = computed(
  () => genericRecordNavItems.value.find((section) => section.value === activeGenericSection.value)?.title || '',
)
const structuredRecordThemeMap = {
  Users: {
    strong: 'rgba(31, 111, 235, 0.2)',
    soft: 'rgba(31, 111, 235, 0.14)',
    fade: 'rgba(31, 111, 235, 0.06)',
  },
  Artifacts: {
    strong: 'rgba(147, 51, 234, 0.2)',
    soft: 'rgba(147, 51, 234, 0.14)',
    fade: 'rgba(147, 51, 234, 0.06)',
  },
  Opportunities: {
    strong: 'rgba(249, 115, 22, 0.2)',
    soft: 'rgba(249, 115, 22, 0.14)',
    fade: 'rgba(249, 115, 22, 0.06)',
  },
  Funds: {
    strong: 'rgba(16, 185, 129, 0.2)',
    soft: 'rgba(16, 185, 129, 0.14)',
    fade: 'rgba(16, 185, 129, 0.06)',
  },
  Rounds: {
    strong: 'rgba(245, 158, 11, 0.2)',
    soft: 'rgba(245, 158, 11, 0.14)',
    fade: 'rgba(245, 158, 11, 0.06)',
  },
  Projects: {
    strong: 'rgba(37, 99, 235, 0.2)',
    soft: 'rgba(37, 99, 235, 0.14)',
    fade: 'rgba(37, 99, 235, 0.06)',
  },
  Pipelines: {
    strong: 'rgba(37, 99, 235, 0.2)',
    soft: 'rgba(37, 99, 235, 0.14)',
    fade: 'rgba(37, 99, 235, 0.06)',
  },
}
const structuredRecordTableName = computed(() => currentView.value?.table_name || tableNameParam.value)
const structuredRecordHeroStyle = computed(() => {
  if (isContactView.value || isCompanyView.value) return contactHeroStyle.value
  const theme = structuredRecordThemeMap[structuredRecordTableName.value] || structuredRecordThemeMap.Users
  return {
    '--contact-hero-blob-x': `${contactHeroGradient.value.x}%`,
    '--contact-hero-blob-y': `${contactHeroGradient.value.y}%`,
    '--contact-hero-blob-size': `${contactHeroGradient.value.size}%`,
    '--contact-hero-blob-strong': theme.strong,
    '--contact-hero-blob-soft': theme.soft,
    '--contact-hero-blob-fade': theme.fade,
  }
})

function getFirstFieldValue(aliases = []) {
  return aliases.map((alias) => getFieldDisplayValue(alias)).find((value) => String(value || '').trim()) || ''
}

const genericRecordConfig = computed(() => {
  const tableName = structuredRecordTableName.value
  const base = {
    primaryAliases: ['Name', 'title', 'Title', 'artifact_id', 'id'],
    subtitleAliases: ['Role', 'Status', 'One_Liner', 'description', 'artifact_type'],
    secondaryAliases: ['Country_based', 'Website', 'updated_at', 'created_at'],
    pillAliases: ['Type', 'Status', 'artifact_format', 'stage'],
  }

  const byTable = {
    Users: {
      primaryAliases: ['User_Name', 'Name', 'id'],
      subtitleAliases: ['User_PEmail', 'Professional_Email', 'Email'],
      secondaryAliases: ['Country_based', 'Phone', 'LinkedIn'],
      pillAliases: ['Country_based', 'LinkedIn'],
    },
    Artifacts: {
      primaryAliases: ['title', 'Title', 'artifact_id', 'id'],
      subtitleAliases: ['artifact_type', 'artifact_format', 'description'],
      secondaryAliases: ['created_at', 'updated_at', 'opportunity_id'],
      pillAliases: ['artifact_type', 'artifact_format', 'source_type'],
    },
    Opportunities: {
      primaryAliases: ['Venture_Oppty_Name', 'Opportunity_Name', 'name', 'id'],
      subtitleAliases: ['Status', 'Stage', 'Round_Type'],
      secondaryAliases: ['Amount_Target', 'company_id', 'updated_at'],
      pillAliases: ['Status', 'Stage', 'Round_Type'],
    },
    Funds: {
      primaryAliases: ['Fund_Name', 'name', 'id'],
      subtitleAliases: ['Fund_Raising_Status', 'Fund_Strategy'],
      secondaryAliases: ['Fund_Target_Size', 'Fund_Close_Date', 'updated_at'],
      pillAliases: ['Fund_Raising_Status', 'Fund_Strategy'],
    },
    Rounds: {
      primaryAliases: ['Round_Name', 'name', 'id'],
      subtitleAliases: ['Round_Raising_Status', 'Round_Type'],
      secondaryAliases: ['Round_Target_Size', 'Round_Close_Date', 'updated_at'],
      pillAliases: ['Round_Raising_Status', 'Round_Type'],
    },
    Projects: {
      primaryAliases: ['Project_Name', 'name', 'id'],
      subtitleAliases: ['Status', 'Stage'],
      secondaryAliases: ['Owner', 'updated_at', 'created_at'],
      pillAliases: ['Status', 'Stage'],
    },
    Pipelines: {
      primaryAliases: ['Project_Name', 'name', 'id'],
      subtitleAliases: ['Status', 'Stage'],
      secondaryAliases: ['Owner', 'updated_at', 'created_at'],
      pillAliases: ['Status', 'Stage'],
    },
  }

  return { ...base, ...(byTable[tableName] || {}) }
})
const genericRecordName = computed(
  () =>
    getFirstFieldValue(genericRecordConfig.value.primaryAliases) ||
    String(currentView.value?.entity_name || '').trim() ||
    `${entityLabel.value} ${recordIdParam.value || 'Record'}`,
)
const genericRecordSubtitle = computed(
  () => getFirstFieldValue(genericRecordConfig.value.subtitleAliases) || `${entityLabel.value} record`,
)
const genericRecordSecondaryLine = computed(
  () => getFirstFieldValue(genericRecordConfig.value.secondaryAliases) || `Record ID ${recordIdParam.value || '-'}`,
)
const genericRecordInitials = computed(() => {
  const label = genericRecordName.value || entityLabel.value || 'Record'
  return (
    label
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase?.() || '')
      .join('') || 'RE'
  )
})
const genericRecordAvatarColor = computed(() => {
  const palette = ['#111111', '#2b2b2b', '#444444', '#5c5c5c', '#747474', '#8b8b8b']
  return palette[Math.abs(hashString(`${structuredRecordTableName.value}:${genericRecordName.value}`)) % palette.length]
})
const genericRecordPills = computed(() =>
  genericRecordConfig.value.pillAliases
    .map((alias) => getFieldDisplayValue(alias))
    .filter((value, index, values) => String(value || '').trim() && values.indexOf(value) === index)
    .slice(0, 3),
)
const genericRecordActionLinks = computed(() => {
  const email = getFirstFieldValue(['User_PEmail', 'Professional_Email', 'Email'])
  const phone = getFirstFieldValue(['Phone'])
  const website = getFirstFieldValue(['Website', 'LinkedIn'])
  return [
    email ? { label: 'Email', icon: 'mail', href: `mailto:${email}`, external: false } : null,
    phone ? { label: 'Phone', icon: 'call', href: `tel:${phone}`, external: false } : null,
    website ? { label: 'Open', icon: 'public', href: normalizeExternalUrl(website), external: true } : null,
  ].filter(Boolean)
})
const genericHeroNotes = computed(() =>
  genericRecordNotes.value.slice(0, CONTACT_HERO_NOTES_LIMIT).map((note) => ({
    ...note,
    content: summarizeContactNoteContent(note.content),
  })),
)
const genericHeroDocuments = computed(() => {
  if (isArtifactView.value) {
    return [
      {
        id: recordIdParam.value,
        title: genericRecordName.value,
        meta: [getFieldDisplayValue('artifact_format'), formatDisplayDate(getFieldDisplayValue('created_at'))]
          .filter(Boolean)
          .join(' â€¢ '),
        content: [formatArtifactTypeLabel(getFieldDisplayValue('artifact_type')), getFieldDisplayValue('description')]
          .filter(Boolean)
          .join(' â€¢ '),
      },
    ].filter((item) => item.title)
  }

  return (genericKdbItemsBySection.value.artifacts || []).slice(0, CONTACT_HERO_DOCUMENTS_LIMIT).map((item) => ({
    id: item.id,
    title: item.title,
    meta: item.meta,
    content: item.content,
  }))
})
const visibleGenericFields = computed(() => {
  const activeSection = String(activeGenericSection.value || '').trim()
  if (!activeSection || activeSection === GENERIC_KDB_SECTION_LABEL) return fields.value || []
  return (fields.value || []).filter((field) => resolveGenericFieldSection(field) === activeSection)
})
const genericKdbFields = computed(() =>
  (fields.value || []).filter((field) => resolveGenericFieldSection(field) === GENERIC_KDB_SECTION_LABEL),
)
const genericKdbFieldMap = computed(() =>
  Object.fromEntries(
    genericKdbFields.value
      .map((field) => {
        const option = createGenericKdbSectionOption(field)
        return option ? [option.value, field] : null
      })
      .filter(Boolean),
  ),
)
const genericKdbSectionOptions = CONTACT_KDB_SECTION_OPTIONS
const genericKdbItemsBySection = computed(() =>
  Object.fromEntries(
    CONTACT_KDB_SECTION_OPTIONS.map((option) => [
      option.value,
      buildGenericKdbItemsFromField(genericKdbFieldMap.value[option.value], option.label),
    ]),
  ),
)
const activeGenericKdbItems = computed(() => genericKdbItemsBySection.value[activeGenericKdbSection.value] || [])
const genericKdbKindOptions = computed(() => [{ label: 'All', value: 'all' }])
const genericKdbSearchPlaceholder = computed(() => {
  const active = genericKdbSectionOptions.find((option) => option.value === activeGenericKdbSection.value)
  return `Search ${String(active?.label || 'records').toLowerCase()}...`
})
const displayGenericKdbItems = computed(() => {
  let items = [...activeGenericKdbItems.value]

  const query = String(genericKdbSearchQuery.value || '').trim().toLowerCase()
  if (query) {
    items = items.filter((item) =>
      [item.title, item.meta, item.content].some((value) => String(value || '').toLowerCase().includes(query)),
    )
  }

  return items
})
const contactHeroNotes = computed(() =>
  contactNotes.value.slice(0, CONTACT_HERO_NOTES_LIMIT).map((note) => ({
    ...note,
    content: summarizeContactNoteContent(note.content),
  })),
)
const companyHeroNotes = computed(() =>
  companyNotes.value.slice(0, CONTACT_HERO_NOTES_LIMIT).map((note) => ({
    ...note,
    content: summarizeContactNoteContent(note.content),
  })),
)
const contactHeroDocuments = computed(() => contactDocuments.value.slice(0, CONTACT_HERO_DOCUMENTS_LIMIT))
const companyHeroDocuments = computed(() => companyDocuments.value.slice(0, CONTACT_HERO_DOCUMENTS_LIMIT))
const contactKdbViewOptions = CONTACT_KDB_VIEW_OPTIONS
const contactKdbSectionOptions = CONTACT_KDB_SECTION_OPTIONS
const companyKdbViewOptions = CONTACT_KDB_VIEW_OPTIONS
const companyKdbSectionOptions = CONTACT_KDB_SECTION_OPTIONS
const contactKdbItemsBySection = computed(() => ({
  artifacts: contactDocuments.value.map((document) => ({
    id: String(document.artifactId || document.id || document.fileName || '').trim(),
    title: document.fileName || 'Untitled artifact',
    meta: [document.fileTypeLabel, document.created_at].filter(Boolean).join(' • '),
    content: [document.domainLabel, document.artifactTypeLabel].filter(Boolean).join(' • '),
  })),
  users: buildContactKdbItemsFromValues('Contact_User', ['created_by_label', 'created_by']),
  contacts: buildContactKdbItemsFromValues('Contact_Contact', ['Contact_Contact']),
  companies: buildContactKdbItemsFromValues('Contact_Company', ['Current_Companies', 'Current_Company']),
  funds: buildContactKdbItemsFromValues('Contact_Fund', ['Related_Funds']),
  rounds: buildContactKdbItemsFromValues('Contact_Round', ['Related_Rounds']),
  projects: buildContactKdbItemsFromValues('Contact_Project', ['Related_Projects']),
  tasks: buildContactKdbItemsFromValues('Contact_Task', ['Related_Tasks']),
  notes: contactNotes.value.map((note) => ({
    id: String(note.id || note.title || '').trim(),
    title: note.title || 'Untitled note',
    meta: note.created_at,
    content: note.content,
  })),
}))
const activeContactKdbItems = computed(() => contactKdbItemsBySection.value[activeContactKdbSection.value] || [])
const contactKdbKindOptions = computed(() => {
  if (activeContactKdbSection.value === 'artifacts') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Reviewed', value: 'ready' },
      { label: 'Pending Review', value: 'needs-review' },
    ]
  }
  if (activeContactKdbSection.value === 'users') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Team', value: 'golden' },
      { label: 'Guests', value: 'needs-setup' },
    ]
  }
  if (activeContactKdbSection.value === 'projects') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Own', value: 'own' },
      { label: 'Others', value: 'others' },
    ]
  }
  if (activeContactKdbSection.value === 'notes') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Favorites', value: 'favorites' },
      { label: 'Recent', value: 'recent' },
    ]
  }
  if (activeContactKdbSection.value === 'tasks') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Open', value: 'open' },
      { label: 'Done', value: 'done' },
    ]
  }
  return [{ label: 'All', value: 'all' }]
})
const contactKdbSearchPlaceholder = computed(() => `Search ${activeContactKdbSection.value}...`)
const displayContactKdbItems = computed(() => {
  let items = [...activeContactKdbItems.value]

  if (activeContactKdbSection.value === 'artifacts') {
    if (contactKdbKindFilter.value === 'ready') {
      items = items.filter((item) => /llm-ready|reviewed/i.test(String(item.content || item.meta || '')))
    } else if (contactKdbKindFilter.value === 'needs-review') {
      items = items.filter((item) => !/llm-ready|reviewed/i.test(String(item.content || item.meta || '')))
    }
  } else if (activeContactKdbSection.value === 'tasks') {
    if (contactKdbKindFilter.value === 'open') {
      items = items.filter((item) => !/completed|closed|done/i.test(String(item.meta || item.content || '')))
    } else if (contactKdbKindFilter.value === 'done') {
      items = items.filter((item) => /completed|closed|done/i.test(String(item.meta || item.content || '')))
    }
  }

  const query = String(contactKdbSearchQuery.value || '').trim().toLowerCase()
  if (query) {
    items = items.filter((item) =>
      [item.title, item.meta, item.content].some((value) => String(value || '').toLowerCase().includes(query)),
    )
  }

  return items
})
const companyRelationItemsBySection = computed(() => ({
  contacts: companyLinkedContacts.value.map((row) => ({
    id: String(row?.id || '').trim(),
    title: String(row?.Name || row?.email || 'Unnamed contact').trim() || 'Unnamed contact',
    meta: String(row?.relationship_types || '').trim(),
    content: [row?.email, row?.Phone].filter(Boolean).join(' • '),
  })),
  rounds: companyLinkedRounds.value.map((row) => ({
    id: String(row?.id || '').trim(),
    title: String(row?.Round_Name || 'Unnamed round').trim() || 'Unnamed round',
    meta: String(row?.relationship_sources || row?.Round_Raising_Status || '').trim(),
    content: [row?.Round_Target_Size, row?.Round_Close_Date].filter(Boolean).join(' • '),
  })),
  funds: companyLinkedFunds.value.map((row) => ({
    id: String(row?.id || '').trim(),
    title: String(row?.Fund_Name || 'Unnamed fund').trim() || 'Unnamed fund',
    meta: String(row?.Fund_Raising_Status || '').trim(),
    content: [row?.Fund_Target_Size, row?.Fund_Close_Date].filter(Boolean).join(' • '),
  })),
}))
const companyKdbItemsBySection = computed(() => ({
  contacts: companyRelationItemsBySection.value.contacts || [],
  users: buildContactKdbItemsFromValues('Company_User', ['Company_User']),
  companies: buildContactKdbItemsFromValues('Company_Company', ['Company_Company']),
  rounds: companyRelationItemsBySection.value.rounds || [],
  funds: companyRelationItemsBySection.value.funds || [],
  projects: buildContactKdbItemsFromValues('Company_Project', ['Company_Project']),
  tasks: buildContactKdbItemsFromValues('Company_Task', ['Company_Task']),
  artifacts: companyDocuments.value.map((document) => ({
    id: String(document?.id || document?.artifactId || document?.name || '').trim(),
    title: String(document?.name || document?.fileName || 'Untitled artifact').trim(),
    meta: String(document?.fileTypeLabel || '').trim(),
    content: String(document?.summary || '').trim(),
  })),
  notes: companyNotes.value.map((note) => ({
    id: String(note?.id || note?.title || '').trim(),
    title: String(note?.title || 'Untitled note').trim(),
    meta: String(note?.created_at || '').trim(),
    content: String(note?.content || '').trim(),
  })),
}))
const activeCompanyKdbItems = computed(() => companyKdbItemsBySection.value[activeCompanyKdbSection.value] || [])
const companyKdbKindOptions = computed(() => {
  if (activeCompanyKdbSection.value === 'artifacts') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Reviewed', value: 'ready' },
      { label: 'Pending Review', value: 'needs-review' },
    ]
  }
  if (activeCompanyKdbSection.value === 'notes') {
    return [
      { label: 'All', value: 'all' },
      { label: 'Favorites', value: 'favorites' },
      { label: 'Recent', value: 'recent' },
    ]
  }
  return [{ label: 'All', value: 'all' }]
})
const companyKdbSearchPlaceholder = computed(() => `Search ${activeCompanyKdbSection.value}...`)
const displayCompanyKdbItems = computed(() => {
  let items = [...activeCompanyKdbItems.value]

  if (activeCompanyKdbSection.value === 'artifacts') {
    if (companyKdbKindFilter.value === 'ready') {
      items = items.filter((item) => /llm-ready|reviewed/i.test(String(item.content || item.meta || '')))
    } else if (companyKdbKindFilter.value === 'needs-review') {
      items = items.filter((item) => !/llm-ready|reviewed/i.test(String(item.content || item.meta || '')))
    }
  }

  const query = String(companyKdbSearchQuery.value || '').trim().toLowerCase()
  if (query) {
    items = items.filter((item) =>
      [item.title, item.meta, item.content].some((value) => String(value || '').toLowerCase().includes(query)),
    )
  }

  return items
})
const contactMetaItems = computed(() => [
  { label: 'Record ID', value: getFieldDisplayValue('id') || recordIdParam.value || '-' },
  { label: 'Created', value: getFieldDisplayValue('created_at') || 'Unknown' },
  { label: 'Last updated', value: getFieldDisplayValue('updated_at') || 'Unknown' },
  { label: 'Mode', value: isHistoricalMode.value ? 'Historical snapshot' : 'Live record' },
])
const companyMetaItems = computed(() => [
  { label: 'Record ID', value: getFieldDisplayValue('id') || recordIdParam.value || '-' },
  { label: 'Created', value: getFieldDisplayValue('created_at') || 'Unknown' },
  { label: 'Last updated', value: getFieldDisplayValue('updated_at') || 'Unknown' },
  { label: 'Mode', value: isHistoricalMode.value ? 'Historical snapshot' : 'Live record' },
])
const visibleSystemFields = computed(() => {
  const systemFields = ['id', 'created_at', 'updated_at']
    .map((fieldName) => fieldByName.value[fieldName])
    .filter(Boolean)

  if (editMode.value) return systemFields
  return systemFields.filter((field) => String(field.value || '').trim())
})

function displayValue(value) {
  const text = String(value || '').trim()
  return text.length ? text : '-'
}

function normalizeUserLabel(value) {
  return String(value || '').trim()
}

function resolveContactSummaryValue(option = {}) {
  const aliases = Array.isArray(option.aliases) ? option.aliases : []
  return aliases.map((alias) => getFieldDisplayValue(alias)).find((value) => String(value || '').trim()) || ''
}

function resolveCompanySummaryValue(option = {}) {
  const aliases = Array.isArray(option.aliases) ? option.aliases : []
  return aliases.map((alias) => getFieldDisplayValue(alias)).find((value) => String(value || '').trim()) || ''
}

function getFieldDisplayValue(fieldName) {
  const field = fieldByName.value[fieldName]
  if (!field) return ''
  if (!editMode.value) return String(field.value || '').trim()
  return String(draftValues.value[field.key] ?? field.value ?? '').trim()
}

function handleBackNavigation() {
  if (returnToPath.value) {
    router.push(returnToPath.value)
    return
  }

  if (typeof window !== 'undefined' && window.history?.state?.back) {
    router.back()
    return
  }

  if (backLink.value) {
    router.push({ name: backLink.value.routeName })
  }
}

function buildContactKdbItemsFromValues(prefix, aliases = []) {
  const raw = aliases.map((alias) => getFieldDisplayValue(alias)).find((value) => String(value || '').trim())
  if (!raw) return []

  return String(raw)
    .split(/[,;\n|]/)
    .map((value, index) => ({
      id: `${prefix}-${index}`,
      title: value.trim(),
      meta: '',
      content: '',
    }))
    .filter((item) => item.title)
}

function createGenericKdbSectionOption(field) {
  const relationName = String(field?.field_name || '')
    .split('_')
    .slice(1)
    .join('_')
    .trim()
  if (!relationName) return null

  const normalized = relationName.toLowerCase()
  const configMap = {
    artifact: { label: 'Artifacts', value: 'artifacts', icon: 'attach_file' },
    user: { label: 'Users', value: 'users', icon: 'badge' },
    company: { label: 'Companies', value: 'companies', icon: 'apartment' },
    contact: { label: 'Contacts', value: 'contacts', icon: 'people' },
    fund: { label: 'Funds', value: 'funds', icon: 'work' },
    round: { label: 'Rounds', value: 'rounds', icon: 'work' },
    project: { label: 'Projects', value: 'projects', icon: 'schema' },
    task: { label: 'Tasks', value: 'tasks', icon: 'check_circle' },
    note: { label: 'Notes', value: 'notes', icon: 'note' },
  }

  return configMap[normalized] || {
    label: String(field?.label || relationName).trim(),
    value: normalized.replace(/[^a-z0-9]+/g, '-'),
    icon: 'share',
  }
}

function buildGenericKdbItemsFromField(field, label) {
  if (!field) return []

  const raw = String(field?.value || '').trim()
  if (!raw) return []

  return raw
    .split(/[,;\n|]/)
    .map((value, index) => ({
      id: `${field.key}-${index}`,
      title: value.trim(),
      meta: label,
      content: value.trim(),
    }))
    .filter((item) => item.title)
}

function getContactPill(fieldName, prefix) {
  const value = getFieldDisplayValue(fieldName)
  if (!value) return null
  return { label: `${prefix}: ${value}` }
}

function getCompanyPill(fieldName, prefix) {
  const value = getFieldDisplayValue(fieldName)
  if (!value) return null
  return { label: `${prefix}: ${value}` }
}

function loadContactSummarySelection(storageKey) {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey)
    const parsed = JSON.parse(raw || '[]')
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

function saveContactSummarySelection(storageKey, ids) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(ids))
  } catch {
    // Ignore storage write failures and keep the in-memory selection.
  }
}

function syncContactSummarySelection() {
  const validIds = CONTACT_SUMMARY_OPTIONS.map((option) => option.id)
  const currentIds = selectedContactSummaryStatIds.value.filter((id) => validIds.includes(id))
  if (currentIds.length) {
    selectedContactSummaryStatIds.value = currentIds
    saveContactSummarySelection(contactSummaryStorageKey.value, currentIds)
    return
  }

  const defaults = DEFAULT_CONTACT_SUMMARY_STAT_IDS.filter((id) => validIds.includes(id))
  const fallback = defaults.length ? defaults : validIds.slice(0, 4)
  selectedContactSummaryStatIds.value = fallback
  saveContactSummarySelection(contactSummaryStorageKey.value, fallback)
}

function syncCompanySummarySelection() {
  const validIds = COMPANY_SUMMARY_OPTIONS.map((option) => option.id)
  const currentIds = selectedCompanySummaryStatIds.value.filter((id) => validIds.includes(id))
  if (currentIds.length) {
    selectedCompanySummaryStatIds.value = currentIds
    saveContactSummarySelection(companySummaryStorageKey.value, currentIds)
    return
  }

  const defaults = DEFAULT_COMPANY_SUMMARY_STAT_IDS.filter((id) => validIds.includes(id))
  const fallback = defaults.length ? defaults : validIds.slice(0, 4)
  selectedCompanySummaryStatIds.value = fallback
  saveContactSummarySelection(companySummaryStorageKey.value, fallback)
}

function isCompanySummaryStatSelected(id) {
  return selectedCompanySummaryStatIds.value.includes(id)
}

function toggleCompanySummaryStat(id) {
  if (!id) return
  const next = selectedCompanySummaryStatIds.value.includes(id)
    ? selectedCompanySummaryStatIds.value.filter((candidate) => candidate !== id)
    : [...selectedCompanySummaryStatIds.value, id]

  selectedCompanySummaryStatIds.value = next
  saveContactSummarySelection(companySummaryStorageKey.value, next)
}

async function loadContactNotes() {
  if (!bridge.value?.notes?.list || !isContactView.value || !recordIdParam.value) {
    contactNotes.value = []
    syncContactHeroPanelTab()
    return
  }

  try {
    const result = await bridge.value.notes.list()
    const notes = Array.isArray(result?.notes) ? result.notes : []
    contactNotes.value = notes
      .filter(
        (note) =>
          String(note?.reference_type || '').trim() === 'contact' &&
          String(note?.reference_id || '').trim() === recordIdParam.value,
      )
      .map((note) => ({
        id: note.id,
        title: String(note.title || 'Untitled note').trim() || 'Untitled note',
        content: String(note.content || '').trim(),
        created_at: formatDisplayDate(note.created_at),
      }))
    syncContactHeroPanelTab()
  } catch {
    contactNotes.value = []
    syncContactHeroPanelTab()
  }
}

async function loadCompanyNotes() {
  if (!bridge.value?.notes?.list || !isCompanyView.value || !recordIdParam.value) {
    companyNotes.value = []
    syncCompanyHeroPanelTab()
    return
  }

  try {
    const result = await bridge.value.notes.list()
    const notes = Array.isArray(result?.notes) ? result.notes : []
    companyNotes.value = notes
      .filter(
        (note) =>
          String(note?.reference_type || '').trim() === 'company' &&
          String(note?.reference_id || '').trim() === recordIdParam.value,
      )
      .map((note) => ({
        id: note.id,
        title: String(note.title || 'Untitled note').trim() || 'Untitled note',
        content: String(note.content || '').trim(),
        created_at: formatDisplayDate(note.created_at),
      }))
    syncCompanyHeroPanelTab()
  } catch {
    companyNotes.value = []
    syncCompanyHeroPanelTab()
  }
}

async function loadGenericRecordNotes() {
  if (!bridge.value?.notes?.list || !isStructuredGenericRecordView.value || !recordIdParam.value) {
    genericRecordNotes.value = []
    return
  }

  const referenceTypesByTable = {
    Users: ['user'],
    Artifacts: ['artifact'],
    Opportunities: ['opportunity'],
    Funds: ['fund'],
    Rounds: ['round'],
    Projects: ['project'],
    Pipelines: ['project', 'pipeline'],
  }

  try {
    const result = await bridge.value.notes.list()
    const notes = Array.isArray(result?.notes) ? result.notes : []
    const allowedTypes = referenceTypesByTable[structuredRecordTableName.value] || []
    genericRecordNotes.value = notes
      .filter((note) => {
        const referenceType = String(note?.reference_type || '').trim().toLowerCase()
        const referenceId = String(note?.reference_id || '').trim()
        return allowedTypes.includes(referenceType) && referenceId === recordIdParam.value
      })
      .map((note) => ({
        id: note.id,
        title: String(note.title || 'Untitled note').trim() || 'Untitled note',
        content: String(note.content || '').trim(),
        created_at: formatDisplayDate(note.created_at),
      }))
  } catch {
    genericRecordNotes.value = []
  }
}

async function loadCompanyRelationships() {
  if (!bridge.value?.db?.query || !isCompanyView.value || !recordIdParam.value) {
    companyLinkedContacts.value = []
    companyLinkedRounds.value = []
    companyLinkedFunds.value = []
    return
  }

  try {
    const companyId = String(recordIdParam.value || '').trim()
    const [contactRows, roundRows, fundRows] = await Promise.all([
      bridge.value.db.query(
        `
        SELECT
          c.id,
          c.Name,
          COALESCE(NULLIF(c.Professional_Email, ''), NULLIF(c.Personal_Email, '')) AS email,
          c.Phone,
          GROUP_CONCAT(DISTINCT rel.relationship_type) AS relationship_types
        FROM (
          SELECT from_id AS contact_id, to_id AS company_id, 'Founder' AS relationship_type
          FROM Contacts_Companies_founders

          UNION ALL

          SELECT from_id AS contact_id, to_id AS company_id, 'Related contact' AS relationship_type
          FROM Contacts_Companies_related_contacts

          UNION ALL

          SELECT from_id AS contact_id, to_id AS company_id, 'Cap table individual' AS relationship_type
          FROM Contacts_Companies_captable_individuals

          UNION ALL

          SELECT from_id AS contact_id, to_id AS company_id, 'Referred by' AS relationship_type
          FROM Contacts_Companies_referred_by

          UNION ALL

          SELECT from_id AS contact_id, to_id AS company_id, 'Referred to' AS relationship_type
          FROM Contacts_Companies_referred_to

          UNION ALL

          SELECT to_id AS contact_id, from_id AS company_id, 'Current company' AS relationship_type
          FROM Companies_Contacts_current_company

          UNION ALL

          SELECT
            from_id AS contact_id,
            to_id AS company_id,
            COALESCE(NULLIF(role, ''), CASE WHEN current_company = 1 THEN 'Current role' ELSE 'Tenure' END) AS relationship_type
          FROM Contacts_Companies_tenure
        ) rel
        INNER JOIN Contacts c ON c.id = rel.contact_id
        WHERE CAST(rel.company_id AS TEXT) = ?
        GROUP BY c.id, c.Name, c.Professional_Email, c.Personal_Email, c.Phone
        ORDER BY COALESCE(NULLIF(c.Name, ''), email, c.id)
      `,
        [companyId],
      ),
      bridge.value.db.query(
        `
        SELECT
          r.id,
          r.Round_Name,
          ro.Round_Raising_Status,
          ro.Round_Target_Size,
          ro.Round_Close_Date,
          GROUP_CONCAT(DISTINCT rel.relationship_source) AS relationship_sources
        FROM (
          SELECT to_id AS round_id, from_id AS company_id, 'Company rounds' AS relationship_source
          FROM Companies_Rounds_has_rounds

          UNION ALL

          SELECT round_id, sponsor_company_id AS company_id, 'Sponsored round' AS relationship_source
          FROM Round_Overview
          WHERE sponsor_company_id IS NOT NULL
        ) rel
        INNER JOIN Rounds r ON r.id = rel.round_id
        LEFT JOIN Round_Overview ro ON ro.round_id = r.id
        WHERE CAST(rel.company_id AS TEXT) = ?
        GROUP BY r.id, r.Round_Name, ro.Round_Raising_Status, ro.Round_Target_Size, ro.Round_Close_Date
        ORDER BY COALESCE(ro.Round_Close_Date, r.created_at) DESC, r.Round_Name
      `,
        [companyId],
      ),
      bridge.value.db.query(
        `
        SELECT
          f.id,
          f.Fund_Name,
          fo.Fund_Raising_Status,
          fo.Fund_Target_Size,
          fo.Fund_Close_Date
        FROM Companies_Funds_has_funds rel
        INNER JOIN Funds f ON f.id = rel.to_id
        LEFT JOIN Fund_Overview fo ON fo.fund_id = f.id
        WHERE CAST(rel.from_id AS TEXT) = ?
        ORDER BY COALESCE(fo.Fund_Close_Date, f.created_at) DESC, f.Fund_Name
      `,
        [companyId],
      ),
    ])

    companyLinkedContacts.value = Array.isArray(contactRows) ? contactRows : []
    companyLinkedRounds.value = Array.isArray(roundRows) ? roundRows : []
    companyLinkedFunds.value = Array.isArray(fundRows) ? fundRows : []
  } catch {
    companyLinkedContacts.value = []
    companyLinkedRounds.value = []
    companyLinkedFunds.value = []
  }
}

async function loadCompanyDocuments() {
  if (!bridge.value?.artifacts?.list || !isCompanyView.value || !recordIdParam.value) {
    companyDocuments.value = []
    syncCompanyHeroPanelTab()
    return
  }

  try {
    const [artifactResult, relatedOpportunityIds] = await Promise.all([
      bridge.value.artifacts.list(),
      resolveCompanyOpportunityIds(recordIdParam.value),
    ])

    const artifacts = Array.isArray(artifactResult?.artifacts) ? artifactResult.artifacts : []
    const groupedArtifacts = new Map()

    for (const artifact of artifacts) {
      const opportunityId = String(artifact?.opportunity_id || '').trim()
      if (!relatedOpportunityIds.has(opportunityId)) continue

      const groupKey =
        String(artifact?.original_artifact_id || '').trim() || String(artifact?.artifact_id || '').trim()
      if (!groupKey) continue

      const group = groupedArtifacts.get(groupKey) || []
      group.push(artifact)
      groupedArtifacts.set(groupKey, group)
    }

    companyDocuments.value = [...groupedArtifacts.values()]
      .sort((left, right) => resolveDocumentGroupTimestamp(right) - resolveDocumentGroupTimestamp(left))
      .map((group) => buildContactDocumentEntry(group))
    syncCompanyHeroPanelTab()
  } catch {
    companyDocuments.value = []
    syncCompanyHeroPanelTab()
  }
}

async function resolveCompanyOpportunityIds(companyId) {
  const normalizedCompanyId = String(companyId || '').trim()
  if (!normalizedCompanyId) return new Set()

  if (bridge.value?.db?.query) {
    try {
      const rows = await bridge.value.db.query(
        `
        SELECT DISTINCT id
        FROM (
          SELECT o.id
          FROM Opportunities o
          WHERE o.company_id = ?

          UNION

          SELECT r.id
          FROM Rounds r
          INNER JOIN Round_Overview ro ON ro.round_id = r.id
          WHERE ro.sponsor_company_id = ?
        ) related_opportunities
      `,
        [normalizedCompanyId, normalizedCompanyId],
      )
      return new Set((Array.isArray(rows) ? rows : []).map((row) => String(row?.id || '').trim()).filter(Boolean))
    } catch {
      // Fall back to the generic opportunity list if direct querying is unavailable.
    }
  }

  if (bridge.value?.opportunities?.list) {
    try {
      const result = await bridge.value.opportunities.list()
      const opportunities = Array.isArray(result?.opportunities) ? result.opportunities : []
      return new Set(
        opportunities
          .filter((opportunity) => String(opportunity?.company_id || '').trim() === normalizedCompanyId)
          .map((opportunity) => String(opportunity?.id || '').trim())
          .filter(Boolean),
      )
    } catch {
      return new Set()
    }
  }

  return new Set()
}

async function loadContactDocuments() {
  if (!bridge.value?.artifacts?.list || !isContactView.value || !recordIdParam.value) {
    contactDocuments.value = []
    syncContactHeroPanelTab()
    return
  }

  try {
    await ensureWorkspaceRoot()
    const [artifactResult, opportunitiesResult] = await Promise.all([
      bridge.value.artifacts.list(),
      bridge.value?.opportunities?.list ? bridge.value.opportunities.list() : Promise.resolve({ opportunities: [] }),
    ])
    const opportunities = Array.isArray(opportunitiesResult?.opportunities) ? opportunitiesResult.opportunities : []
    const relatedOpportunities = new Map(
      opportunities
        .filter(
          (opportunity) =>
            String(opportunity?.Owner || '').trim() === recordIdParam.value ||
            String(opportunity?.Source_Contact || '').trim() === recordIdParam.value,
        )
        .map((opportunity) => [
          String(opportunity?.id || '').trim(),
          String(opportunity?.Venture_Oppty_Name || opportunity?.opportunity_name || opportunity?.id || '')
            .trim(),
        ])
        .filter(([id]) => id),
    )

    const artifacts = Array.isArray(artifactResult?.artifacts) ? artifactResult.artifacts : []
    const groupedArtifacts = new Map()

    for (const artifact of artifacts) {
      const createdBy = String(artifact?.created_by || '').trim()
      const opportunityId = String(artifact?.opportunity_id || '').trim()
      const isDirectMatch = createdBy === recordIdParam.value
      const isOpportunityMatch = relatedOpportunities.has(opportunityId)
      if (!isDirectMatch && !isOpportunityMatch) continue

      const groupKey =
        String(artifact?.original_artifact_id || '').trim() || String(artifact?.artifact_id || '').trim()
      if (!groupKey) continue

      const group = groupedArtifacts.get(groupKey) || []
      group.push(artifact)
      groupedArtifacts.set(groupKey, group)
    }

    contactDocuments.value = [...groupedArtifacts.values()]
      .sort((left, right) => resolveDocumentGroupTimestamp(right) - resolveDocumentGroupTimestamp(left))
      .map((group) => buildContactDocumentEntry(group))
    syncContactHeroPanelTab()
  } catch {
    contactDocuments.value = []
    syncContactHeroPanelTab()
  }
}

function syncContactHeroPanelTab() {
  if (contactHeroPanelTab.value !== 'notes' && contactHeroPanelTab.value !== 'documents') {
    contactHeroPanelTab.value = 'documents'
  }
}

function syncCompanyHeroPanelTab() {
  if (companyHeroPanelTab.value !== 'notes' && companyHeroPanelTab.value !== 'documents') {
    companyHeroPanelTab.value = 'documents'
  }
}

async function ensureWorkspaceRoot() {
  if (workspaceRoot.value || !bridge.value?.fs?.workspaceRoot) return workspaceRoot.value
  try {
    const result = await bridge.value.fs.workspaceRoot()
    workspaceRoot.value = String(result?.rootPath || '').trim()
  } catch {
    workspaceRoot.value = ''
  }
  return workspaceRoot.value
}

function resolveDroppedFilePaths(files = []) {
  return Array.from(files || [])
    .map((file) => {
      const path =
        file?.path || bridge.value?.files?.getPathForFile?.(file) || file?.webkitRelativePath || null
      return {
        name: String(file?.name || '').trim(),
        path: String(path || '').trim(),
      }
    })
    .filter((file) => file.name || file.path)
}

async function onContactDocumentsDrop(event) {
  contactDocumentsDragOver.value = false
  if (uploadingContactDocuments.value || !bridge.value?.artifacts?.ingest || !recordIdParam.value) return

  const droppedFiles = resolveDroppedFilePaths(Array.from(event?.dataTransfer?.files || []))
  const validPaths = droppedFiles.map((file) => file.path).filter(Boolean)

  if (!validPaths.length) {
    $q.notify({
      type: 'negative',
      message: 'Could not read the dropped file path. Please try again with a local file.',
    })
    return
  }

  uploadingContactDocuments.value = true
  try {
    await bridge.value.artifacts.ingest({
      filePaths: validPaths,
      createdBy: recordIdParam.value,
    })
    contactHeroPanelTab.value = 'documents'
    await loadContactDocuments()
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: `Could not upload document${validPaths.length === 1 ? '' : 's'}. ${e?.message || ''}`.trim(),
    })
  } finally {
    uploadingContactDocuments.value = false
  }
}

async function downloadContactDocument(document = {}) {
  const artifactId = String(document?.artifactId || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.download) return

  activeDocumentActionKey.value = `${artifactId}:download`
  try {
    const result = await bridge.value.artifacts.download({ artifactId })
    if (result?.canceled) return
    $q.notify({ type: 'positive', message: 'Document downloaded.' })
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: `Could not download document. ${e?.message || ''}`.trim(),
    })
  } finally {
    activeDocumentActionKey.value = ''
  }
}

async function previewContactDocument(document = {}) {
  const artifactId = String(document?.artifactId || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.preview) return

  pdfPreviewRequestToken += 1
  activeDocumentActionKey.value = `${artifactId}:preview`
  showDocumentPreviewDialog.value = true
  documentPreviewLoading.value = true
  documentPreview.value = {
    artifactId,
    fileName: String(document?.fileName || '').trim(),
    kind: '',
    fileUrl: '',
    fileDataBase64: '',
    content: '',
  }
  try {
    const preview = await bridge.value.artifacts.preview({ artifactId })
    documentPreview.value = {
      artifactId,
      fileName: String(preview?.fileName || document?.fileName || '').trim(),
      kind: String(preview?.kind || '').trim(),
      fileUrl: String(preview?.fileUrl || '').trim(),
      fileDataBase64: String(preview?.fileDataBase64 || ''),
      content: String(preview?.content || ''),
    }
    if (documentPreview.value.kind === 'pdf' && documentPreview.value.fileDataBase64) {
      await loadPdfPreview(documentPreview.value.fileDataBase64)
    }
  } catch (e) {
    showDocumentPreviewDialog.value = false
    $q.notify({
      type: 'negative',
      message: `Could not preview document. ${e?.message || ''}`.trim(),
    })
  } finally {
    documentPreviewLoading.value = false
    activeDocumentActionKey.value = ''
  }
}

async function loadPdfPreview(fileDataBase64) {
  const requestToken = pdfPreviewRequestToken
  await resetPdfPreview()

  const loadingTask = pdfjsLib.getDocument({
    data: decodeBase64ToUint8Array(fileDataBase64),
  })
  const pdfDocument = await loadingTask.promise
  if (requestToken !== pdfPreviewRequestToken) {
    await pdfDocument.destroy()
    return
  }

  pdfPreviewDocument.value = pdfDocument

  const pages = []
  for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
    const page = await pdfDocument.getPage(pageNumber)
    const thumbnailSrc = await renderPdfPageToDataUrl(page, 120)
    pages.push({ pageNumber, thumbnailSrc })
  }

  if (requestToken !== pdfPreviewRequestToken) return
  pdfPreviewPages.value = pages
  await selectPdfPreviewPage(1)
}

function decodeBase64ToUint8Array(base64Value = '') {
  const binary = globalThis.atob(String(base64Value || ''))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function selectPdfPreviewPage(pageNumber) {
  const pdfDocument = pdfPreviewDocument.value
  if (!pdfDocument) return

  pdfPreviewSelectedPage.value = pageNumber
  const page = await pdfDocument.getPage(pageNumber)
  pdfPreviewCurrentPageSrc.value = await renderPdfPageToDataUrl(page, 1320)
}

async function renderPdfPageToDataUrl(page, targetWidth) {
  const baseViewport = page.getViewport({ scale: 1 })
  const scale = targetWidth && baseViewport.width ? targetWidth / baseViewport.width : 1
  const viewport = page.getViewport({ scale })
  const outputScale = typeof window !== 'undefined' ? Math.max(window.devicePixelRatio || 1, 1) : 1
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) return ''

  canvas.width = Math.ceil(viewport.width * outputScale)
  canvas.height = Math.ceil(viewport.height * outputScale)
  canvas.style.width = `${viewport.width}px`
  canvas.style.height = `${viewport.height}px`
  context.setTransform(outputScale, 0, 0, outputScale, 0, 0)

  await page.render({
    canvasContext: context,
    viewport,
  }).promise

  return canvas.toDataURL('image/png')
}

async function resetPdfPreview() {
  pdfPreviewCurrentPageSrc.value = ''
  pdfPreviewPages.value = []
  pdfPreviewSelectedPage.value = 1

  if (pdfPreviewDocument.value) {
    await pdfPreviewDocument.value.destroy()
    pdfPreviewDocument.value = null
  }
}

function closeDocumentPreview() {
  pdfPreviewRequestToken += 1
  showDocumentPreviewDialog.value = false
  documentPreviewLoading.value = false
  documentPreview.value = {
    artifactId: '',
    fileName: '',
    kind: '',
    fileUrl: '',
    fileDataBase64: '',
    content: '',
  }
  resetPdfPreview()
}

async function shareContactDocument(document = {}) {
  const artifactId = String(document?.artifactId || '').trim()
  if (!artifactId || !bridge.value?.artifacts?.share) return

  activeDocumentActionKey.value = `${artifactId}:share`
  try {
    await bridge.value.artifacts.share({ artifactId })
    $q.notify({
      type: 'positive',
      message: 'File path copied and document revealed in Finder.',
    })
  } catch (e) {
    $q.notify({
      type: 'negative',
      message: `Could not prepare document for sharing. ${e?.message || ''}`.trim(),
    })
  } finally {
    activeDocumentActionKey.value = ''
  }
}

function formatDisplayDate(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'Unknown date'
  const date = new Date(raw.replace(' ', 'T'))
  if (Number.isNaN(date.getTime())) return raw
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

function summarizeContactNoteContent(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .slice(0, 140)
}

function parseDateValue(value) {
  const raw = String(value || '').trim()
  if (!raw) return 0
  const timestamp = Date.parse(raw.replace(' ', 'T'))
  return Number.isNaN(timestamp) ? 0 : timestamp
}

function resolveDocumentGroupTimestamp(group = []) {
  return Math.max(...group.map((artifact) => parseDateValue(artifact?.created_at)), 0)
}

function buildContactDocumentEntry(group = []) {
  const previewArtifact = resolvePreferredDocumentArtifact(group)
  const metadataArtifact = resolveMetadataDocumentArtifact(group)
  const fileName = resolveArtifactFileName(previewArtifact)
  const fileExtension = resolveArtifactExtension(previewArtifact)
  const thumbnailSrc = resolveArtifactThumbnailSrc(previewArtifact, fileExtension)

  return {
    artifactId: String(previewArtifact?.artifact_id || '').trim(),
    id:
      String(previewArtifact?.artifact_id || '').trim() ||
      `${previewArtifact?.fs_path || ''}:${previewArtifact?.created_at || ''}`,
    fileName,
    thumbnailSrc,
    thumbnailIcon: resolveArtifactThumbnailIcon(fileExtension),
    thumbnailLabel: resolveArtifactThumbnailLabel(fileExtension),
    fileTypeLabel:
      formatArtifactDomainLabel(metadataArtifact?.type) ||
      formatArtifactTypeLabel(previewArtifact?.artifact_type) ||
      (fileExtension ? fileExtension.toUpperCase() : 'Document'),
    created_at: formatDisplayDate(previewArtifact?.created_at || metadataArtifact?.created_at),
  }
}

function resolvePreferredDocumentArtifact(group = []) {
  const rawArtifact = group.find((artifact) => String(artifact?.artifact_type || '').trim() === 'raw')
  if (rawArtifact) return rawArtifact
  return resolveMetadataDocumentArtifact(group)
}

function resolveMetadataDocumentArtifact(group = []) {
  return [...group].sort(compareArtifactPriority)[0] || {}
}

function compareArtifactPriority(left = {}, right = {}) {
  const priority = {
    'llm-ready': 0,
    raw: 1,
    'llm-generated': 2,
  }
  const leftPriority = priority[String(left?.artifact_type || '').trim()] ?? 99
  const rightPriority = priority[String(right?.artifact_type || '').trim()] ?? 99
  if (leftPriority !== rightPriority) return leftPriority - rightPriority
  return parseDateValue(right?.created_at) - parseDateValue(left?.created_at)
}

function resolveArtifactFileName(artifact = {}) {
  const filePath = String(artifact?.fs_path || '').trim()
  const fileName = filePath.split('/').pop() || ''
  if (fileName) return fileName
  const explicitTitle = String(artifact?.title || '').trim()
  return explicitTitle || 'Untitled document'
}

function resolveArtifactExtension(artifact = {}) {
  const fileName = resolveArtifactFileName(artifact)
  const lastDotIndex = fileName.lastIndexOf('.')
  if (lastDotIndex > -1 && lastDotIndex < fileName.length - 1) {
    return fileName.slice(lastDotIndex + 1).toLowerCase()
  }
  return String(artifact?.artifact_format || '').trim().toLowerCase()
}

function resolveArtifactThumbnailSrc(artifact = {}, extension = '') {
  if (!isPreviewableImageExtension(extension)) return ''
  const relativePath = String(artifact?.fs_path || '').trim()
  const absolutePath = resolveArtifactAbsolutePath(relativePath)
  if (!absolutePath) return ''
  return toFileUrl(absolutePath)
}

function resolveArtifactAbsolutePath(relativePath = '') {
  const root = String(workspaceRoot.value || '').trim()
  const cleanRelativePath = String(relativePath || '').trim().replace(/^[/\\]+/, '')
  if (!root || !cleanRelativePath) return ''
  return `${root.replace(/[\\/]+$/, '')}/${cleanRelativePath}`
}

function toFileUrl(absolutePath = '') {
  const normalized = String(absolutePath || '').trim().replace(/\\/g, '/')
  if (!normalized) return ''
  return encodeURI(`${normalized.startsWith('/') ? 'file://' : 'file:///'}${normalized}`)
}

function isPreviewableImageExtension(extension = '') {
  return ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'].includes(String(extension || '').toLowerCase())
}

function resolveArtifactThumbnailIcon(extension = '') {
  const normalized = String(extension || '').toLowerCase()
  if (normalized === 'pdf') return 'picture_as_pdf'
  if (['ppt', 'pptx', 'key'].includes(normalized)) return 'slideshow'
  if (['xls', 'xlsx', 'csv'].includes(normalized)) return 'table_chart'
  if (['doc', 'docx', 'pages', 'txt', 'md'].includes(normalized)) return 'description'
  if (['eml', 'msg'].includes(normalized)) return 'mail'
  return 'insert_drive_file'
}

function resolveArtifactThumbnailLabel(extension = '') {
  const normalized = String(extension || '').trim().toUpperCase()
  if (!normalized) return 'FILE'
  if (normalized.length <= 4) return normalized
  return normalized.slice(0, 4)
}

function formatArtifactTypeLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const labels = {
    raw: 'Raw file',
    'llm-ready': 'LLM-ready',
    'llm-generated': 'AI-generated',
  }

  return labels[raw] || raw
}

function formatArtifactDomainLabel(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''

  const labels = {
    raising_pitch_deck: 'Raising pitch deck',
    commercial_pitch_deck: 'Commercial pitch deck',
    messages: 'Messages',
    emails: 'Emails',
    historical_data: 'Historical data',
    forecast: 'Forecast',
    other: 'Other',
  }

  return labels[raw] || raw.replace(/_/g, ' ')
}

function resolveDatabookField(config = {}) {
  const aliases = Array.isArray(config.aliases) ? config.aliases : []
  const field = aliases.map((alias) => fieldByName.value[alias]).find(Boolean)
  if (!field) return null
  return {
    ...field,
    displayLabel: config.label || field.label,
  }
}

function normalizeExternalUrl(value) {
  const raw = String(value || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}

function hashString(value) {
  let hash = 0
  for (const char of String(value || '')) {
    hash = (hash << 5) - hash + char.charCodeAt(0)
    hash |= 0
  }
  return hash
}

function normalizeIpcErrorMessage(errorValue) {
  const raw = String(errorValue?.message || errorValue || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

function enterEditMode() {
  const next = {}
  for (const field of fields.value) next[field.key] = field.value == null ? '' : String(field.value)
  draftValues.value = next
  editMode.value = true
}

function cancelEdit() {
  editMode.value = false
  draftValues.value = {}
}

async function refreshActor() {
  if (!hasBridge.value) return
  actor.value = await bridge.value.audit.me()
  userLabelInput.value = String(actor.value?.user_label || '')
}

async function saveUserLabel() {
  const userLabel = String(userLabelInput.value || '').trim()
  if (!userLabel) return
  savingUserLabel.value = true
  try {
    actor.value = await bridge.value.audit.setUserLabel(userLabel)
    showUserLabelDialog.value = false
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  } finally {
    savingUserLabel.value = false
  }
}

async function ensureActorReadyForSave() {
  if (!hasBridge.value) return false
  if (actor.value?.user_label) return true
  await refreshActor()
  if (actor.value?.user_label) return true
  showUserLabelDialog.value = true
  return false
}

async function applyDatabookChanges(changes, { syncDraftFieldNames = [], exitEditMode = false } = {}) {
  if (!hasBridge.value) return false
  if (!tableNameParam.value || !recordIdParam.value) return false
  if (!Array.isArray(changes) || changes.length === 0) return true
  if (!(await ensureActorReadyForSave())) return false

  saving.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.update({
      tableName: tableNameParam.value,
      recordId: recordIdParam.value,
      changes,
    })
    currentView.value = result?.view || currentView.value
    fields.value = Array.isArray(result?.view?.fields) ? result.view.fields : []
    if (editMode.value && syncDraftFieldNames.length) {
      const nextDraft = { ...draftValues.value }
      for (const fieldName of syncDraftFieldNames) {
        const field = fields.value.find((candidate) => candidate.field_name === fieldName)
        if (!field) continue
        nextDraft[field.key] = field.value == null ? '' : String(field.value)
      }
      draftValues.value = nextDraft
    }
    if (exitEditMode) cancelEdit()
    await loadVersions()
    return true
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
    if (/user label|user profile/i.test(message)) showUserLabelDialog.value = true
    return false
  } finally {
    saving.value = false
  }
}

async function saveChanges() {
  const changes = fields.value
    .filter((field) => field.editable)
    .map((field) => {
      const previousValue = field.value == null ? '' : String(field.value)
      const nextValue = draftValues.value[field.key] == null ? '' : String(draftValues.value[field.key])
      if (previousValue === nextValue) return null
      return {
        table_name: field.table_name,
        record_id: field.record_id,
        field_name: field.field_name,
        id_column: field.id_column,
        new_value: nextValue,
      }
    })
    .filter(Boolean)

  await applyDatabookChanges(changes, { exitEditMode: true })
}

async function loadDatabook() {
  if (!hasBridge.value) return
  if (!tableNameParam.value || !recordIdParam.value) {
    currentView.value = null
    fields.value = []
    versions.value = []
    return
  }

  loading.value = true
  error.value = ''
  try {
    const result = await bridge.value.databooks.view(tableNameParam.value, recordIdParam.value)
    currentView.value = result || null
    fields.value = Array.isArray(result?.fields) ? result.fields : []
    selectedVersionId.value = null
    modifiedByMap.value = {}
    cancelEdit()
    await loadVersions()
    await refreshActor()
    await loadContactNotes()
    await loadContactDocuments()
    await loadCompanyNotes()
    await loadGenericRecordNotes()
    await loadCompanyRelationships()
    await loadCompanyDocuments()
  } catch (e) {
    error.value = normalizeIpcErrorMessage(e)
    currentView.value = null
    fields.value = []
    versions.value = []
    contactNotes.value = []
    contactDocuments.value = []
    companyNotes.value = []
    genericRecordNotes.value = []
    companyDocuments.value = []
    companyLinkedContacts.value = []
    companyLinkedRounds.value = []
    companyLinkedFunds.value = []
  } finally {
    loading.value = false
  }
}

async function loadVersions() {
  if (!hasVersionBridge.value || !tableNameParam.value || !recordIdParam.value) return
  try {
    const result = await bridge.value.databooks.versions(tableNameParam.value, recordIdParam.value)
    versions.value = Array.isArray(result?.versions) ? result.versions : []
  } catch {
    versions.value = []
  }
}

function fieldMapByKey(list = []) {
  return Object.fromEntries((Array.isArray(list) ? list : []).map((field) => [field.key, field]))
}

function eventKey(field = {}) {
  return `${field.table_name || ''}|${field.record_id || ''}|${field.field_name || ''}`
}

async function openVersion(snapshotId) {
  if (!hasVersionBridge.value) return
  const sid = String(snapshotId || '').trim()
  if (!sid) return
  try {
    const snapshot = await bridge.value.databooks.viewSnapshot(sid)
    const versionPayload = snapshot?.payload || {}
    const versionFields = Array.isArray(versionPayload?.fields) ? versionPayload.fields : []
    const versionIndex = versions.value.findIndex((version) => version.id === sid)
    const priorVersion = versionIndex >= 0 ? versions.value[versionIndex + 1] : null

    const changedKeys = []
    if (priorVersion?.id) {
      const priorSnapshot = await bridge.value.databooks.viewSnapshot(priorVersion.id)
      const prevMap = fieldMapByKey(priorSnapshot?.payload?.fields || [])
      const currMap = fieldMapByKey(versionFields)
      for (const [key, currField] of Object.entries(currMap)) {
        const prevField = prevMap[key]
        if (String(prevField?.value ?? '') !== String(currField?.value ?? '')) changedKeys.push(key)
      }
    }

    const mods = {}
    if (changedKeys.length) {
      const selectedVersion = versions.value.find((version) => version.id === sid)
      const eventsResult = await bridge.value.audit.events({
        table_name: snapshot?.table_name || versionPayload?.table_name || tableNameParam.value,
        record_id: snapshot?.record_id || versionPayload?.record_id || recordIdParam.value,
        since: priorVersion?.created_at || null,
        until: selectedVersion?.created_at || null,
        limit: 1000,
      })
      const events = Array.isArray(eventsResult?.events) ? eventsResult.events : []
      const latestEventByKey = {}
      for (const eventRow of events) {
        const key = `${eventRow.table_name || ''}|${eventRow.record_id || ''}|${eventRow.field_name || ''}`
        if (!latestEventByKey[key]) latestEventByKey[key] = eventRow
      }
      for (const key of changedKeys) {
        const field = versionFields.find((candidate) => candidate.key === key)
        if (!field) continue
        const eventRow = latestEventByKey[eventKey(field)]
        mods[key] = eventRow?.edited_by_label || snapshot?.created_by_label || 'Unknown editor'
      }
    }

    selectedVersionId.value = sid
    editMode.value = false
    draftValues.value = {}
    currentView.value = versionPayload
    fields.value = versionFields
    modifiedByMap.value = mods
  } catch (e) {
    const message = normalizeIpcErrorMessage(e)
    error.value = message
    $q.notify({ type: 'negative', message })
  }
}

async function switchToLatestVersion() {
  selectedVersionId.value = null
  modifiedByMap.value = {}
  await loadDatabook()
}

function triggerContactImagePicker() {
  currentImageUploadTarget.value = 'contact'
  contactImageInput.value?.click?.()
}

function triggerCompanyLogoPicker() {
  currentImageUploadTarget.value = 'company'
  contactImageInput.value?.click?.()
}

async function onContactImageSelected(event) {
  const file = event?.target?.files?.[0]
  if (!file) {
    if (contactImageInput.value) contactImageInput.value.value = ''
    return
  }

  try {
    const imageTargetConfig = getImageTargetConfig()
    if (!imageTargetConfig.field) {
      throw new Error(`${imageTargetConfig.label} field is not available for this record.`)
    }
    if (!String(file.type || '').startsWith('image/')) {
      throw new Error('Please select an image file.')
    }

    const imageData = await readFileAsDataUrl(file)
    const dimensions = await loadImageDimensions(imageData)
    pendingContactImageSrc.value = imageData
    pendingContactImageNaturalSize.value = dimensions
    contactImageCropZoom.value = 1
    contactImageCropOffset.value = { x: 0, y: 0 }
    showContactImageCropDialog.value = true
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    if (contactImageInput.value) contactImageInput.value.value = ''
  }
}

async function removeContactImage() {
  if (!contactImageField.value) return
  await removeRecordImage({
    field: contactImageField.value,
    fieldName: 'Profile_Image',
    successMessage: 'Contact image removed.',
  })
}

async function removeCompanyLogo() {
  if (!companyLogoField.value) return
  await removeRecordImage({
    field: companyLogoField.value,
    fieldName: 'Company_Logo',
    successMessage: 'Company logo removed.',
  })
}

async function removeRecordImage({ field, fieldName, successMessage }) {
  if (!field) return
  uploadingContactImage.value = true
  try {
    const saved = await applyDatabookChanges(
      [
        {
          table_name: field.table_name,
          record_id: field.record_id,
          field_name: field.field_name,
          id_column: field.id_column,
          new_value: '',
        },
      ],
      { syncDraftFieldNames: [fieldName] },
    )
    if (saved) {
      $q.notify({ type: 'positive', message: successMessage })
    }
  } finally {
    uploadingContactImage.value = false
  }
}

async function saveContactImage(imageData) {
  return saveRecordImage({
    field: contactImageField.value,
    fieldName: 'Profile_Image',
    imageData,
    successMessage: 'Contact image updated.',
  })
}

async function saveCompanyLogo(imageData) {
  return saveRecordImage({
    field: companyLogoField.value,
    fieldName: 'Company_Logo',
    imageData,
    successMessage: 'Company logo updated.',
  })
}

async function saveRecordImage({ field, fieldName, imageData, successMessage }) {
  if (!field) return false
  const saved = await applyDatabookChanges(
    [
      {
        table_name: field.table_name,
        record_id: field.record_id,
        field_name: field.field_name,
        id_column: field.id_column,
        new_value: imageData,
      },
    ],
    { syncDraftFieldNames: [fieldName] },
  )
  if (saved) {
    $q.notify({ type: 'positive', message: successMessage })
  }
  return saved
}

function cancelContactImageCrop() {
  showContactImageCropDialog.value = false
  pendingContactImageSrc.value = ''
  pendingContactImageNaturalSize.value = { width: 0, height: 0 }
  contactImageCropZoom.value = 1
  contactImageCropOffset.value = { x: 0, y: 0 }
}

let contactImageCropDragState = null

function startContactImageCropDrag(event) {
  if (!pendingContactImageSrc.value || uploadingContactImage.value) return
  contactImageCropDragState = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startOffset: { ...contactImageCropOffset.value },
  }
  window.addEventListener('pointermove', onContactImageCropPointerMove)
  window.addEventListener('pointerup', stopContactImageCropDrag)
  window.addEventListener('pointercancel', stopContactImageCropDrag)
}

function clampContactImageCropOffset(offset = { x: 0, y: 0 }) {
  const maxX = Math.max(0, (contactImageCropDisplaySize.value.width - contactImageCropFrameWidth.value) / 2)
  const maxY = Math.max(0, (contactImageCropDisplaySize.value.height - contactImageCropFrameHeight.value) / 2)
  return {
    x: Math.min(maxX, Math.max(-maxX, offset.x)),
    y: Math.min(maxY, Math.max(-maxY, offset.y)),
  }
}

function onContactImageCropPointerMove(event) {
  if (!contactImageCropDragState || event.pointerId !== contactImageCropDragState.pointerId) return
  const dx = event.clientX - contactImageCropDragState.startX
  const dy = event.clientY - contactImageCropDragState.startY
  contactImageCropOffset.value = clampContactImageCropOffset({
    x: contactImageCropDragState.startOffset.x + dx,
    y: contactImageCropDragState.startOffset.y + dy,
  })
}

function stopContactImageCropDrag(event) {
  if (event && contactImageCropDragState && event.pointerId !== contactImageCropDragState.pointerId) return
  contactImageCropDragState = null
  window.removeEventListener('pointermove', onContactImageCropPointerMove)
  window.removeEventListener('pointerup', stopContactImageCropDrag)
  window.removeEventListener('pointercancel', stopContactImageCropDrag)
}

function onContactHeroPointerMove(event) {
  if (!contactHeroRef.value) return
  const rect = contactHeroRef.value.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))

  contactHeroGradient.value = {
    x: clamp(x, 8, 92),
    y: clamp(y, 8, 92),
    size: 60,
  }
}

function startContactHeroPointerTracking() {
  if (contactHeroTrackingActive) return
  contactHeroTrackingActive = true
  window.addEventListener('pointermove', onContactHeroPointerMove)
}

function stopContactHeroPointerTracking() {
  contactHeroTrackingActive = false
  window.removeEventListener('pointermove', onContactHeroPointerMove)
}

function loadImageDimensions(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight })
    image.onerror = () => reject(new Error('Unable to load the selected image.'))
    image.src = src
  })
}

async function renderContactImageCrop() {
  if (!pendingContactImageSrc.value) throw new Error('Select an image before saving.')

  const image = await new Promise((resolve, reject) => {
    const nextImage = new Image()
    nextImage.onload = () => resolve(nextImage)
    nextImage.onerror = () => reject(new Error('Unable to prepare the selected image.'))
    nextImage.src = pendingContactImageSrc.value
  })

  const scale = contactImageCropBaseScale.value * contactImageCropZoom.value
  const drawWidth = pendingContactImageNaturalSize.value.width * scale
  const drawHeight = pendingContactImageNaturalSize.value.height * scale
  const left = contactImageCropFrameWidth.value / 2 - drawWidth / 2 + contactImageCropOffset.value.x
  const top = contactImageCropFrameHeight.value / 2 - drawHeight / 2 + contactImageCropOffset.value.y
  const sourceX = Math.max(0, (0 - left) / scale)
  const sourceY = Math.max(0, (0 - top) / scale)
  const sourceWidth = Math.min(
    pendingContactImageNaturalSize.value.width - sourceX,
    contactImageCropFrameWidth.value / scale,
  )
  const sourceHeight = Math.min(
    pendingContactImageNaturalSize.value.height - sourceY,
    contactImageCropFrameHeight.value / scale,
  )

  const canvas = document.createElement('canvas')
  canvas.width = contactImageOutputWidth.value
  canvas.height = contactImageOutputHeight.value
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Unable to crop the selected image.')

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    contactImageOutputWidth.value,
    contactImageOutputHeight.value,
  )

  return canvas.toDataURL('image/jpeg', 0.92)
}

async function confirmContactImageCrop() {
  uploadingContactImage.value = true
  try {
    const croppedImage = await renderContactImageCrop()
    const saved =
      currentImageUploadTarget.value === 'company'
        ? await saveCompanyLogo(croppedImage)
        : await saveContactImage(croppedImage)
    if (saved) cancelContactImageCrop()
  } catch (e) {
    $q.notify({ type: 'negative', message: e?.message || String(e) })
  } finally {
    uploadingContactImage.value = false
  }
}

function getImageTargetConfig() {
  if (currentImageUploadTarget.value === 'company') {
    return {
      field: companyLogoField.value,
      label: 'Company logo',
    }
  }

  return {
    field: contactImageField.value,
    label: 'Profile image',
  }
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Unable to read the selected image.'))
    reader.onload = () => resolve(String(reader.result || ''))
    reader.readAsDataURL(file)
  })
}

watch(
  () => `${route.params.tableName || ''}:${route.params.recordId || ''}`,
  () => {
    activeContactSection.value = 'general-information'
    activeCompanySection.value = 'general-information'
    loadDatabook()
  },
)

watch(contactSections, (sections) => {
  const anchors = new Set((sections || []).map((section) => section.anchor))
  if (!anchors.has(activeContactSection.value) && sections?.length) {
    activeContactSection.value = sections[0].anchor
  }
})

watch(companySections, (sections) => {
  const anchors = new Set((sections || []).map((section) => section.anchor))
  if (!anchors.has(activeCompanySection.value) && sections?.length) {
    activeCompanySection.value = sections[0].anchor
  }
})

watch(genericRecordNavItems, (sections) => {
  if (!sections.length) {
    activeGenericSection.value = ''
    return
  }
  const values = sections.map((section) => section.value)
  if (!values.includes(activeGenericSection.value)) {
    activeGenericSection.value = values[0]
  }
})

watch(genericKdbSectionOptions, (sections) => {
  const values = sections.map((section) => section.value)
  if (!values.includes(activeGenericKdbSection.value)) {
    activeGenericKdbSection.value = values[0]
  }
})

watch(contactImageCropZoom, () => {
  contactImageCropOffset.value = clampContactImageCropOffset(contactImageCropOffset.value)
})

watch(activeContactKdbSection, () => {
  contactKdbViewMode.value = 'grid'
  contactKdbKindFilter.value = 'all'
  contactKdbSearchQuery.value = ''
})

watch(activeCompanyKdbSection, () => {
  companyKdbViewMode.value = 'grid'
  companyKdbKindFilter.value = 'all'
  companyKdbSearchQuery.value = ''
})

watch(activeGenericKdbSection, () => {
  genericKdbViewMode.value = 'grid'
  genericKdbKindFilter.value = 'all'
  genericKdbSearchQuery.value = ''
})

watch(
  contactSummaryStorageKey,
  (storageKey) => {
    selectedContactSummaryStatIds.value = loadContactSummarySelection(storageKey)
  },
  { immediate: true },
)

watch(availableContactSummaryOptions, syncContactSummarySelection, { immediate: true })

watch(
  companySummaryStorageKey,
  (storageKey) => {
    selectedCompanySummaryStatIds.value = loadContactSummarySelection(storageKey)
  },
  { immediate: true },
)

watch(availableCompanySummaryOptions, syncCompanySummarySelection, { immediate: true })

onMounted(() => {
  if (!hasBridge.value) return
  loadDatabook()
})

onBeforeUnmount(() => {
  stopContactImageCropDrag()
  stopContactHeroPointerTracking()
  closeDocumentPreview()
})
</script>

<style scoped>
.databook-page {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-20);
}

.databook-heading {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-16);
  justify-content: space-between;
}

.databook-heading--compact {
  align-items: center;
}

.databook-heading__main {
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-16);
  min-width: 0;
}

.databook-heading__back {
  flex: 0 0 auto;
  color: var(--ds-control-menu-text);
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
}

.databook-heading__eyebrow {
  margin-bottom: 6px;
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-heading-eyebrow-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.databook-heading__title {
  margin-top: 10px;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 3vw, 3rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 1;
}

.databook-heading__subtitle {
  max-width: 640px;
  margin-top: 10px;
  color: #5f5f5f;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.databook-heading__actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.databook-heading--compact .databook-heading__eyebrow {
  margin-bottom: 2px;
}

.databook-heading--compact .databook-heading__subtitle {
  max-width: 440px;
  margin-top: 0;
  color: var(--ds-color-text-caption);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.databook-heading--compact .databook-heading__actions {
  align-items: center;
}

.databook-heading__action {
  border-radius: 999px;
}

.databook-heading__action--versions {
  color: #4b5563;
  background: #f3f4f6;
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.databook-heading__action--versions:hover,
.databook-heading__action--versions:focus-visible {
  background: #e5e7eb;
}

.databook-heading__action--versions :deep(.q-icon),
.databook-heading__action--versions :deep(.q-btn-dropdown__arrow) {
  color: #6b7280;
}

.databook-heading__action--edit {
  color: #ffffff;
  background: var(--b10-brand-azul);
  border: 1px solid var(--b10-brand-azul);
}

.databook-heading__action--edit:hover,
.databook-heading__action--edit:focus-visible {
  background: #1f3cf3;
  border-color: #1f3cf3;
}

.contact-databook {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-20);
}

.contact-databook__nav {
  position: sticky;
  top: 76px;
  z-index: 3;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding: 12px;
  background: var(--ds-color-surface-base-88);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  backdrop-filter: blur(14px);
}

.contact-databook__nav-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  color: #4f4f4f;
  cursor: pointer;
  background: transparent;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.contact-databook__nav-item-icon {
  opacity: 0.8;
}

.contact-databook__nav-item:hover {
  color: #111;
  background: rgba(255, 85, 33, 0.08);
  border-color: rgba(255, 85, 33, 0.2);
  transform: translateY(-1px);
}

.contact-databook__nav-item--active {
  color: #fff;
  background: #111;
  border-color: #111;
}

.contact-databook__nav-item--kdb {
  border-color: rgba(17, 17, 17, 0.16);
}

.contact-databook__nav-item--system {
  border-color: rgba(17, 17, 17, 0.22);
}

.contact-databook__nav-item--push-right {
  margin-left: auto;
}

.contact-databook__details {
  display: flex;
  flex-direction: column;
}

.contact-kdb {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.contact-kdb-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  background: transparent;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.contact-kdb-toolbar__block {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1 1 auto;
}

.contact-kdb-toolbar__toggle {
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: none;
  overflow: hidden;
}

.contact-kdb-toolbar__view-toggle :deep(.q-btn) {
  min-width: 56px;
  padding-inline: 12px;
}

.contact-kdb-toolbar__section-toggle {
  flex: 1 1 auto;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
}

.contact-kdb-toolbar__section-toggle :deep(.q-btn) {
  flex: 1 1 0;
  min-width: 112px;
  padding-inline: 14px;
}

.contact-kdb-toolbar__view-toggle :deep(.q-btn + .q-btn),
.contact-kdb-toolbar__section-toggle :deep(.q-btn + .q-btn) {
  margin-left: 12px;
}

.contact-kdb-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.contact-kdb-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.94);
}

.contact-kdb-row__main {
  min-width: 0;
}

.contact-kdb-row__meta {
  color: rgba(15, 23, 42, 0.56);
  font-size: 0.82rem;
  white-space: nowrap;
}

.contact-kdb-artifacts-toolbar {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 24px;
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-soft);
  border-radius: var(--ds-radius-lg);
}

.contact-kdb-artifacts-toolbar__block {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.contact-kdb-artifacts-toolbar__block--search {
  justify-content: flex-end;
  margin-left: auto;
}

.contact-kdb-artifacts-toolbar__filters-icon {
  color: var(--ds-color-text-muted);
  flex: 0 0 auto;
}

.contact-kdb-artifacts-toolbar__toggle {
  flex: 0 0 auto;
  border: 1px solid var(--ds-control-border);
  border-radius: 999px;
  box-shadow: var(--ds-control-shadow);
  overflow: hidden;
}

.contact-kdb-artifacts-toolbar__view-toggle :deep(.q-btn) {
  min-width: 48px;
  padding-inline: 12px;
}

.contact-kdb-artifacts-toolbar__view-toggle :deep(.q-btn + .q-btn),
.contact-kdb-artifacts-toolbar__kind-toggle :deep(.q-btn + .q-btn) {
  margin-left: 6px;
}

.contact-kdb-artifacts-toolbar__kind-toggle :deep(.q-btn) {
  min-width: 84px;
  padding-inline: 18px;
}

.contact-kdb-artifacts-toolbar__search {
  width: 100%;
  min-width: 0;
  background: var(--ds-control-surface);
  border: 1px solid var(--ds-control-border);
  border-radius: var(--ds-control-radius);
  box-shadow: var(--ds-control-shadow);
}

.contact-kdb-artifacts-toolbar__search :deep(.q-field__control),
.contact-kdb-artifacts-toolbar__search :deep(.q-field__native),
.contact-kdb-artifacts-toolbar__search :deep(.q-field__input) {
  min-height: var(--ds-control-height-md);
  height: var(--ds-control-height-md);
}

.contact-kdb-artifacts-toolbar__search :deep(.q-field__control) {
  padding: 0 var(--ds-control-inline-padding);
}

.contact-databook__hero {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(320px, 0.88fr);
  gap: 0;
  padding: 0;
  overflow: hidden;
  background:
    radial-gradient(
      circle at var(--contact-hero-blob-x) var(--contact-hero-blob-y),
      var(--contact-hero-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
      var(--contact-hero-blob-soft, rgba(38, 71, 255, 0.14)) calc(var(--contact-hero-blob-size) * 0.36),
      var(--contact-hero-blob-fade, rgba(38, 71, 255, 0.06)) calc(var(--contact-hero-blob-size) * 0.58),
      transparent var(--contact-hero-blob-size)
    ),
    linear-gradient(180deg, #ffffff 0%, #f8f6f2 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(17, 17, 17, 0.06);
  transition: box-shadow 0.3s ease;
}

.contact-databook__hero-main,
.contact-databook__summary {
  position: relative;
  z-index: 1;
}

.contact-databook__hero-main {
  display: flex;
  gap: 0;
  align-items: stretch;
  min-width: 0;
  min-height: 420px;
}

.contact-databook__portrait {
  position: relative;
  flex: 0 0 clamp(280px, 26vw, 370px);
  width: clamp(280px, 26vw, 370px);
  min-height: 100%;
  margin: 0;
  overflow: hidden;
  background: #d8d4ca;
  border-right: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 24px 0 0 24px;
  box-shadow: none;
}

.contact-databook__portrait::after {
  position: absolute;
  inset: 0;
  content: '';
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(17, 17, 17, 0.18) 100%);
  pointer-events: none;
}

.contact-databook__portrait--initials-only {
  background: transparent;
}

.contact-databook__portrait--initials-only::after {
  display: none;
}

.contact-databook__portrait--badge-only {
  background: transparent;
}

.contact-databook__portrait--badge-only::after {
  display: none;
}

.contact-databook__portrait-actions {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contact-databook__portrait-action {
  color: #111;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.2);
}

.contact-databook__portrait-action :deep(.q-btn__content) {
  min-width: 0;
  min-height: 0;
}

.contact-databook__portrait-action :deep(.q-icon) {
  font-size: 13px;
}

.contact-databook__portrait-menu {
  border-radius: 14px;
  overflow: hidden;
}

.contact-databook__portrait-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: grayscale(1) contrast(1.08);
}

.contact-databook__portrait-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.18), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(17, 17, 17, 0.08) 100%);
}

.contact-databook__portrait--initials-only .contact-databook__portrait-placeholder {
  background: transparent;
}

.contact-databook__portrait--badge-only .contact-databook__portrait-placeholder {
  background: transparent;
}

.contact-databook__portrait-placeholder-icon {
  font-size: clamp(124px, 18vw, 188px);
  color: rgba(255, 255, 255, 0.92);
}

.contact-databook__portrait-placeholder-initials {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(132px, 18vw, 188px);
  height: clamp(132px, 18vw, 188px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 18px 40px rgba(17, 17, 17, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-family: var(--font-title);
  font-size: clamp(2.6rem, 4vw, 4rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
}

.contact-databook__portrait-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: clamp(132px, 18vw, 188px);
  height: clamp(132px, 18vw, 188px);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 18px 40px rgba(17, 17, 17, 0.18);
  color: rgba(255, 255, 255, 0.96);
  font-family: var(--font-title);
  font-size: clamp(2.6rem, 4vw, 4rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
  overflow: hidden;
}

.contact-databook__portrait-badge--logo {
  background: rgba(255, 255, 255, 0.92);
}

.contact-databook__portrait-logo {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: none;
}

.contact-image-cropper-dialog {
  width: 420px;
  max-width: 94vw;
}

.contact-image-cropper-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.contact-document-preview-dialog {
  display: flex;
  flex-direction: column;
}

.contact-document-preview-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.contact-document-preview-dialog__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  padding: 0;
  background: #f5f3ef;
}

.contact-document-preview-dialog__pdf,
.contact-document-preview-dialog__image,
.contact-document-preview-dialog__text,
.contact-document-preview-dialog__state {
  width: 100%;
  min-height: calc(100vh - 120px);
}

.contact-document-preview-dialog__pdf {
  display: grid;
  grid-template-columns: 124px minmax(0, 1fr);
  background: #ebe7df;
}

.contact-document-preview-dialog__pdf-sidebar {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.72);
  border-right: 1px solid rgba(17, 17, 17, 0.08);
}

.contact-document-preview-dialog__pdf-thumb {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 14px;
  cursor: pointer;
}

.contact-document-preview-dialog__pdf-thumb--active {
  background: rgba(255, 255, 255, 0.86);
  border-color: rgba(17, 17, 17, 0.1);
  box-shadow: 0 10px 24px rgba(17, 17, 17, 0.08);
}

.contact-document-preview-dialog__pdf-thumb-image {
  display: block;
  width: 100%;
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
}

.contact-document-preview-dialog__pdf-thumb-label {
  color: #555;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
  text-align: center;
}

.contact-document-preview-dialog__pdf-main {
  overflow: auto;
  padding: 24px;
}

.contact-document-preview-dialog__pdf-page {
  display: block;
  width: min(100%, 1320px);
  margin: 0 auto;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 18px 48px rgba(17, 17, 17, 0.14);
}

.contact-document-preview-dialog__image {
  display: block;
  object-fit: contain;
  background: #d9d4cc;
}

.contact-document-preview-dialog__text {
  overflow: auto;
  margin: 0;
  padding: 28px;
  color: #111;
  background: #fcfbf8;
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.contact-document-preview-dialog__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.contact-image-cropper {
  display: flex;
  justify-content: center;
  user-select: none;
}

.contact-image-cropper__frame {
  position: relative;
  width: 280px;
  height: 420px;
  overflow: hidden;
  background: #e7e5e4;
  border-radius: 20px;
  cursor: grab;
  touch-action: none;
}

.contact-image-cropper__frame--circle {
  border-radius: 999px;
}

.contact-image-cropper__frame:active {
  cursor: grabbing;
}

.contact-image-cropper__image {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  transform-origin: center;
  will-change: transform;
}

.contact-image-cropper__overlay {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 20px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.26);
  pointer-events: none;
}

.contact-image-cropper__overlay--circle {
  border-radius: 999px;
}

.contact-image-cropper__controls {
  padding: 0 10px;
}

.contact-databook__hero-copy {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  justify-content: center;
  gap: var(--ds-space-12);
  min-width: 0;
  padding: 36px 36px 34px 16px;
}

.contact-databook__eyebrow,
.contact-section-card__eyebrow,
.contact-side-card__eyebrow,
.contact-databook__summary-label {
  color: var(--ds-color-text-muted-alt);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-heading-eyebrow-spacing);
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contact-databook__name {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: clamp(2rem, 4vw, 3.75rem);
  font-weight: var(--ds-font-weight-black);
  line-height: 0.95;
}

.contact-databook__role {
  color: #454545;
  font-family: var(--font-body);
  font-size: var(--text-lg---regular);
  font-weight: var(--font-weight-regular);
  line-height: 24px;
}

.contact-databook__role--location {
  color: #6b6b6b;
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.contact-databook__pill-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.contact-databook__pill {
  padding: 7px 10px;
  color: #111;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
}

.contact-databook__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding-top: 4px;
}

.contact-databook__action {
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border-color: rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
}

.contact-databook__hero-notes-panel {
  margin-top: 6px;
  padding: var(--ds-space-16) var(--ds-space-18);
  background: rgba(255, 255, 255, 0.74);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(18px);
}

.contact-databook__hero-tabs {
  display: inline-flex;
  gap: 6px;
  align-self: flex-start;
  padding: 4px;
  background: rgba(17, 17, 17, 0.05);
  border-radius: 999px;
}

.contact-databook__hero-tab {
  padding: 7px 12px;
  color: var(--ds-color-text-muted-alt);
  background: transparent;
  border: 0;
  border-radius: var(--ds-radius-pill);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.04em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.contact-databook__hero-tab:hover,
.contact-databook__hero-tab:focus-visible {
  color: #111;
  background: rgba(255, 255, 255, 0.58);
}

.contact-databook__hero-tab--active {
  color: #111;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 18px rgba(17, 17, 17, 0.08);
}

.contact-databook__summary-notes-label {
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contact-databook__hero-notes,
.contact-databook__hero-documents,
.contact-databook__summary-notes {
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-12);
  margin-top: 10px;
  padding: 0;
  list-style: none;
}

.contact-databook__hero-note,
.contact-databook__hero-document,
.contact-databook__summary-note {
  position: relative;
  padding-left: 18px;
}

.contact-databook__hero-note::before,
.contact-databook__hero-document::before,
.contact-databook__summary-note::before {
  position: absolute;
  top: 8px;
  left: 0;
  width: 6px;
  height: 6px;
  content: '';
  border-radius: 999px;
}

.contact-databook__hero-note::before {
  background: rgba(17, 17, 17, 0.3);
}

.contact-databook__hero-document::before {
  background: rgba(17, 17, 17, 0.3);
}

.contact-databook__notes-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ds-space-12);
}

.contact-databook__notes-title {
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-medium);
  font-weight: var(--ds-font-weight-medium);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__notes-content {
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__notes-meta {
  flex: 0 0 auto;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  line-height: var(--ds-line-height-xs);
  white-space: nowrap;
}

.contact-databook__hero-note .contact-databook__notes-title {
  color: #111;
}

.contact-databook__hero-note .contact-databook__notes-content {
  color: #454545;
}

.contact-databook__hero-note .contact-databook__notes-meta {
  color: #7a7a7a;
}

.contact-databook__hero-document .contact-databook__notes-title {
  color: #111;
}

.contact-databook__hero-document .contact-databook__notes-content {
  color: #454545;
}

.contact-databook__hero-document .contact-databook__notes-meta {
  color: #7a7a7a;
}

.contact-databook__hero-documents-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.contact-databook__hero-document-drop {
  padding-left: 0;
}

.contact-databook__hero-document-drop::before {
  display: none;
}

.contact-databook__hero-document {
  display: flex;
  gap: var(--ds-space-14);
  align-items: center;
  padding: 8px;
  border-radius: var(--ds-radius-panel);
  cursor: pointer;
  transition:
    background-color 180ms ease,
    transform 180ms ease,
    box-shadow 180ms ease;
}

.contact-databook__hero-document::before {
  display: none;
}

.contact-databook__hero-document:hover,
.contact-databook__hero-document:focus-visible {
  background: rgba(255, 255, 255, 0.55);
  box-shadow: inset 0 0 0 1px rgba(17, 17, 17, 0.06);
  transform: translateY(-1px);
}

.contact-databook__hero-document--loading {
  opacity: 0.76;
}

.contact-databook__hero-document-thumb {
  position: relative;
  display: flex;
  width: 58px;
  height: 74px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(241, 237, 232, 0.92) 100%);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 14px;
  box-shadow: 0 8px 18px rgba(17, 17, 17, 0.06);
}

.contact-databook__hero-document-thumb-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.contact-databook__hero-document-thumb-icon {
  font-size: 24px;
  color: #3f3f3f;
}

.contact-databook__hero-document-thumb-ext {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 3px 7px;
  color: #111;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  letter-spacing: 0.08em;
  line-height: 1;
}

.contact-databook__hero-document-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.contact-databook__hero-document-meta {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 4px;
}

.contact-databook__hero-document-name {
  overflow: hidden;
  color: #111;
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-databook__hero-document-date {
  color: #7a7a7a;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  line-height: 16px;
}

.contact-databook__hero-document-type {
  color: #5e5e5e;
  font-family: var(--font-body);
  font-size: var(--text-xs---regular);
  line-height: 16px;
}

.contact-databook__hero-document-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 6px;
  margin-left: auto;
}

.contact-databook__hero-document-action {
  color: #111;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 999px;
  font-family: var(--font-body);
  font-size: var(--text-xs---medium);
  font-weight: var(--font-weight-medium);
}

.contact-databook__hero-document-action :deep(.q-btn__content) {
  gap: 4px;
}

.contact-databook__hero-dropzone {
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  color: #4f4f4f;
  background: rgba(255, 255, 255, 0.5);
  border: 1.5px dashed rgba(17, 17, 17, 0.14);
  border-radius: 16px;
  transition:
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    transform 180ms ease;
}

.contact-databook__hero-dropzone--active {
  color: #111;
  background: rgba(255, 255, 255, 0.82);
  border-color: rgba(17, 17, 17, 0.32);
  transform: translateY(-1px);
}

.contact-databook__hero-dropzone--loading {
  color: #111;
  background: rgba(255, 255, 255, 0.82);
  border-style: solid;
}

.contact-databook__hero-dropzone-icon {
  font-size: 18px;
}

.contact-databook__hero-dropzone-copy {
  font-family: var(--font-body);
  font-size: var(--text-sm---medium);
  font-weight: var(--font-weight-medium);
  line-height: 20px;
  text-align: center;
}

.contact-databook__hero-panel-empty {
  margin-top: 10px;
  color: #6f6f6f;
  font-family: var(--font-body);
  font-size: var(--text-sm---regular);
  line-height: 20px;
}

.contact-databook__hero-panel-empty--copy {
  text-align: left;
  white-space: pre-wrap;
}

.contact-databook__summary {
  align-self: stretch;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  margin: 28px;
  padding: var(--ds-panel-padding-md);
  background: rgba(17, 17, 17, 0.94);
  border-radius: var(--ds-radius-card);
  color: #fff;
}

.contact-databook__summary-header {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: var(--ds-space-12);
}

.contact-databook__summary-feed-toggle {
  margin-top: 16px;
}

.contact-databook__summary-feed-toolbar {
  display: flex;
  width: 100%;
  padding: 3px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
}

.contact-databook__summary-feed-button {
  flex: 1 1 0;
  min-height: 30px;
  padding: 0 8px;
  color: rgba(255, 255, 255, 0.72);
  background: transparent;
  border: 0;
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 10px;
  font-weight: var(--font-weight-medium);
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 180ms ease,
    color 180ms ease;
}

.contact-databook__summary-feed-button:hover,
.contact-databook__summary-feed-button:focus-visible {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
  outline: none;
}

.contact-databook__summary-feed-button--active {
  color: #111111;
  background: rgba(255, 255, 255, 0.94);
}

.contact-databook__summary-feed-button + .contact-databook__summary-feed-button {
  margin-left: 3px;
}

.contact-databook__summary-feed-state {
  margin-top: 18px;
  color: rgba(255, 255, 255, 0.62);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-databook__summary-notes-panel {
  margin-top: 18px;
}

.contact-databook__summary-notes-label {
  color: rgba(255, 255, 255, 0.62);
}

.contact-databook__summary-note::before {
  background: rgba(255, 255, 255, 0.62);
}

.contact-databook__summary-note .contact-databook__notes-title {
  color: #fff;
}

.contact-databook__summary-note .contact-databook__notes-content {
  margin-top: 4px;
  color: rgba(255, 255, 255, 0.78);
}

.contact-databook__summary-note .contact-databook__notes-meta {
  color: rgba(255, 255, 255, 0.54);
}

.contact-databook__summary-empty {
  margin-top: 18px;
  padding: var(--ds-panel-padding-sm);
  border: 1px dashed rgba(255, 255, 255, 0.18);
  border-radius: var(--ds-radius-panel);
  color: rgba(255, 255, 255, 0.72);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-insight-card,
.contact-section-card,
.contact-side-card {
  background: var(--ds-color-surface-base);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-card);
  box-shadow: var(--ds-shadow-card-medium);
}

.contact-insight-card {
  min-height: 100%;
  padding: var(--ds-card-padding-md);
}

.contact-insight-card__label {
  color: #757575;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.1em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contact-insight-card__value {
  margin-top: 12px;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: var(--text-xl---black);
  font-weight: var(--ds-font-weight-black);
  line-height: 1.1;
}

.contact-section-card,
.contact-side-card {
  padding: var(--ds-card-padding-lg);
  scroll-margin-top: 152px;
}

.contact-section-card--active {
  min-height: 320px;
}

.contact-system-grid,
.contact-context-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-20);
}

.contact-context-card__empty {
  padding: var(--ds-field-padding);
  color: var(--ds-color-text-muted-alt);
  background: var(--ds-color-surface-subtle-alt);
  border: 1px dashed var(--ds-color-border-dashed);
  border-radius: var(--ds-radius-panel);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  line-height: var(--ds-line-height-sm);
}

.contact-section-card__header {
  display: flex;
  gap: var(--ds-space-12);
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 18px;
}

.contact-section-card__intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 640px;
}

.contact-side-card__header {
  margin-bottom: 18px;
}

.contact-side-card__intro {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.contact-section-card__title,
.contact-side-card__title {
  margin: 0;
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-title);
  font-size: var(--text-2xl---black);
  font-weight: var(--ds-font-weight-black);
  line-height: 1.05;
}

.contact-section-card__caption {
  color: var(--ds-color-text-caption);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-sm-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-sm);
  text-align: left;
}

.contact-section-card__icon {
  flex: 0 0 auto;
  width: 34px;
  height: 34px;
  margin-top: 1px;
  color: #a3a3a3;
}

.contact-field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-14);
}

.contact-field-grid--single {
  grid-template-columns: minmax(0, 1fr);
}

.contact-field-card,
.contact-side-card__field,
.contact-side-card__meta-item {
  padding: var(--ds-field-padding);
  background: var(--ds-color-surface-subtle-alt);
  border: 1px solid var(--ds-color-fill-subtle);
  border-radius: var(--ds-radius-panel);
}

.contact-field-card__label,
.contact-side-card__meta-label {
  color: var(--ds-color-text-muted);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-medium);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: 0.08em;
  line-height: var(--ds-line-height-xs);
  text-transform: uppercase;
}

.contact-field-card__value,
.contact-side-card__meta-value,
.contact-note-card__text {
  margin-top: 10px;
  word-break: break-word;
  white-space: pre-wrap;
  color: var(--ds-color-text-body-strong);
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-base-regular);
  font-weight: var(--ds-font-weight-regular);
  line-height: var(--ds-line-height-base);
}

.contact-field-card__input {
  margin-top: 10px;
}

.contact-section-card__modified {
  margin-top: 8px;
  color: #b42318;
  font-family: var(--ds-font-family-body);
  font-size: var(--ds-font-size-xs-regular);
  font-style: italic;
  line-height: var(--ds-line-height-xs);
}

.contact-section-card__empty {
  border: 1px dashed var(--ds-color-border-dashed);
}

.contact-field-card--note {
  min-height: 184px;
}

.contact-note-card__text {
  margin: 0;
}

.contact-side-card__meta-list,
.contact-side-card__stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 0;
}

.databook-value-section {
  min-width: 360px;
  max-width: 640px;
  width: 100%;
}

.databook-value {
  text-align: left;
  white-space: pre-wrap;
}

@media (max-width: 1100px) {
  .contact-databook__hero {
    grid-template-columns: 1fr;
  }

  .contact-section-card__header {
    flex-direction: column;
  }

  .contact-section-card__caption {
    max-width: none;
    text-align: left;
  }
}

@media (max-width: 720px) {
  .databook-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .databook-heading__main {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .databook-heading__actions {
    justify-content: flex-start;
    flex-wrap: wrap;
  }

  .databook-heading__title {
    font-size: 2.25rem;
  }

  .contact-databook__hero {
    grid-template-columns: 1fr;
    border-radius: 20px;
  }

  .contact-databook__nav {
    top: 68px;
  }

  .contact-databook__hero-main {
    flex-direction: column;
    min-height: 0;
  }

  .contact-databook__portrait {
    width: 100%;
    min-height: 320px;
    flex-basis: auto;
    border-right: none;
    border-bottom: 1px solid rgba(17, 17, 17, 0.08);
    border-radius: 20px 20px 0 0;
  }

  .contact-databook__hero-copy {
    padding: 20px;
  }

  .contact-databook__summary {
    margin: 0 20px 20px;
  }

  .contact-databook__summary-grid,
  .contact-field-grid {
    grid-template-columns: 1fr;
  }

  .contact-system-grid,
  .contact-context-grid {
    grid-template-columns: 1fr;
  }

  .contact-section-card,
  .contact-side-card {
    padding: 18px;
  }

  .databook-value-section {
    min-width: 100%;
  }
}
</style>
