<template>
  <q-page class="q-pa-md test-shell-page">
    <div v-if="!isElectronRuntime" class="q-pa-md">
      <q-banner class="bg-orange-2 text-black" rounded>
        {{ pageShellLabel }} requires Electron. Run <code>quasar dev -m electron</code> or
        <code>quasar build -m electron</code>.
      </q-banner>
    </div>

    <div v-else-if="!hasResolvedSourceKey" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        File Shell source is not mapped to an approved file section.
      </q-banner>
    </div>

    <div v-else-if="!hasSupportedBridge" class="q-pa-md">
      <q-banner class="bg-red-2 text-black" rounded>
        Electron detected, but this section does not expose a supported list bridge yet.
      </q-banner>
    </div>

    <div v-else class="test-shell-body">
      <FileHero
        :text="heroText"
        :stats="heroStats"
        :health-text="healthText"
        :health-segments="healthSegments"
        :action-label="heroActionLabel"
        :action-title="heroActionTitle"
        :action-items="heroActionItems"
        @action-item-click="handleHeroActionItemClick"
      />

      <template v-if="false">
      <ShellSectionToolbar
        v-if="eventShellNavItems.length"
        v-model="activeSectionKeyForCards"
        aria-label="Event sections"
        :items="eventShellNavItems"
        :view-mode="viewMode"
        :view-options="viewOptions"
        @update:view-mode="viewMode = $event"
      />

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <q-banner
        v-if="!loading && displayRows.length === 0"
        class="test-shell-empty-state bg-grey-1 text-black"
        rounded
      >
        No events yet.
      </q-banner>

      <section v-else class="event-shell__panel">
        <div class="event-shell__panel-head">
          <div class="event-shell__panel-title">{{ activeSection?.label || 'General' }}</div>
          <div class="event-shell__panel-meta">{{ activeSectionTokens.length }} fields</div>
        </div>

        <div v-if="!activeSectionTokens.length" class="event-shell__empty">
          No fields declared for this section.
        </div>

        <div v-else-if="viewMode === 'card'" class="event-shell__grid">
          <article v-for="row in displayRows" :key="row.cardId" class="event-shell__card">
            <div class="event-shell__card-top">
              <div class="event-shell__card-title">{{ row.titleValue || 'Event' }}</div>
              <button type="button" class="event-shell__card-open" aria-label="Open event" @click="openRecordView(row)">
                <q-icon name="open_in_new" size="13px" />
              </button>
            </div>

            <div class="event-shell__card-meta">{{ row.raw?.edited_at || 'Recent' }}</div>

            <div class="event-shell__field-grid">
              <div v-for="token in activeSectionTokens" :key="`${row.cardId}:${token.key}`" class="event-shell__field-card">
                <div class="event-shell__field-label">{{ token.label }}</div>
                <div v-if="eventTokenItems(row, token).length" class="event-shell__chip-list">
                  <span
                    v-for="item in eventTokenItems(row, token)"
                    :key="`${row.cardId}:${token.key}:${item}`"
                    class="event-shell__chip"
                  >
                    {{ item }}
                  </span>
                </div>
                <div v-else class="event-shell__field-value" :class="{ 'event-shell__field-value--empty': !eventTokenDisplayValue(row, token) }">
                  {{ eventTokenDisplayValue(row, token) || 'No value yet' }}
                </div>
              </div>
            </div>
          </article>
        </div>

        <div v-else class="event-shell__list">
          <article v-for="row in displayRows" :key="row.cardId" class="event-shell__list-row">
            <div class="event-shell__list-row-head">
              <div class="event-shell__card-title">{{ row.titleValue || 'Event' }}</div>
              <div class="event-shell__list-row-actions">
                <div class="event-shell__card-meta">{{ row.raw?.edited_at || 'Recent' }}</div>
                <button type="button" class="event-shell__card-open" aria-label="Open event" @click="openRecordView(row)">
                  <q-icon name="open_in_new" size="13px" />
                </button>
              </div>
            </div>

            <div class="event-shell__field-grid event-shell__field-grid--list">
              <div v-for="token in activeSectionTokens" :key="`${row.cardId}:${token.key}`" class="event-shell__field-card">
                <div class="event-shell__field-label">{{ token.label }}</div>
                <div v-if="eventTokenItems(row, token).length" class="event-shell__chip-list">
                  <span
                    v-for="item in eventTokenItems(row, token)"
                    :key="`${row.cardId}:${token.key}:${item}`"
                    class="event-shell__chip"
                  >
                    {{ item }}
                  </span>
                </div>
                <div v-else class="event-shell__field-value" :class="{ 'event-shell__field-value--empty': !eventTokenDisplayValue(row, token) }">
                  {{ eventTokenDisplayValue(row, token) || 'No value yet' }}
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
      </template>

      <template v-else>
      <FilePageToolbar
        :all-visible-selected="allVisibleSelected"
        :some-visible-selected="someVisibleSelected"
        :disabled="false"
        :loading="loading"
        :add-disabled="!supportsActiveSourceEditing || !canCreateWithShell"
        :fork-value="activeForkValue"
        :fork-options="toolbarForkOptions"
        :search-query="searchQuery"
        :search-placeholder="searchPlaceholder"
        :view-mode="viewMode"
        :view-options="viewOptions"
        :show-view-toggle="true"
        @toggle-select-all="toggleSelectAllVisible"
        @add="handleToolbarAdd"
        @update:fork-value="setActiveForkValue"
        @update:search-query="searchQuery = $event"
        @update:view-mode="viewMode = $event"
      >
        <template #primary-trailing>
          <div v-if="isBbFileSource && activeBbFilterGroup" class="bb-shell-toolbar-filter">
            <button
              type="button"
              class="bb-shell-toolbar-filter__chip"
              :aria-label="`Selected building block filter ${activeBbFilterLabel}`"
            >
              <span class="bb-shell-toolbar-filter__chip-label">{{ activeBbFilterLabel }}</span>
              <q-menu
                anchor="bottom left"
                self="top left"
                class="test-shell-filters-menu"
                content-class="test-shell-filters-menu__content"
              >
                <div class="test-shell-filters-panel">
                  <div class="test-shell-filters-panel__title">{{ activeBbFilterGroup.label }}</div>
                  <div class="test-shell-filters-panel__rows">
                    <div class="test-shell-filter-group">
                      <div class="test-shell-filter-group__children">
                        <button
                          type="button"
                          class="test-shell-filter-child-row"
                          :class="{ 'test-shell-filter-child-row--selected': !activeBbBlockKey }"
                          @click="applyBbFilterSelection(`category:${activeBbFilterGroup.key}`)"
                        >
                          <span class="test-shell-filter-child-row__label">{{ activeBbFilterGroup.label }}</span>
                        </button>
                        <button
                          v-for="block in activeBbFilterGroup.blocks"
                          :key="`active-filter:${block.key}`"
                          type="button"
                          class="test-shell-filter-child-row"
                          :class="{ 'test-shell-filter-child-row--selected': block.key === activeBbBlockKey }"
                          @click="applyBbFilterSelection(`block:${block.key}`)"
                        >
                          <span class="test-shell-filter-child-row__label">{{ block.label }}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </q-menu>
            </button>

            <button
              type="button"
              class="bb-shell-toolbar-filter__clear"
              aria-label="Clear building block filter"
              @click="clearActiveBbFilter()"
            >
              <q-icon name="close" size="14px" />
            </button>
          </div>
        </template>

        <template #filters>
          <q-btn flat round dense class="test-shell-filters-trigger" icon="filter_list" aria-label="File shell filters">
            <q-menu
              anchor="top left"
              self="top right"
              class="test-shell-filters-menu"
              content-class="test-shell-filters-menu__content"
            >
              <FileFilterMenu
                :title="isBbFileSource ? 'Building Block Filter' : 'File Filter'"
                :sections="fileFilterMenuSections"
                :expanded-section-key="isBbFileSource ? expandedBbFilterCategoryKey : expandedFilterSectionKey"
                @toggle-section="handleFileFilterToggleSection"
                @toggle-item="handleFileFilterToggleItem"
                @toggle-item-checkbox="handleFileFilterToggleItemCheckbox"
              />
            </q-menu>
          </q-btn>
        </template>
      </FilePageToolbar>

      <q-banner v-if="error" class="bg-red-2 text-black" rounded>
        {{ error }}
      </q-banner>

      <q-banner
        v-if="!loading && displayRows.length === 0"
        class="test-shell-empty-state bg-grey-1 text-black"
        rounded
      >
        No real rows loaded for {{ activeRegistryEntry?.label || 'this section' }}.
      </q-banner>

      <div v-else-if="viewMode === 'card' && isBbFileSource" class="bb-shell-tiles-surface">
        <div class="bb-shell-tiles-toolbar">
          <button type="button" class="bb-shell-tiles-toolbar__btn" @click="setAllBbTilesCollapsed(true)">
            Collapse all
          </button>
          <button type="button" class="bb-shell-tiles-toolbar__btn" @click="setAllBbTilesCollapsed(false)">
            Expand all
          </button>
        </div>

        <section
          v-for="group in bbTileGroups"
          :key="group.key"
          class="bb-shell-tiles-group"
        >
          <button
            type="button"
            class="bb-shell-tiles-group__header"
            :aria-label="`${isBbTileGroupOpen(group.key) ? 'Collapse' : 'Expand'} ${group.label}`"
            @click="toggleBbTileGroup(group.key)"
          >
            <q-icon
              :name="isBbTileGroupOpen(group.key) ? 'expand_less' : 'expand_more'"
              size="16px"
              class="bb-shell-tiles-group__chevron"
            />
            <div class="bb-shell-tiles-group__title">{{ group.label }}</div>
          </button>

          <div v-if="isBbTileGroupOpen(group.key)" class="bb-shell-tiles-grid">
            <BuildingBlockPreviewTile
              v-for="row in group.rows"
              :key="row.cardId"
              :block-key="getBbTileBlockKey(row)"
              :title="row.titleValue"
              :status-label="getBbTileStatus(row)"
              :collapse-state="bbTileCollapseState"
              :collapse-version="bbTileCollapseVersion"
            >
              <template #selection>
                <q-checkbox
                  :model-value="isRowSelected(row)"
                  color="dark"
                  class="bb-shell-tiles-grid__select-box"
                  @update:model-value="toggleRowSelection(row, $event)"
                />
              </template>

              <template #actions>
                <q-btn
                  flat
                  round
                  dense
                  icon="content_copy"
                  aria-label="Copy record id"
                  :disable="!row.recordId"
                  @click="copyRowRecordId(row)"
                />
                <EyeIconButton
                  aria-label="View block tile"
                  :disable="!row.recordId"
                  @click="openBbShell(row)"
                />
              </template>
            </BuildingBlockPreviewTile>
          </div>
        </section>
      </div>

      <div v-else-if="viewMode === 'card'" class="row q-col-gutter-md test-shell-cards-grid">
        <div v-for="row in displayRows" :key="row.cardId" class="col-12 col-sm-6 col-lg-4">
          <q-card
            flat
            bordered
            class="test-shell-card full-height"
            :class="{ 'test-shell-card--editable': canOpenCardEdit(row) }"
            :style="getTestShellCardStyle()"
            @pointerenter="onTestShellCardPointerEnter"
            @pointermove="onTestShellCardPointerMove"
            @pointerleave="onTestShellCardPointerLeave"
            @dblclick="requestEditRecordShell(row)"
          >
            <q-card-section class="test-shell-card__control-row">
              <div class="test-shell-card__control-leading">
                <q-checkbox
                  :model-value="isRowSelected(row)"
                  color="dark"
                  class="test-shell-card__select-box"
                  @update:model-value="toggleRowSelection(row, $event)"
                />
              </div>
              <div class="test-shell-card__control-actions">
                <L2SettingsMenu
                  v-if="cardSettingsMenuGroups.length"
                  title="Card Settings"
                  :groups="cardSettingsMenuGroups"
                  @toggle-group="toggleCardSettingsGroup"
                  @toggle-item="setCardItemEnabled"
                />
                <q-btn
                  flat
                  round
                  icon="visibility"
                  class="test-shell-card__control-eye"
                  :disable="!row.recordId"
                  @click="openRecordView(row)"
                />
              </div>
            </q-card-section>

            <q-card-section class="test-shell-card__hero">
              <div class="test-shell-card__hero-main">
                <figure class="test-shell-card__portrait">
                  <div class="test-shell-card__portrait-shell" aria-hidden="true">
                    <div class="test-shell-card__portrait-badge" :style="{ backgroundColor: getTestShellAvatarColor(row) }">
                      {{ row.avatarText }}
                    </div>
                  </div>
                </figure>

                <div class="test-shell-card__hero-side">
                  <div class="test-shell-card__hero-copy">
                    <div class="test-shell-card__title" :class="{ 'test-shell-card__value--placeholder': !row.titleValue }">
                      {{ row.titleValue || 'Title mapping undefined' }}
                    </div>

                    <div class="test-shell-card__bottom-stack">
                      <div
                        v-if="getTestShellSubtitleRow(row)"
                        class="test-shell-card__subtitle"
                      >
                        {{ getTestShellSubtitleRow(row).value }}
                        <q-tooltip anchor="top middle" self="bottom middle" class="test-shell-card__inline-chip-tooltip">
                          {{ getTestShellSubtitleRow(row).label }}
                        </q-tooltip>
                      </div>

                      <div v-if="getTestShellChipRows(row).length" class="test-shell-card__detail-stack">
                        <div
                          v-for="detail in getTestShellChipRows(row)"
                          :key="detail.label"
                          class="test-shell-card__detail-row"
                        >
                          <button type="button" class="test-shell-card__inline-chip">
                            <span class="test-shell-card__inline-chip-value">{{ detail.value }}</span>
                            <q-tooltip anchor="top middle" self="bottom middle" class="test-shell-card__inline-chip-tooltip">
                              {{ detail.label }}
                            </q-tooltip>
                          </button>
                        </div>
                      </div>

                      <div v-else class="test-shell-card__detail-stack">
                        <div class="test-shell-card__detail-row">
                          <button type="button" class="test-shell-card__inline-chip test-shell-card__inline-chip--placeholder">
                            <q-icon name="info" size="14px" />
                            <span>Metadata mapping undefined</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>

            <q-card-section v-if="hasActiveSourceKdb" class="test-shell-card__summary">
              <div class="test-shell-card__summary-head">
                <q-btn-toggle
                  :model-value="getRowRelationshipPanel(row)"
                  dense
                  unelevated
                  toggle-color="dark"
                  color="white"
                  text-color="grey-8"
                  class="test-shell-card__summary-toggle"
                  :options="summarySectionShellOptions"
                  @update:model-value="setRowRelationshipPanel(row, $event)"
                />
                <q-btn flat no-caps class="test-shell-card__summary-add-relation" aria-label="Add Relation" :disable="!supportsActiveSourceEditing || getRowRelationshipPanel(row) === 'events'" @click="handleCardAddRelation(row)">
                  <span class="test-shell-card__summary-add-relation-plus">
                    <q-icon name="add" />
                  </span>
                  <span class="test-shell-card__summary-add-relation-label">Add</span>
                </q-btn>
              </div>

              <div class="test-shell-card__summary-panel">
                <div class="test-shell-card__summary-body">
                  <div class="test-shell-card__summary-body-content">
                    <div v-if="getActiveRelationshipItems(row).length" class="test-shell-card__notes-list">
                      <div
                        v-for="item in getActiveRelationshipItems(row)"
                        :key="`${row.cardId}:${getRowRelationshipPanel(row)}:${item}`"
                        class="test-shell-card__note-pill"
                      >
                        <span class="test-shell-card__note-pill-name">
                          {{ getCardRelationshipLabel(getRowRelationshipPanel(row)) }}
                        </span>
                        <span class="test-shell-card__note-pill-value">{{ item }}</span>
                      </div>
                    </div>

                    <div v-else class="test-shell-card__summary-empty">
                      {{ getActiveRelationshipEmptyMessage(row) }}
                    </div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
      <div v-else class="test-shell-table-surface">
        <div class="test-shell-table-tabs">
          <div class="test-shell-table-tabs__left">
            <button
              v-for="section in tableLeftSections"
              :key="section.key"
              type="button"
              class="test-shell-table-tabs__tab"
              :class="{ 'test-shell-table-tabs__tab--active': section.key === activeSection?.key }"
              @click="activeSectionKeyForCards = section.key"
            >
              {{ section.label }}
            </button>
          </div>

          <div class="test-shell-table-tabs__right">
            <button
              v-for="section in tableRightSections"
              :key="section.key"
              type="button"
              class="test-shell-table-tabs__tab"
              :class="{ 'test-shell-table-tabs__tab--active': section.key === activeSection?.key }"
              @click="activeSectionKeyForCards = section.key"
            >
              {{ section.label }}
            </button>
          </div>
        </div>

        <div ref="tableScrollRef" class="test-shell-table-scroll">
          <table class="test-shell-table">
            <thead>
              <tr>
                <th
                  class="test-shell-table__head test-shell-table__head--control"
                  :style="getTableColumnStyle('select', TABLE_CONTROL_COLUMN_WIDTH)"
                />
                <th
                  class="test-shell-table__head test-shell-table__head--control"
                  :style="getTableColumnStyle('view', TABLE_CONTROL_COLUMN_WIDTH)"
                />
                <th
                  class="test-shell-table__head test-shell-table__head--name"
                  :style="getTableColumnStyle('name', NAME_COLUMN_DEFAULT_WIDTH)"
                >
                  <div class="test-shell-table__head-inner">
                    <span>Name</span>
                    <button
                      type="button"
                      class="test-shell-table__resize-handle"
                      aria-label="Resize Name column"
                      @pointerdown.stop.prevent="startColumnResize('name', 0, $event)"
                    />
                  </div>
                </th>
                <th
                  v-for="token in tableSectionTokens"
                  :key="token.key"
                  class="test-shell-table__head"
                  :style="getTableColumnStyle(token.key, DEFAULT_COLUMN_MIN_WIDTH)"
                >
                  <div class="test-shell-table__head-inner">
                    <span>{{ token.label }}</span>
                    <button
                      type="button"
                      class="test-shell-table__resize-handle"
                      :aria-label="`Resize ${token.label} column`"
                      @pointerdown.stop.prevent="startColumnResize(token.key, DEFAULT_COLUMN_MIN_WIDTH, $event)"
                    />
                  </div>
                </th>
                <th
                  v-if="isSystemSectionActive"
                  class="test-shell-table__head"
                  :style="getTableColumnStyle('history', 320)"
                >
                  <div class="test-shell-table__head-inner">
                    <span>History</span>
                    <button
                      type="button"
                      class="test-shell-table__resize-handle"
                      aria-label="Resize History column"
                      @pointerdown.stop.prevent="startColumnResize('history', 320, $event)"
                    />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in displayRows" :key="row.cardId">
                <td
                  class="test-shell-table__cell test-shell-table__cell--control"
                  :style="getTableColumnStyle('select', TABLE_CONTROL_COLUMN_WIDTH)"
                >
                  <q-checkbox
                    :model-value="isRowSelected(row)"
                    color="dark"
                    dense
                    size="xs"
                    class="test-shell-table__select-box"
                    @update:model-value="toggleRowSelection(row, $event)"
                  />
                </td>
                <td
                  class="test-shell-table__cell test-shell-table__cell--control"
                  :style="getTableColumnStyle('view', TABLE_CONTROL_COLUMN_WIDTH)"
                >
                  <q-btn
                    flat
                    round
                    dense
                    size="8px"
                    icon="visibility"
                    class="test-shell-table__eye"
                    :disable="!row.recordId"
                    @click="isBbFileSource ? openBbShell(row) : openRecordView(row)"
                  />
                </td>
                <td
                  class="test-shell-table__cell test-shell-table__cell--name"
                  :style="getTableColumnStyle('name', NAME_COLUMN_DEFAULT_WIDTH)"
                >
                  <div
                    class="test-shell-table__name-row"
                    :class="{
                      'test-shell-table__cell--editable': canInlineEditTableCell(row, canonicalTitleToken, 'name'),
                      'test-shell-table__cell--direct': canInlineEditTableCell(row, canonicalTitleToken, 'name'),
                    }"
                    @dblclick="beginInlineTableEdit(row, canonicalTitleToken, 'name')"
                  >
                    <template v-if="isInlineEditingCell(row, canonicalTitleToken, 'name')">
                      <div class="test-shell-table__inline-editor">
                        <q-input
                          :model-value="String(inlineTableEditState.value ?? '')"
                          dense
                          outlined
                          autofocus
                          class="test-shell-table__inline-input"
                          @update:model-value="inlineTableEditState.value = $event"
                          @keyup.enter.stop.prevent="commitInlineTableEdit(row, canonicalTitleToken)"
                          @keyup.esc.stop.prevent="cancelInlineTableEdit()"
                        />
                        <div class="test-shell-table__inline-actions">
                          <q-btn flat dense no-caps label="Save" @click.stop="commitInlineTableEdit(row, canonicalTitleToken)" />
                          <q-btn flat dense no-caps label="Cancel" @click.stop="cancelInlineTableEdit()" />
                        </div>
                      </div>
                    </template>
                    <div
                      v-else
                      class="test-shell-table__name"
                      :class="{ 'test-shell-card__value--placeholder': !row.titleValue }"
                    >
                      {{ row.titleValue || 'Name mapping undefined' }}
                    </div>
                  </div>
                </td>
                <td
                  v-for="tokenRow in row.sectionTokenRows"
                  :key="tokenRow.key"
                  class="test-shell-table__cell"
                  :style="getTableColumnStyle(tokenRow.columnKey, DEFAULT_COLUMN_MIN_WIDTH)"
                >
                  <template v-if="isInlineEditingCell(row, tokenRow.token, 'token')">
                    <div class="test-shell-table__inline-editor">
                      <q-select
                        v-if="String(tokenRow.token?.tokenType || '').trim() === 'select_single'"
                        :model-value="inlineTableEditState.value"
                        dense
                        outlined
                        emit-value
                        map-options
                        autofocus
                        class="test-shell-table__inline-input"
                        :options="tokenRow.token.inputOptions || []"
                        @update:model-value="commitInlineTableEdit(row, tokenRow.token, $event)"
                      />
                      <q-select
                        v-else-if="String(tokenRow.token?.tokenType || '').trim() === 'select_multi'"
                        :model-value="Array.isArray(inlineTableEditState.value) ? inlineTableEditState.value : []"
                        dense
                        outlined
                        multiple
                        use-chips
                        emit-value
                        map-options
                        autofocus
                        class="test-shell-table__inline-input"
                        :options="tokenRow.token.inputOptions || []"
                        @update:model-value="inlineTableEditState.value = $event"
                      />
                      <q-input
                        v-else
                        :model-value="String(inlineTableEditState.value ?? '')"
                        dense
                        outlined
                        autofocus
                        class="test-shell-table__inline-input"
                        @update:model-value="inlineTableEditState.value = $event"
                        @keyup.enter.stop.prevent="commitInlineTableEdit(row, tokenRow.token)"
                        @keyup.esc.stop.prevent="cancelInlineTableEdit()"
                      />
                      <div v-if="String(tokenRow.token?.tokenType || '').trim() === 'select_multi'" class="test-shell-table__inline-actions">
                        <q-btn flat dense no-caps label="Save" @click.stop="commitInlineTableEdit(row, tokenRow.token)" />
                        <q-btn flat dense no-caps label="Cancel" @click.stop="cancelInlineTableEdit()" />
                      </div>
                    </div>
                  </template>
                  <template v-if="isBbGraphLinkToken(tokenRow)">
                    <div v-if="tokenRow.links?.length" class="test-shell-table__bb-links">
                      <button
                        v-for="item in tokenRow.links"
                        :key="`${tokenRow.key}:${item.blockKey}`"
                        type="button"
                        class="test-shell-table__bb-link"
                        @click="openBbShellByBlockKey(item.blockKey)"
                      >
                        {{ item.title }}
                      </button>
                    </div>
                    <span v-else class="test-shell-card__value--placeholder">No explicit value</span>
                  </template>
                  <template v-else-if="isKdbSectionActive">
                    <div v-if="getKdbDisplayItems(tokenRow).length" class="test-shell-table__kdb-list">
                      <div
                        v-for="item in getKdbDisplayItems(tokenRow)"
                        :key="`${tokenRow.key}:${item.key}`"
                        class="test-shell-table__kdb-item"
                        :class="{ 'test-shell-table__kdb-item--linkable': item.canOpen }"
                        @dblclick="openKdbSourceCell(item)"
                      >
                        <span class="test-shell-table__kdb-icon">
                          <q-icon name="share" size="10px" />
                        </span>
                        <span class="test-shell-table__kdb-text">{{ item.label }}</span>
                      </div>
                    </div>
                    <span v-else class="test-shell-card__value--placeholder">No explicit value</span>
                  </template>
                  <span
                    v-else
                    :class="[
                      { 'test-shell-card__value--placeholder': !tokenRow.value },
                      { 'test-shell-table__cell--editable': canInlineEditTableCell(row, tokenRow.token, 'token') },
                      { 'test-shell-table__cell--direct': canInlineEditTableCell(row, tokenRow.token, 'token') },
                    ]"
                    @dblclick="beginInlineTableEdit(row, tokenRow.token, 'token')"
                  >
                    {{ tokenRow.value || 'No explicit value' }}
                  </span>
                </td>
                <td
                  v-if="isSystemSectionActive"
                  class="test-shell-table__cell test-shell-table__cell--history"
                  :style="getTableColumnStyle('history', 320)"
                >
                  <RecordHistoryBox
                    title="History"
                    :items="getRowHistoryItems(row)"
                    :loading="isRowHistoryLoading(row)"
                    empty-label="No history yet for this record."
                    @open-item="openRowHistoryItem(row, $event)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <template v-if="false">
          <div v-for="row in displayRows" :key="row.cardId" class="test-shell-table-row">
          <div class="test-shell-table-row__title">{{ row.titleValue || 'Title mapping undefined' }}</div>
          <div class="test-shell-table-row__meta">
            {{ row.recordId || 'Unavailable' }} · {{ row.matchedTokenCount }} explicit token values
          </div>
          </div>
        </template>
      </div>

      <SelectionActionBar
        :count="selectedRows.length"
        :loading="loading"
        :can-share="selectedRows.length > 0"
        :can-edit="false"
        :can-delete="canDeleteSelectedRows"
        @share="handleSelectedRowsShare"
        @edit="handleSelectedRowsEdit"
        @remove="handleSelectedRowsDelete"
      />
      </template>

      <AddEditRecordShellDialog
        :key="createDialogRenderKey"
        v-model="createDialogOpen"
        :mode="createDialogMode"
        :source-label="activeRegistryEntry?.label || 'Records'"
        :singular-label="activeRegistryEntry?.singularLabel || 'record'"
        :primary-tokens="createPrimaryTokens"
        :left-sections="createDialogLeftSections"
        :right-sections="createDialogRightSections"
        :branch-selector-token-key="createDialogBranchSelectorTokenKey"
        :loading="createDialogLoading"
        :submit-disabled="createDialogSubmitDisabled"
        :initial-values="createDialogInitialValues"
        :initial-field-meta="createDialogInitialFieldMeta"
        :initial-section-key="createDialogInitialSectionKey"
        :initial-artifacts="createDialogInitialArtifacts"
        :artifact-context="createDialogArtifactContext"
        :prefer-add-layout="createDialogPreferAddLayout"
        :initial-resources-collapsed="createDialogMode === 'edit'"
        :initial-record-data-collapsed="false"
        @change="handleCreateDialogChange"
        @request-close="handleCreateDialogClose"
        @submit="submitCreateRecordShell"
      />

      <q-dialog v-model="heroDocumentDialogOpen" maximized>
        <q-card class="hero-document-dialog">
          <q-card-section class="hero-document-dialog__header">
            <div class="hero-document-dialog__title">{{ heroDocumentDialogTitle || 'Document' }}</div>
            <q-btn flat round dense icon="close" aria-label="Close document" @click="heroDocumentDialogOpen = false" />
          </q-card-section>
          <q-separator />
          <q-card-section class="hero-document-dialog__body">
            <div v-if="heroDocumentDialogLoading" class="hero-document-dialog__status">Loading document...</div>
            <div v-else-if="heroDocumentDialogError" class="hero-document-dialog__status hero-document-dialog__status--error">
              {{ heroDocumentDialogError }}
            </div>
            <pre v-else class="hero-document-dialog__content">{{ heroDocumentDialogContent }}</pre>
          </q-card-section>
        </q-card>
      </q-dialog>
    </div>
  </q-page>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import AddEditRecordShellDialog from 'components/AddEditRecordShellDialog.vue'
import FileFilterMenu from 'components/FileFilterMenu.vue'
import FileHero from 'components/FileHero.vue'
import L2SettingsMenu from 'components/L2SettingsMenu.vue'
import FilePageToolbar from 'components/FilePageToolbar.vue'
import RecordHistoryBox from 'components/RecordHistoryBox.vue'
import ShellSectionToolbar from 'components/ShellSectionToolbar.vue'
import BuildingBlockPreviewTile from 'components/BuildingBlockPreviewTile.vue'
import EyeIconButton from 'components/buttons/EyeIconButton.vue'
import SelectionActionBar from 'components/SelectionActionBar.vue'
import {
  buildCardRelationshipItems,
  buildCardRelationshipOptions,
  getCardRelationshipLabel,
  resolveCardRelationshipPanel,
} from 'src/utils/card-kdb-relationships'
import {
  CANONICAL_OPTION_LISTS,
  getCreateBranchEntry,
  getCreateBranches,
  getCreateBranchTokenName,
  getFilePageBirthDefaults,
  getFilePageCreateSurface,
  getFilePageEditSurface,
  getFilePageRegistryEntry,
  getFilePageRegistryEntryByEntityReference,
  getFilePageRegistryEntryByRouteName,
  getFilePageReferenceDocs,
  getRuntimeTableNameForEntityName,
  getCanonicalTokenFieldNames,
  getCanonicalTokenWriteFieldName,
  getCanonicalTokenWriteTarget,
  getCanonicalTokenValue,
  LEVEL_2_FILE_REGISTRY_BY_KEY,
  LEVEL_3_FILE_REGISTRY_BY_KEY,
  TEST_SHELL_SECTION_OPTIONS,
} from 'src/utils/structureRegistry'
import { getLdbRelationshipContractForToken } from 'src/shared/ldbRelationshipContracts'
import { buildDialogSectionGroups, groupDialogLevel2Sections, splitDialogSections } from 'src/utils/dialogShellPayload'
import { buildRecordViewLocation } from 'src/utils/recordViewNavigation'
import { shareRecordSelection } from 'src/utils/recordListSelectionActions'
import { loadShellFieldSelectionMap, persistShellFieldSelectionMap } from 'src/utils/shellFieldSelection'
import { getBuildingBlockGraphCounts, getBuildingBlockGraphLinks } from 'src/utils/buildingBlocks'
import { setPendingAddEditShellRequest } from 'src/utils/addEditShellState'
import { setPendingIntakeShellRequest } from 'src/utils/intakeShellState'

const props = defineProps({
  shellMode: {
    type: String,
    default: 'file',
  },
  sourceKey: {
    type: String,
    default: '',
  },
})

const route = useRoute()
const router = useRouter()
const $q = useQuasar()

const bridge = computed(() => (typeof window !== 'undefined' ? window.ecvc : null))
const isElectronRuntime = computed(() => typeof window !== 'undefined')
const loading = ref(false)
const error = ref('')
const searchQuery = ref('')
const rawRows = ref([])
const rowHistoryByRecordId = ref({})
const rowHistoryLoadingByRecordId = ref({})
const loaderDiagnostics = ref({})
const viewMode = ref('page')
const createDialogOpen = ref(false)
const createDialogRenderKey = ref(0)
const createDialogLoading = ref(false)
const createDialogMode = ref('create')
const createDialogPreferAddLayout = ref(false)
const editDialogRow = ref(null)
const editDialogRecordPayload = ref(null)
const createDialogDraftRecordId = ref('')
const createDialogDraftEntityName = ref('')
const createDialogDraftSourceKey = ref('')
const createDialogInitialSectionKey = ref('general')
const createDialogPrefillValues = ref({})
const createDialogFieldMeta = ref({})
const createDialogInitialArtifacts = ref([])
const createDialogLastChangeSnapshot = ref(null)
const createDialogLastSavedSignature = ref('')
const createDialogAutosavePending = ref(false)
const heroDocumentDialogOpen = ref(false)
const heroDocumentDialogTitle = ref('')
const heroDocumentDialogContent = ref('')
const heroDocumentDialogLoading = ref(false)
const heroDocumentDialogError = ref('')
const inlineTableEditState = ref({
  rowId: '',
  tokenKey: '',
  value: '',
  kind: '',
})
let createDialogAutosaveTimer = null
let createDialogAutosaveInFlight = false
let queuedCreateDialogSnapshot = null
const cardRelationshipPanelById = ref({})
const selectedRowIds = ref([])
const tableColumnWidths = ref({})
const tableScrollRef = ref(null)
const bbTileCollapseVersion = ref(0)
const bbTileCollapseState = ref('')
const bbTileGroupOpenState = ref({})
const cardItemKeysBySource = ref(loadShellFieldSelectionMap())
const liveOptionRowsBySource = ref({})
const localDraftRowsBySource = ref({})

const DEFAULT_COLUMN_MIN_WIDTH = 120
const NAME_COLUMN_DEFAULT_WIDTH = 84
const TABLE_CONTROL_COLUMN_WIDTH = 22

const SECTION_LOADERS = {
  'file-system': {
    listFn: (bridgeValue) => bridgeValue?.['file-system']?.list?.(),
    resultKey: 'files',
    recordIdField: 'id',
  },
  events: {
    listFn: (bridgeValue) => bridgeValue?.events?.list?.(),
    resultKey: 'events',
    recordIdField: 'id',
  },
  users: {
    listFn: (bridgeValue) => bridgeValue?.users?.list?.(),
    resultKey: 'users',
    recordIdField: 'id',
  },
  markets: {
    listFn: (bridgeValue) => bridgeValue?.markets?.list?.(),
    resultKey: 'markets',
    recordIdField: 'id',
  },
  securities: {
    listFn: (bridgeValue) => bridgeValue?.securities?.list?.(),
    resultKey: 'securities',
    recordIdField: 'id',
  },
  artifacts: {
    listFn: (bridgeValue) => bridgeValue?.artifacts?.list?.(),
    resultKey: 'artifacts',
    recordIdField: 'artifact_id',
  },
  contacts: {
    listFn: (bridgeValue) => bridgeValue?.contacts?.list?.(),
    resultKey: 'contacts',
    recordIdField: 'id',
  },
  companies: {
    listFn: (bridgeValue) => bridgeValue?.companies?.list?.(),
    resultKey: 'companies',
    recordIdField: 'id',
  },
  opportunities: {
    listFn: (bridgeValue) => bridgeValue?.opportunities?.list?.(),
    resultKey: 'opportunities',
    recordIdField: 'id',
  },
  funds: {
    listFn: (bridgeValue) => bridgeValue?.funds?.list?.(),
    resultKey: 'funds',
    recordIdField: 'id',
  },
  rounds: {
    listFn: (bridgeValue) => bridgeValue?.rounds?.list?.(),
    resultKey: 'rounds',
    recordIdField: 'id',
  },
  projects: {
    listFn: (bridgeValue) => bridgeValue?.projects?.list?.(),
    resultKey: 'projects',
    recordIdField: 'id',
  },
  notes: {
    listFn: (bridgeValue) => bridgeValue?.notes?.list?.(),
    resultKey: 'notes',
    recordIdField: 'id',
  },
  tasks: {
    listFn: (bridgeValue) => bridgeValue?.tasks?.list?.(),
    resultKey: 'tasks',
    recordIdField: 'id',
  },
  'bb-file': {
    listFn: (bridgeValue) => bridgeValue?.['bb-file']?.list?.(),
    resultKey: 'buildingBlocks',
    recordIdField: 'id',
  },
  'user-roles': {
    listFn: (bridgeValue) => bridgeValue?.['user-roles']?.list?.(),
    resultKey: 'roles',
    recordIdField: 'id',
  },
  'companion-roles': {
    listFn: (bridgeValue) => bridgeValue?.['companion-roles']?.list?.() ?? { companionRoles: [] },
    resultKey: 'companionRoles',
    recordIdField: 'id',
  },
  intake: {
    listFn: (bridgeValue) => bridgeValue?.intake?.list?.(),
    resultKey: 'intake',
    recordIdField: 'id',
  },
}

const fallbackSectionKey =
  TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === 'tasks')?.value ||
  TEST_SHELL_SECTION_OPTIONS[0]?.value ||
  'tasks'

const isRecordShellMode = computed(
  () => String(props.shellMode || '').trim().toLowerCase() === 'record' || String(route.name || '').trim().toLowerCase() === 'record-shell',
)
const isFileShellLabMode = computed(() => String(props.shellMode || '').trim().toLowerCase() === 'file-lab')

const routeDrivenSourceKey = computed(() => {
  const routeName = String(route.name || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.find((option) => option.value === routeName)?.value || ''
})
const propDrivenSourceKey = computed(() => {
  const normalized = String(props.sourceKey || '').trim().toLowerCase()
  return TEST_SHELL_SECTION_OPTIONS.some((option) => option.value === normalized) ? normalized : ''
})
const activeCreateBranchEntries = computed(() => getCreateBranches(activeSourceKey.value))
const activeForkValue = computed(() => {
  const normalized = String(route.query.kind || '').trim().toLowerCase()
  if (activeCreateBranchEntries.value.length) {
    return getCreateBranchEntry(activeSourceKey.value, normalized) ? normalized : ''
  }
  return ''
})
const activeCreateBranchEntry = computed(() => getCreateBranchEntry(activeSourceKey.value, activeForkValue.value))
const activeContentSourceKey = computed(() => String(activeCreateBranchEntry.value?.targetSourceKey || activeSourceKey.value || '').trim().toLowerCase())

const activeSourceKey = computed(() => {
  if (propDrivenSourceKey.value) return propDrivenSourceKey.value
  if (routeDrivenSourceKey.value) return routeDrivenSourceKey.value
  return isFileShellLabMode.value ? fallbackSectionKey : ''
})

const hasResolvedSourceKey = computed(() => Boolean(activeSourceKey.value))

const activeRegistryEntry = computed(
  () => getFilePageRegistryEntry(activeContentSourceKey.value) || null,
)
const routeRegistryEntry = computed(() => getFilePageRegistryEntryByRouteName(route.name))
const pageShellLabel = computed(() => {
  if (isRecordShellMode.value) return 'Record Shell'
  if (isFileShellLabMode.value) return 'File Shell'
  return routeRegistryEntry.value?.label || activeRegistryEntry.value?.label || 'Records'
})

const activeLoader = computed(() => SECTION_LOADERS[activeContentSourceKey.value] || null)
const hasSupportedBridge = computed(() => {
  if (!activeLoader.value) return false
  return typeof activeLoader.value.listFn(bridge.value) !== 'undefined'
})
const supportsActiveSourceEditing = computed(() => activeContentSourceKey.value !== 'events')
function isRelationshipSectionLabel(value = '') {
  const normalized = String(value || '').trim().toLowerCase()
  return normalized === 'kdb' || normalized === 'ldb'
}
const hasActiveSourceKdb = computed(() =>
  level2Sections.value.some((section) => isRelationshipSectionLabel(section?.rawLabel || section?.label)),
)

const sourceLevel2Sections = computed(() => LEVEL_2_FILE_REGISTRY_BY_KEY[activeContentSourceKey.value] || [])
const level2Sections = computed(() => sourceLevel2Sections.value)
const level3Tokens = computed(() => {
  const allowedSectionKeys = new Set(level2Sections.value.map((section) => section.key))
  return (LEVEL_3_FILE_REGISTRY_BY_KEY[activeContentSourceKey.value] || []).filter((token) => allowedSectionKeys.has(token.parentKey))
})
const activeSectionKeyForCards = ref('')
const activeFilterSectionKey = ref('')
const activeFilterTokenKey = ref('')
const expandedFilterSectionKey = ref('')
const activeBbCategoryKey = ref('')
const activeBbBlockKey = ref('')
const expandedBbFilterCategoryKey = ref('')
const expandedCardSettingsGroupsBySource = ref({})
const toolbarForkOptions = computed(() => {
  if (!activeCreateBranchEntries.value.length) return []
  return [
    { value: '', label: 'All' },
    ...activeCreateBranchEntries.value.map((branch) => ({
      value: String(branch?.value || '').trim().toLowerCase(),
      label: String(branch?.label || '').trim(),
    })),
  ].filter((option) => option.label)
})

const activeSection = computed(() => {
  return level2Sections.value.find((section) => section.key === activeSectionKeyForCards.value) || level2Sections.value[0] || null
})
const isKdbSectionActive = computed(() => isRelationshipSectionLabel(activeSection.value?.rawLabel || activeSection.value?.label))
const isSystemSectionActive = computed(() => String(activeSection.value?.label || '').trim().toLowerCase() === 'system')

const activeSectionTokens = computed(() => {
  if (!activeSection.value) return []
  return level3Tokens.value.filter((token) => token.parentKey === activeSection.value.key)
})

const canonicalTitleToken = computed(
  () => {
    if (isBbFileSource.value) {
      return level3Tokens.value.find((token) => String(token?.tokenName || '').trim() === 'BB_Name') || null
    }
    return (
      level3Tokens.value.find(
        (token) => String(token.parentLevel_2) === '3' && String(token.level_3) === '1',
      ) || null
    )
  },
)
const canonicalSummaryToken = computed(
  () => {
    if (isBbFileSource.value) {
      return level3Tokens.value.find((token) => String(token?.tokenName || '').trim() === 'BB_Summary') || null
    }
    return (
      level3Tokens.value.find(
        (token) => String(token.parentLevel_2) === '3' && String(token.level_3) === '2',
      ) || null
    )
  },
)
const selectedRecordShellLevel3Keys = computed(() => {
  if (!isRecordShellMode.value) return []
  const rawValue = route.query.l3
  const rawItems = Array.isArray(rawValue) ? rawValue : String(rawValue || '').split(',')
  const allowedKeys = new Set(level3Tokens.value.map((token) => token.key))
  return rawItems
    .map((value) => String(value || '').trim())
    .filter((value) => value && allowedKeys.has(value))
})
const selectedRecordShellLevel3KeySet = computed(() => new Set(selectedRecordShellLevel3Keys.value))
const activeCardSettingsSectionKey = computed(() => String(activeSection.value?.key || '').trim())
function isCoreCardSection(section) {
  const normalized = String(section?.rawLabel || section?.label || '').trim().toLowerCase()
  return normalized === 'general' || normalized === 'system' || isRelationshipSectionLabel(normalized)
}

const cardSettingsSourceSections = computed(() => {
  const active = activeSection.value
  const activeLabel = String(active?.label || '').trim().toLowerCase()
  if (activeLabel !== 'general') return active && !isCoreCardSection(active) ? [active] : []

  const fileSpecificSections = level2Sections.value.filter((section) => !isCoreCardSection(section))
  return fileSpecificSections
})

const availableCardItemTokens = computed(() => {
  const sourceSectionKeys = new Set(cardSettingsSourceSections.value.map((section) => section.key))
  return level3Tokens.value.filter(
    (token) => sourceSectionKeys.has(token.parentKey) && token.key !== canonicalTitleToken.value?.key,
  )
})
const enabledCardItemKeys = computed(() => {
  const scopeKey = `${activeContentSourceKey.value}:${activeCardSettingsSectionKey.value}`
  const configured = Array.isArray(cardItemKeysBySource.value[scopeKey]) ? cardItemKeysBySource.value[scopeKey] : []
  const allowedKeys = new Set(availableCardItemTokens.value.map((token) => token.key))
  return configured.filter((key) => allowedKeys.has(key))
})
const selectedCardItemTokens = computed(() =>
  enabledCardItemKeys.value
    .map((tokenKey) => availableCardItemTokens.value.find((token) => token.key === tokenKey))
    .filter(Boolean),
)
function getRequiredCreateTokenNamesForSource() {
  const normalizedSourceKey = String(activeSourceKey.value || '').trim().toLowerCase()
  if (normalizedSourceKey === 'users') return ['User_Email']
  return []
}

const requiredCreateTokens = computed(() => {
  const requiredTokenNames = new Set(getRequiredCreateTokenNamesForSource(activeSourceKey.value))
  if (!requiredTokenNames.size) return []
  return level3Tokens.value
    .filter((token) => requiredTokenNames.has(String(token?.tokenName || '').trim()))
    .map((token) => normalizeCreateDialogToken(token))
})

const createPrimaryTokens = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchToken = branchTokenName
    ? level3Tokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName) || null
    : null
  const tokens = [canonicalTitleToken.value, canonicalSummaryToken.value, branchToken, ...requiredCreateTokens.value].filter(Boolean)
  const seen = new Set()
  return tokens
    .filter((token) => {
      if (createDialogMode.value === 'create' && isAutomaticCreatorToken(token)) return false
      if (seen.has(token.key)) return false
      seen.add(token.key)
      return true
    })
    .map((token) => normalizeCreateDialogToken(token))
})
const createDialogSubmitDisabled = computed(() => {
  if (createDialogMode.value === 'edit') return false
  return !canCreateWithShell.value
})
const cardItemTokenGroups = computed(() =>
  cardSettingsSourceSections.value
    .map((section) => ({
      key: section.key,
      label: section.label,
      tokens: availableCardItemTokens.value.filter((token) => token.parentKey === section.key),
    }))
    .filter((group) => group.tokens.length),
)
const groupedLevel2Sections = computed(() => groupDialogLevel2Sections(level2Sections.value))
const createSectionGroups = computed(() => {
  const primaryTokenKeys = new Set(createPrimaryTokens.value.map((token) => token.key))
  return buildDialogSectionGroups({
    groupedSections: groupedLevel2Sections.value,
    tokenFilter: (section) => level3Tokens.value.filter(
      (token) =>
        token.parentKey === section.key &&
        !primaryTokenKeys.has(token.key) &&
        !(createDialogMode.value === 'create' && isAutomaticCreatorToken(token)) &&
        (!isRecordShellMode.value || selectedRecordShellLevel3KeySet.value.has(token.key)),
    ),
    mapToken: normalizeCreateDialogToken,
  })
})
const createDialogSectionSplit = computed(() => splitDialogSections(createSectionGroups.value))
const createDialogLeftSections = computed(() => createDialogSectionSplit.value.leftSections)
const createDialogRightSections = computed(() => createDialogSectionSplit.value.rightSections)
const createDialogBranchSelectorTokenKey = computed(() => {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  if (!branchTokenName) return ''
  return createPrimaryTokens.value.find((token) => String(token?.tokenName || '').trim() === branchTokenName)?.key || ''
})
const createDialogKdbSectionKey = computed(
  () => createSectionGroups.value.find((section) => isRelationshipSectionLabel(section?.rawLabel || section?.label))?.key || '',
)
const isTableInlineEditingAvailable = computed(() => viewMode.value !== 'card')
const activeCardSettingsScopeKey = computed(() => `${activeContentSourceKey.value}:${activeCardSettingsSectionKey.value}`)
const expandedCardSettingsGroups = computed(() => {
  const scopeKey = activeCardSettingsScopeKey.value
  const existing = expandedCardSettingsGroupsBySource.value[scopeKey]
  return Array.isArray(existing) ? existing : cardItemTokenGroups.value.map((group) => group.key)
})
const cardSettingsMenuGroups = computed(() => {
  const selectedGroup = selectedCardItemTokens.value.length
    ? [{
        key: 'selected',
        label: 'Selected',
        expanded: true,
        items: selectedCardItemTokens.value.map((token) => ({
          key: token.key,
          label: token.label,
          checked: true,
        })),
      }]
    : []

  const sourceGroups = cardItemTokenGroups.value.length
    ? cardItemTokenGroups.value.map((group) => ({
        key: group.key,
        label: group.label,
        expanded: expandedCardSettingsGroups.value.includes(group.key),
        items: group.tokens.map((token) => ({
          key: token.key,
          label: token.label,
          checked: isCardItemEnabled(token.key),
        })),
      }))
    : []

  return [
    ...selectedGroup,
    ...sourceGroups,
  ]
})
const canCreateWithShell = computed(() => {
  if (typeof bridge.value?.[activeSourceKey.value]?.create === 'function') return true
  const branchEntries = getCreateBranches(activeSourceKey.value)
  if (branchEntries.length) {
    return branchEntries.some((branch) => Boolean(bridge.value?.[String(branch?.targetSourceKey || '').trim()]?.create))
  }
  return Boolean(bridge.value?.[activeContentSourceKey.value]?.create)
})

function getEditDialogTokenValueFromPayload(payload, token) {
  if (!payload) return ''

  const fieldNames = getCanonicalTokenFieldNames(token)
  const payloadFields = Array.isArray(payload.fields) ? payload.fields : []

  for (const fieldName of fieldNames) {
    const matchingField = payloadFields.find((field) => String(field?.field_name || '').trim() === fieldName)
    if (!matchingField) continue
    const relationshipIds = Array.isArray(matchingField?.relationship_ids)
      ? matchingField.relationship_ids.map((value) => String(value || '').trim()).filter(Boolean)
      : []
    if (relationshipIds.length) return relationshipIds

    const fieldValue = matchingField?.value
    if (fieldValue != null && !(typeof fieldValue === 'string' && !fieldValue.trim())) {
      return fieldValue
    }
  }

  for (const fieldName of fieldNames) {
    const recordValue = payload.record?.[fieldName]
    if (recordValue != null && !(typeof recordValue === 'string' && !recordValue.trim())) {
      return recordValue
    }
  }

  const optionEntity = String(token?.optionEntity || '').trim()
  if (optionEntity === 'Artifacts') {
    return createDialogInitialArtifacts.value.map((artifact) => String(artifact?.name || '').trim()).filter(Boolean)
  }

  return ''
}

function getEditDialogTokenMetaFromPayload(payload, token, entityName, recordId) {
  if (!payload) return null
  const normalizedEntityName = String(entityName || '').trim()
  const normalizedRecordId = String(recordId || '').trim()
  const fieldNames = getCanonicalTokenFieldNames(token)
  const matchingField = (Array.isArray(payload.fields) ? payload.fields : []).find((field) =>
    fieldNames.includes(String(field?.field_name || '').trim()),
  )
  if (!matchingField) return null

  const fieldTableName = String(matchingField?.table_name || '').trim()
  const fieldRecordId = String(matchingField?.record_id || '').trim()
  const verificationFields = Array.isArray(payload?.verificationFields) ? payload.verificationFields : []
  const verificationMatch = verificationFields.find(
    (field) =>
      String(field?.field_name || '').trim() === String(matchingField?.field_name || '').trim() &&
      String(field?.table_name || '').trim() === normalizedEntityName &&
      String(field?.record_id || '').trim() === normalizedRecordId,
  )

  return {
    tableName: fieldTableName,
    recordId: fieldRecordId,
    fieldName: String(matchingField?.field_name || '').trim(),
    idColumn: String(matchingField?.id_column || '').trim(),
    verificationState: String(verificationMatch?.state || '').trim(),
    verificationSource: String(verificationMatch?.source || '').trim(),
    locked:
      matchingField?.editable === false ||
      (Boolean(fieldTableName && fieldRecordId) &&
        (fieldTableName !== normalizedEntityName || fieldRecordId !== normalizedRecordId)),
  }
}

const createDialogInitialValues = computed(() => {
  return createDialogPrefillValues.value
})

const createDialogInitialFieldMeta = computed(() => {
  return createDialogFieldMeta.value
})

const createDialogArtifactContext = computed(() => {
  if (activeSourceKey.value === 'artifacts') return null
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const entityLabel = String(activeRegistryEntry.value?.singularLabel || activeRegistryEntry.value?.label || '').trim()
  if (!entityName || !entityLabel) return null

  const recordId = String(editDialogRow.value?.recordId || createDialogDraftRecordId.value || '').trim()
  const recordLabel = String(editDialogRow.value?.titleValue || '').trim()

  return {
    entityName,
    entityLabel,
    recordId,
    recordLabel,
    state: 'default_preselected_unverified',
  }
})

async function loadEditDialogRecordPayload(entityName, recordId) {
  const normalizedEntityName = String(entityName || '').trim()
  const normalizedRecordId = String(recordId || '').trim()
  if (!bridge.value?.records?.view || !normalizedEntityName || !normalizedRecordId) return null

  const result = await bridge.value.records.view(normalizedEntityName, normalizedRecordId)
  if (!result?.record) return null

  let verificationFields = []
  try {
    const verificationResult = await bridge.value?.verification?.list?.({
      tableName: normalizedEntityName,
      recordId: normalizedRecordId,
    })
    verificationFields = Array.isArray(verificationResult?.fields) ? verificationResult.fields : []
  } catch {
    verificationFields = []
  }

  return {
    ...result,
    verificationFields,
  }
}

function buildEditDialogInitialValuesFromPayload(payload) {
  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens.map((token) => {
      const value = getEditDialogTokenValueFromPayload(payload, token)
      return [token.key, normalizeCreateDialogInitialValue(token, value)]
    }),
  )
}

function buildEditDialogFieldMetaFromPayload(payload, entityName, recordId) {
  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens.map((token) => [
      token.key,
      getEditDialogTokenMetaFromPayload(payload, token, entityName, recordId),
    ]),
  )
}
const canDeleteSelectedRows = computed(() => {
  if (selectedRows.value.length === 0) return false
  if (activeSourceKey.value === 'events') return false
  return typeof bridge.value?.[activeSourceKey.value]?.delete === 'function'
})
const bbGraphRowColumns = computed(() => {
  if (!isBbFileSource.value) return []
  return [
    { key: '__bb_used_in_shells__', tokenName: '__bb_used_in_shells__', label: 'Used In Shells' },
    { key: '__bb_built_from__', tokenName: '__bb_built_from__', label: 'Built From BBs' },
    { key: '__bb_convergence_rule__', tokenName: '__bb_convergence_rule__', label: 'Convergence Rule (Temp)' },
    { key: '__bb_parents__', tokenName: '__bb_parents__', label: 'Parents' },
    { key: '__bb_children__', tokenName: '__bb_children__', label: 'Children' },
  ]
})
const tableSectionTokens = computed(() => {
  const baseTokens = activeSectionTokens.value.filter((token) => token.key !== canonicalTitleToken.value?.key)
  if (!isBbFileSource.value) return baseTokens
  return [...bbGraphRowColumns.value, ...baseTokens]
})

const displayRows = computed(() => {
  const query = String(searchQuery.value || '').trim().toLowerCase()
  const localDraftRows =
    createDialogOpen.value &&
    createDialogMode.value === 'create' &&
    String(createDialogDraftSourceKey.value || '').trim().toLowerCase() === activeContentSourceKey.value
      ? (Array.isArray(localDraftRowsBySource.value[activeContentSourceKey.value])
          ? localDraftRowsBySource.value[activeContentSourceKey.value].filter(
              (row) => String(row?.id || '').trim() === String(createDialogDraftRecordId.value || '').trim(),
            )
          : [])
      : []

  return [...localDraftRows, ...rawRows.value]
    .map((row, index) => buildShellRow(row, index))
    .filter((row) => {
      if (isBbFileSource.value) {
        const blockKey = getBbTileBlockKey(row)
        const categoryKey = String(row?.raw?.Category || '').trim().toLowerCase()

        if (activeBbCategoryKey.value && categoryKey !== activeBbCategoryKey.value) return false
        if (activeBbBlockKey.value && blockKey !== activeBbBlockKey.value) return false
      }
      if (activeFilterSectionKey.value && !row.sectionPresence[activeFilterSectionKey.value]) return false
      if (activeFilterTokenKey.value && !row.tokenPresence[activeFilterTokenKey.value]) return false
      if (!query) return true
      const haystack = [
        row.recordId,
        ...row.sectionTokenRows.map((tokenRow) => tokenRow.tokenName),
        ...row.sectionTokenRows.map((tokenRow) => tokenRow.value),
      ]
      return haystack.some((value) => String(value || '').toLowerCase().includes(query))
    })
})

function normalizeCreateDialogToken(token) {
  const tokenType = String(token?.tokenType || '').trim()
  if (!tokenType.startsWith('select_')) return token

  return {
    ...token,
    inputOptions: getInputOptionsForToken(token),
  }
}

function isAutomaticCreatorToken(token) {
  const tokenName = String(token?.tokenName || '').trim()
  const fieldNames = getCanonicalTokenFieldNames(token).map((name) => String(name || '').trim())
  if (fieldNames.includes('created_by') || fieldNames.includes('created_by_label')) return true
  return tokenName.endsWith('_Creator')
}

function isBranchSelectorToken(token, sourceKey = activeSourceKey.value) {
  const branchTokenName = getCreateBranchTokenName(sourceKey)
  if (!branchTokenName) return false
  return String(token?.tokenName || '').trim() === branchTokenName
}

function getInputOptionsForToken(token) {
  const optionSource = String(token?.optionSource || '').trim()
  const optionList = String(token?.optionList || '').trim()

  if (optionSource === 'canonical_list' && optionList) {
    return CANONICAL_OPTION_LISTS[optionList] || []
  }

  if (optionSource === 'live_entity') {
    return getLiveEntityOptionsForToken(token)
  }

  if (optionSource === 'live_entity_set') {
    return getLiveEntitySetOptionsForToken(token)
  }

  if (optionSource === 'record_subset') return []

  const values = Array.from(
    new Set(
      rawRows.value
        .map((row) => getCanonicalTokenValue(row, token))
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => String(value || '').trim())
        .filter(Boolean),
    ),
  )

  return values.map((value) => ({
    label: value,
    value,
  }))
}

function resolveCreateDialogOptionValue(token, rawValue) {
  if (rawValue == null) return ''
  const normalized = String(rawValue || '').trim()
  if (!normalized) return ''
  const options = Array.isArray(token?.inputOptions) ? token.inputOptions : getInputOptionsForToken(token)
  const matchedOption = options.find((option) => {
    const optionValue = String(option?.value ?? '').trim()
    const optionLabel = String(option?.label ?? '').trim()
    return normalized === optionValue || normalized === optionLabel
  })
  return matchedOption ? matchedOption.value : normalized
}

function normalizeCreateDialogInitialValue(token, value) {
  const tokenType = String(token?.tokenType || '').trim()

  if (tokenType === 'select_multi') {
    const values = Array.isArray(value)
      ? value
      : String(value || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)

    return values.map((item) => resolveCreateDialogOptionValue(token, item)).filter(Boolean)
  }

  if (tokenType === 'select_single') {
    return resolveCreateDialogOptionValue(token, value)
  }

  return value == null ? '' : String(value)
}

function normalizeEntitySourceKey(entityName) {
  return String(entityName || '').trim().toLowerCase()
}

function setActiveForkValue(nextValue) {
  if (!activeCreateBranchEntries.value.length) return
  const normalized = String(nextValue || '').trim().toLowerCase()
  const nextQuery = { ...route.query }
  if (normalized && getCreateBranchEntry(activeSourceKey.value, normalized)) {
    nextQuery.kind = normalized
  } else {
    delete nextQuery.kind
  }
  router.push({ name: route.name, params: route.params, query: nextQuery })
}

function getRegistryTitleTokenForSource(sourceKey) {
  const entry = getFilePageRegistryEntry(sourceKey)
  if (!entry) return null
  const generalSection = entry.subsections.find((section) => String(section.rawLabel || '').trim().toLowerCase() === 'general')
  return generalSection?.tokens?.find((token) => String(token.level_3 || '').trim() === '1') || null
}

function getOptionRowsForSource(sourceKey) {
  const normalized = normalizeEntitySourceKey(sourceKey)
  if (!normalized) return []
  if (normalized === activeContentSourceKey.value) return rawRows.value
  return Array.isArray(liveOptionRowsBySource.value[normalized]) ? liveOptionRowsBySource.value[normalized] : []
}

function getOptionSubsetToken(sourceKey, fieldName) {
  const entry = getFilePageRegistryEntry(sourceKey)
  if (!entry) return null
  return entry.subsections.flatMap((section) => section.tokens || []).find((token) => token.tokenName === fieldName) || null
}

function matchesOptionSubset(row, sourceKey, optionSubset) {
  if (!optionSubset || typeof optionSubset !== 'object') return true
  if (optionSubset.field && Array.isArray(optionSubset.includes) && optionSubset.includes.length) {
    const subsetToken = getOptionSubsetToken(sourceKey, optionSubset.field)
    const rawValue = subsetToken ? getCanonicalTokenValue(row, subsetToken) : row?.[optionSubset.field]
    const normalizedValues = Array.isArray(rawValue)
      ? rawValue.map((value) => String(value || '').trim()).filter(Boolean)
      : [String(rawValue || '').trim()].filter(Boolean)
    return normalizedValues.some((value) => optionSubset.includes.includes(value))
  }
  return true
}

function buildOptionsFromSourceRows(sourceKey, token) {
  const rows = getOptionRowsForSource(sourceKey)
  const titleToken = getRegistryTitleTokenForSource(sourceKey)
  const recordIdField = SECTION_LOADERS[sourceKey]?.recordIdField || 'id'
  const useRecordIdValue =
    tokenHasRelationshipWriteContract(token, activeRegistryEntry.value?.entityName || '') ||
    String(token?.optionValueMode || '').trim() === 'record_id'

  const options = rows
    .filter((row) => matchesOptionSubset(row, sourceKey, token?.optionSubset))
    .map((row) => {
      const recordId = stringifyValue(row?.[recordIdField])
      const label = stringifyValue(titleToken ? getCanonicalTokenValue(row, titleToken) : null)
      if (!label || !recordId) return null
      return {
        label,
        value: useRecordIdValue ? recordId : label,
      }
    })
    .filter(Boolean)

  return Array.from(new Map(options.map((option) => [option.value, option])).values())
}

function getLiveEntityOptionsForToken(token) {
  const sourceKey = normalizeEntitySourceKey(token?.optionEntity)
  if (!sourceKey) return []
  return buildOptionsFromSourceRows(sourceKey, token)
}

function getLiveEntitySetOptionsForToken(token) {
  const sourceKeys = Array.isArray(token?.optionEntities) ? token.optionEntities.map(normalizeEntitySourceKey).filter(Boolean) : []
  const options = sourceKeys.flatMap((sourceKey) => buildOptionsFromSourceRows(sourceKey, token))
  return Array.from(new Map(options.map((option) => [option.value, option])).values())
}

async function ensureLiveOptionRowsLoaded(sourceKey) {
  const normalized = normalizeEntitySourceKey(sourceKey)
  if (!normalized || normalized === activeContentSourceKey.value) return
  if (Array.isArray(liveOptionRowsBySource.value[normalized])) return

  const loader = SECTION_LOADERS[normalized]
  const bridgeValue = bridge.value
  if (!loader || !bridgeValue) return

  try {
    const result = await loader.listFn(bridgeValue)
    const rows = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : []
    liveOptionRowsBySource.value = {
      ...liveOptionRowsBySource.value,
      [normalized]: rows,
    }
  } catch {
    liveOptionRowsBySource.value = {
      ...liveOptionRowsBySource.value,
      [normalized]: [],
    }
  }
}

async function preloadCreateDialogOptionSources() {
  const tokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  const sourceKeys = new Set()

  tokens.forEach((token) => {
    const optionSource = String(token?.optionSource || '').trim()
    if (optionSource === 'live_entity') {
      const sourceKey = normalizeEntitySourceKey(token?.optionEntity)
      if (sourceKey) sourceKeys.add(sourceKey)
    }

    if (optionSource === 'live_entity_set') {
      ;(Array.isArray(token?.optionEntities) ? token.optionEntities : [])
        .map(normalizeEntitySourceKey)
        .filter(Boolean)
        .forEach((sourceKey) => sourceKeys.add(sourceKey))
    }
  })

  await Promise.all(Array.from(sourceKeys).map((sourceKey) => ensureLiveOptionRowsLoaded(sourceKey)))
}

const visibleSelectableRowIds = computed(() =>
  displayRows.value.map((row) => String(row.recordId || row.cardId || '').trim()).filter(Boolean),
)
const selectedRows = computed(() => displayRows.value.filter((row) => isRowSelected(row)))

const allVisibleSelected = computed(() => {
  if (!visibleSelectableRowIds.value.length) return false
  return visibleSelectableRowIds.value.every((id) => selectedRowIds.value.includes(id))
})

const someVisibleSelected = computed(() => {
  if (!visibleSelectableRowIds.value.length) return false
  return visibleSelectableRowIds.value.some((id) => selectedRowIds.value.includes(id))
})

function getHeroContractSourceKey(sourceKey = '') {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  if (['opportunities', 'funds', 'rounds'].includes(normalizedSourceKey)) return 'opportunities'
  return normalizedSourceKey
}

const heroPayload = computed(() => {
  const sourceKey = getHeroContractSourceKey(activeSourceKey.value)
  const heroRegistryEntry = getFilePageRegistryEntry(sourceKey) || activeRegistryEntry.value || null
  const fileLabel = String(heroRegistryEntry?.label || pageShellLabel.value || 'File').trim() || 'File'
  const validation = sourceKey === 'file-system' ? fileSystemValidation.value : null
  const totalRows = rawRows.value.length
  const hasValidator = sourceKey === 'file-system'
  const totalDriftPoints = Math.max(
    hasValidator
      ? Number(validation?.registryCount || validation?.rowCount || totalRows || 0)
      : Number(totalRows || 0),
    0,
  )
  const activeDriftPoints = Math.min(
    hasValidator ? fileSystemValidationIssueCount.value : 0,
    totalDriftPoints,
  )
  const remainingDriftPoints = Math.max(totalDriftPoints - activeDriftPoints, 0)
  const sharedText = isRecordShellMode.value
    ? 'This is the shared record-create shell. The selected L1 sets the real source entity, while the active L2 section defines which L3 tune fields are visible in the row surface.'
    : `This is the shared file shell for ${fileLabel}. The active L1 determines the local payload while the hero structure remains owned by bb:file-hero.`

  return {
    text: sharedText,
    stats: [
      {
        label: 'Rows',
        value: totalRows,
        caption: sourceKey === 'file-system' ? 'Registry rows loaded' : 'Real rows loaded',
        tone: 'neutral',
      },
      {
        label: 'Drift',
        value: hasValidator ? activeDriftPoints : 'N/A',
        caption: hasValidator ? 'Current validator issues' : 'Validator not connected',
        tone: hasValidator && activeDriftPoints > 0 ? 'rich' : 'neutral',
      },
    ],
    healthText: hasValidator && validation
      ? `Checked ${Number(validation?.rowCount || 0)} rows against ${Number(validation?.registryCount || 0)} executable registry entries. Errors: ${Number(validation?.severityCounts?.error || 0)}. Warnings: ${Number(validation?.severityCounts?.warn || 0)}. Info: ${Number(validation?.severityCounts?.info || 0)}.`
      : `This file page is rendering through the shared File Shell hero contract. Local payload comes from ${fileLabel}, while the hero structure remains linked to bb:file-hero. Validator coverage has not been attached yet.`,
    healthSegments: hasValidator && totalDriftPoints > 0
      ? [
          { tone: 'sparse', width: (activeDriftPoints / totalDriftPoints) * 100 },
          { tone: 'rich', width: (remainingDriftPoints / totalDriftPoints) * 100 },
        ]
      : [
          { tone: 'sparse', width: 100 },
          { tone: 'rich', width: 0 },
        ],
    actionLabel: 'File Health',
    actionTitle: 'Reference Documents',
    actionItems: getFilePageReferenceDocs(sourceKey),
  }
})

const heroText = computed(() => heroPayload.value.text)
const heroStats = computed(() => heroPayload.value.stats)
const healthText = computed(() => heroPayload.value.healthText)
const healthSegments = computed(() => heroPayload.value.healthSegments)
const heroActionLabel = computed(() => heroPayload.value.actionLabel)
const heroActionTitle = computed(() => heroPayload.value.actionTitle)
const heroActionItems = computed(() => heroPayload.value.actionItems)

const fileSystemValidation = computed(() =>
  activeSourceKey.value === 'file-system' && loaderDiagnostics.value && typeof loaderDiagnostics.value === 'object'
    ? loaderDiagnostics.value.validation || null
    : null,
)

const fileSystemValidationIssueCount = computed(() => {
  const validation = fileSystemValidation.value
  return Array.isArray(validation?.issues) ? validation.issues.length : 0
})

const isBbFileSource = computed(() => activeSourceKey.value === 'bb-file')
const searchPlaceholder = computed(() => `Search ${activeRegistryEntry.value?.label || 'Records'}`)
const viewOptions = Object.freeze([
  { value: 'page', icon: 'view_agenda', label: 'Page' },
  { value: 'card', icon: 'grid_view', label: 'Card' },
])

const multiTokenFilterSections = computed(() => {
  if (!activeSection.value) return []
  return getFilterSectionTokenCount(activeSection.value.key) > 1 ? [activeSection.value] : []
})

const bbFilterGroups = computed(() => {
  if (!isBbFileSource.value) return []

  const groups = []
  const groupsByKey = new Map()

  rawRows.value.forEach((row) => {
    const blockKey = getBbTileBlockKey({ raw: row, recordId: row?.id })
    if (!blockKey) return

    const label = String(row?.Category || '').trim() || 'Uncategorized'
    const key = label.toLowerCase()
    const blockLabel = String(row?.Name || blockKey).trim() || blockKey

    if (!groupsByKey.has(key)) {
      const group = { key, label, blocks: [] }
      groupsByKey.set(key, group)
      groups.push(group)
    }

    groupsByKey.get(key).blocks.push({
      key: blockKey,
      label: blockLabel,
    })
  })

  groups.forEach((group) => {
    group.blocks.sort((left, right) => left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }))
  })

  return groups
})

const fileFilterMenuSections = computed(() => {
  if (isBbFileSource.value) {
    return bbFilterGroups.value.map((group) => ({
      key: group.key,
      label: group.label,
      count: group.blocks.length,
      items: [
        {
          key: `category:${group.key}`,
          label: group.label,
          selected: activeBbCategoryKey.value === group.key && !activeBbBlockKey.value,
        },
        ...group.blocks.map((block) => ({
          key: `block:${block.key}`,
          label: block.label,
          selected: block.key === activeBbBlockKey.value,
        })),
      ],
    }))
  }

  return multiTokenFilterSections.value.map((section) => ({
    key: section.key,
    label: section.label,
    count: getFilterSectionTokenCount(section.key),
    items: getSectionTokens(section.key).map((token) => ({
      key: `token:${token.key}`,
      label: token.label,
      selected: token.key === activeFilterTokenKey.value,
    })),
  }))
})

const activeBbFilterGroup = computed(() =>
  bbFilterGroups.value.find((group) => group.key === activeBbCategoryKey.value) || null,
)

const activeBbFilterLabel = computed(() => {
  if (!activeBbFilterGroup.value) return ''
  if (!activeBbBlockKey.value) return activeBbFilterGroup.value.label
  const block = activeBbFilterGroup.value.blocks.find((entry) => entry.key === activeBbBlockKey.value)
  return block ? `${activeBbFilterGroup.value.label} > ${block.label}` : activeBbFilterGroup.value.label
})

const bbTileGroups = computed(() => {
  if (!isBbFileSource.value || viewMode.value !== 'card') return []

  const groups = []
  const groupsByKey = new Map()
  displayRows.value.forEach((row) => {
    const rawCategory = String(row?.raw?.Category || '').trim()
    const label = rawCategory || 'Uncategorized'
    const key = label.toLowerCase()

    if (!groupsByKey.has(key)) {
      const group = { key, label, rows: [] }
      groupsByKey.set(key, group)
      groups.push(group)
    }

    groupsByKey.get(key).rows.push(row)
  })

  groups.forEach((group) => {
    group.rows.sort((left, right) => {
      return String(left?.titleValue || '')
        .localeCompare(String(right?.titleValue || ''), undefined, { sensitivity: 'base' })
    })
  })

  return groups
})

watch(
  bbFilterGroups,
  (groups) => {
    if (!isBbFileSource.value) return

    if (activeBbCategoryKey.value && !groups.some((group) => group.key === activeBbCategoryKey.value)) {
      activeBbCategoryKey.value = ''
    }

    if (
      activeBbBlockKey.value &&
      !groups.some((group) => group.blocks.some((block) => block.key === activeBbBlockKey.value))
    ) {
      activeBbBlockKey.value = ''
    }

    if (expandedBbFilterCategoryKey.value && !groups.some((group) => group.key === expandedBbFilterCategoryKey.value)) {
      expandedBbFilterCategoryKey.value = ''
    }
  },
  { immediate: true },
)

watch(
  bbTileGroups,
  (groups) => {
    const nextState = { ...bbTileGroupOpenState.value }
    groups.forEach((group) => {
      if (typeof nextState[group.key] !== 'boolean') nextState[group.key] = true
    })
    Object.keys(nextState).forEach((key) => {
      if (!groups.some((group) => group.key === key)) delete nextState[key]
    })
    bbTileGroupOpenState.value = nextState
  },
  { immediate: true },
)
const tableLeftSections = computed(() =>
  level2Sections.value.filter((section) => {
    const label = String(section.rawLabel || section.label || '').trim().toLowerCase()
    return !isRelationshipSectionLabel(label) && label !== 'system'
  }),
)
const tableRightSections = computed(() =>
  level2Sections.value.filter((section) => {
    const label = String(section.rawLabel || section.label || '').trim().toLowerCase()
    return isRelationshipSectionLabel(label) || label === 'system'
  }),
)
const eventShellNavItems = computed(() => [
  ...tableLeftSections.value.map((section) => ({
    value: section.key,
    title: section.label,
    isKdb: false,
    isSystem: false,
    pushRight: false,
  })),
  ...tableRightSections.value.map((section, index) => {
    const normalized = String(section.rawLabel || section.label || '').trim().toLowerCase()
    return {
      value: section.key,
      title: section.label,
      isKdb: isRelationshipSectionLabel(normalized),
      isSystem: normalized === 'system',
      pushRight: index === 0,
    }
  }),
])
const summarySectionShellOptions = Object.freeze(buildCardRelationshipOptions())

function getDefaultActiveSectionKey(sections = []) {
  const normalizedSections = Array.isArray(sections) ? sections : []
  const generalSection = normalizedSections.find((section) => String(section?.label || '').trim().toLowerCase() === 'general')
  if (generalSection?.key) return generalSection.key
  return normalizedSections[0]?.key || ''
}

watch(
  activeSourceKey,
  async () => {
    searchQuery.value = ''
    activeFilterSectionKey.value = ''
    activeFilterTokenKey.value = ''
    activeBbCategoryKey.value = ''
    activeBbBlockKey.value = ''
    expandedBbFilterCategoryKey.value = ''
    expandedFilterSectionKey.value = ''
    rowHistoryByRecordId.value = {}
    rowHistoryLoadingByRecordId.value = {}
    await loadRows()
    activeSectionKeyForCards.value = getDefaultActiveSectionKey(level2Sections.value)
  },
  { immediate: true },
)

watch(
  [rawRows, isSystemSectionActive, viewMode, activeSourceKey],
  async ([rows, isSystem, currentViewMode]) => {
    const shouldLoadRowHistory = isSystem || currentViewMode === 'card'
    if (!shouldLoadRowHistory || !bridge.value?.audit?.events || !activeRegistryEntry.value?.entityName) {
      rowHistoryByRecordId.value = {}
      rowHistoryLoadingByRecordId.value = {}
      return
    }

    const tableName = String(getRuntimeTableNameForEntityName(activeRegistryEntry.value.entityName) || activeRegistryEntry.value.entityName || '').trim()
    if (!tableName) {
      rowHistoryByRecordId.value = {}
      rowHistoryLoadingByRecordId.value = {}
      return
    }

    const recordIdField = String(activeLoader.value?.recordIdField || 'id').trim() || 'id'
    const recordIds = (Array.isArray(rows) ? rows : [])
      .map((row) => String(row?.[recordIdField] || '').trim())
      .filter(Boolean)

    rowHistoryLoadingByRecordId.value = Object.fromEntries(recordIds.map((recordId) => [recordId, true]))

    const nextHistoryEntries = {}
    await Promise.all(
      recordIds.map(async (recordId) => {
        try {
          const result = await bridge.value.audit.events({
            table_name: tableName,
            record_id: recordId,
            limit: 5,
          })
          nextHistoryEntries[recordId] = normalizeAuditHistoryItems(result?.events)
        } catch {
          nextHistoryEntries[recordId] = []
        }
      }),
    )

    rowHistoryByRecordId.value = nextHistoryEntries
    rowHistoryLoadingByRecordId.value = Object.fromEntries(recordIds.map((recordId) => [recordId, false]))
  },
  { immediate: true },
)

watch(
  level2Sections,
  (sections) => {
    if (!sections.some((section) => section.key === activeSectionKeyForCards.value)) {
      activeSectionKeyForCards.value = getDefaultActiveSectionKey(sections)
    }
  },
  { immediate: true },
)

watch(
  displayRows,
  (rows) => {
    const nextMap = {}
    rows.forEach((row) => {
      const rowId = getRowSelectionId(row)
      if (!rowId) return
      nextMap[rowId] = resolveCardRelationshipPanel(cardRelationshipPanelById.value[rowId], row.relationshipItemsByType || {})
    })
    cardRelationshipPanelById.value = nextMap
  },
  { immediate: true },
)

watch(
  [createDialogOpen, activeSourceKey, createPrimaryTokens, createSectionGroups],
  async ([isOpen]) => {
    if (!isOpen) return
    await preloadCreateDialogOptionSources()
  },
  { immediate: true },
)

watch(
  [() => route.name, () => route.query.create, activeSourceKey, createPrimaryTokens, createSectionGroups],
  async ([, createFlag]) => {
    if (!String(createFlag || '').trim()) return

    await preloadCreateDialogOptionSources()

    const nextInitialValues = {}
    const requestedBranch = String(route.query.kind || '').trim().toLowerCase()
    const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
    const branchEntry = getCreateBranchEntry(activeSourceKey.value, requestedBranch)
    const branchToken = branchTokenName
      ? [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)].find(
          (token) => String(token?.tokenName || '').trim() === branchTokenName,
        ) || null
      : null

    if (branchToken && branchEntry) {
      nextInitialValues[branchToken.key] = resolveCreateDialogOptionValue(branchToken, branchEntry.value)
    }

    openCreateRecordShell({ initialValues: nextInitialValues })

    const nextQuery = {
      ...route.query,
    }
    delete nextQuery.create
    delete nextQuery.kind
    router.replace({ query: nextQuery })
  },
  { immediate: true },
)

watch(
  [() => route.name, () => route.query.edit, () => route.query.editSection, displayRows],
  async ([, editRecordId, editSection]) => {
    const normalizedRecordId = String(editRecordId || '').trim()
    if (!normalizedRecordId) return

    const row = displayRows.value.find((entry) => String(entry?.recordId || '').trim() === normalizedRecordId) || null
    if (!row) return

    if (isRelationshipSectionLabel(editSection)) {
      await openAddRelationShell(row)
    } else {
      await openEditRecordShell(row)
    }

    const nextQuery = {
      ...route.query,
    }
    delete nextQuery.edit
    delete nextQuery.editSection
    router.replace({ query: nextQuery })
  },
  { immediate: true },
)

watch(
  [activeCardSettingsScopeKey, availableCardItemTokens],
  () => {
    const scopeKey = activeCardSettingsScopeKey.value
    const allowedKeys = new Set(availableCardItemTokens.value.map((token) => token.key))
    const existing = Array.isArray(cardItemKeysBySource.value[scopeKey]) ? cardItemKeysBySource.value[scopeKey] : []
    const normalized = existing.filter((key) => allowedKeys.has(key))

    if (normalized.length) {
      if (normalized.length !== existing.length) {
        cardItemKeysBySource.value = {
          ...cardItemKeysBySource.value,
          [scopeKey]: normalized,
        }
      }
      return
    }

    if (existing.length || cardItemKeysBySource.value[scopeKey]) {
      cardItemKeysBySource.value = {
        ...cardItemKeysBySource.value,
        [scopeKey]: normalized,
      }
    }
  },
  { immediate: true },
)

watch(
  cardItemKeysBySource,
  (value) => {
    persistShellFieldSelectionMap(value)
  },
  { deep: true },
)

watch(
  [activeCardSettingsScopeKey, cardItemTokenGroups],
  () => {
    const scopeKey = activeCardSettingsScopeKey.value
    const availableKeys = new Set(cardItemTokenGroups.value.map((group) => group.key))
    const existing = expandedCardSettingsGroupsBySource.value[scopeKey]
    const normalized = Array.isArray(existing)
      ? existing.filter((key) => availableKeys.has(key))
      : cardItemTokenGroups.value.map((group) => group.key)

    expandedCardSettingsGroupsBySource.value = {
      ...expandedCardSettingsGroupsBySource.value,
      [scopeKey]: normalized,
    }
  },
  { immediate: true },
)

watch(
  [
    () => viewMode.value,
    () => activeContentSourceKey.value,
    () => activeSectionKeyForCards.value,
    () => tableSectionTokens.value.map((token) => token.key).join('|'),
    () => displayRows.value.length,
  ],
  async () => {
    if (viewMode.value === 'card') return
    await nextTick()
    initializeTableColumnWidths()
  },
  { immediate: true },
)

let removeColumnResizeListeners = null

function getColumnWidth(columnKey, fallbackWidth) {
  const storedWidth = Number(tableColumnWidths.value[String(columnKey || '').trim()])
  return Number.isFinite(storedWidth) && storedWidth > 0 ? storedWidth : fallbackWidth
}

function getTableColumnStyle(columnKey, fallbackWidth) {
  const width = getColumnWidth(columnKey, fallbackWidth)
  return {
    width: `${width}px`,
    minWidth: `${width}px`,
    maxWidth: `${width}px`,
  }
}

function getInitialTableColumns() {
  return [
    { key: 'name', defaultWidth: NAME_COLUMN_DEFAULT_WIDTH },
    ...tableSectionTokens.value.map((token) => ({
      key: token.key,
      defaultWidth: DEFAULT_COLUMN_MIN_WIDTH,
    })),
  ]
}

function initializeTableColumnWidths() {
  const scrollElement = tableScrollRef.value
  if (!scrollElement) return

  const columns = getInitialTableColumns()
  if (!columns.length) return

  const currentWidths = { ...tableColumnWidths.value }
  const missingColumns = columns.filter((column) => {
    const storedWidth = Number(currentWidths[column.key])
    return !(Number.isFinite(storedWidth) && storedWidth > 0)
  })

  if (!missingColumns.length) return

  const fixedControlWidth = TABLE_CONTROL_COLUMN_WIDTH * 2
  const assignedWidth = columns.reduce((sum, column) => {
    const storedWidth = Number(currentWidths[column.key])
    return Number.isFinite(storedWidth) && storedWidth > 0 ? sum + storedWidth : sum
  }, 0)
  const missingDefaultWidth = missingColumns.reduce((sum, column) => sum + column.defaultWidth, 0)
  const availableWidth = Math.max(0, Math.floor(scrollElement.clientWidth) - fixedControlWidth)
  const extraWidth = Math.max(0, availableWidth - assignedWidth - missingDefaultWidth)
  const extraPerMissingColumn = missingColumns.length ? Math.floor(extraWidth / missingColumns.length) : 0

  missingColumns.forEach((column) => {
    currentWidths[column.key] = column.defaultWidth + extraPerMissingColumn
  })

  tableColumnWidths.value = currentWidths
}

function isCardItemEnabled(tokenKey) {
  return enabledCardItemKeys.value.includes(tokenKey)
}

function setCardItemEnabled(tokenKey, nextValue) {
  const scopeKey = activeCardSettingsScopeKey.value
  const current = enabledCardItemKeys.value
  if (!nextValue) {
    cardItemKeysBySource.value = {
      ...cardItemKeysBySource.value,
      [scopeKey]: current.filter((key) => key !== tokenKey),
    }
    return
  }
  if (current.includes(tokenKey)) return
  cardItemKeysBySource.value = {
    ...cardItemKeysBySource.value,
    [scopeKey]: [...current, tokenKey],
  }
}

function toggleCardSettingsGroup(groupKey) {
  const scopeKey = activeCardSettingsScopeKey.value
  const current = [...expandedCardSettingsGroups.value]
  const next = current.includes(groupKey)
    ? current.filter((key) => key !== groupKey)
    : [...current, groupKey]

  expandedCardSettingsGroupsBySource.value = {
    ...expandedCardSettingsGroupsBySource.value,
    [scopeKey]: next,
  }
}

function stopColumnResize() {
  if (typeof removeColumnResizeListeners === 'function') {
    removeColumnResizeListeners()
    removeColumnResizeListeners = null
  }
}

function startColumnResize(columnKey, minWidth, event) {
  stopColumnResize()
  const normalizedKey = String(columnKey || '').trim()
  const startX = Number(event?.clientX || event?.pageX || 0)
  const initialWidth = getColumnWidth(normalizedKey, minWidth)
  const handle = event?.currentTarget

  if (handle && typeof handle.setPointerCapture === 'function' && event?.pointerId != null) {
    try {
      handle.setPointerCapture(event.pointerId)
    } catch (captureError) {
      void captureError
    }
  }

  const handlePointerMove = (moveEvent) => {
    const moveX = Number(moveEvent?.clientX || moveEvent?.pageX || 0)
    const nextWidth = Math.max(minWidth, initialWidth + moveX - startX)
    tableColumnWidths.value = {
      ...tableColumnWidths.value,
      [normalizedKey]: nextWidth,
    }
  }

  const handlePointerUp = () => {
    stopColumnResize()
  }

  window.addEventListener('pointermove', handlePointerMove)
  window.addEventListener('pointerup', handlePointerUp)
  removeColumnResizeListeners = () => {
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
  }
}

onBeforeUnmount(() => {
  stopColumnResize()
})

async function loadRows() {
  error.value = ''
  rawRows.value = []
  loaderDiagnostics.value = {}
  const loader = activeLoader.value
  if (!loader) {
    error.value = 'This section does not have a supported live loader yet.'
    return
  }

  const bridgeValue = bridge.value
  if (!bridgeValue) {
    error.value = 'The preload bridge is not available.'
    return
  }

  loading.value = true
  try {
    const result = await loader.listFn(bridgeValue)
    rawRows.value = Array.isArray(result?.[loader.resultKey]) ? result[loader.resultKey] : []
    loaderDiagnostics.value = result && typeof result === 'object' ? result : {}
  } catch (loadError) {
    error.value = loadError?.message || `Could not load ${activeRegistryEntry.value?.label || 'records'}.`
  } finally {
    loading.value = false
  }
}

function buildShellRow(row, index) {
  const recordIdField = activeLoader.value?.recordIdField || ''
  const recordId = String(row?.[recordIdField] || '').trim()
  const bbBlockKey = isBbFileSource.value ? getBbTileBlockKey({ raw: row, recordId }) : ''
  const bbGraphCounts = bbBlockKey ? getBuildingBlockGraphCounts(bbBlockKey) : { parentCount: 0, childCount: 0 }
  const bbGraphLinks = bbBlockKey ? getBuildingBlockGraphLinks(bbBlockKey) : { parents: [], children: [] }
  const titleValue =
    (isBbFileSource.value ? stringifyValue(row?.Name) : '')
    || stringifyValue(getCanonicalTokenValue(row, canonicalTitleToken.value))
  const sourcePrefixes = (
    activeRegistryEntry.value?.relationshipSourcePrefixes?.length
      ? activeRegistryEntry.value.relationshipSourcePrefixes
      : [activeRegistryEntry.value?.singularLabel]
  )
    .map((value) => String(value || '').trim())
    .filter(Boolean)
  const tokenPresence = Object.fromEntries(
    level3Tokens.value.map((token) => [token.key, Boolean(stringifyValue(getCanonicalTokenValue(row, token)))]),
  )
  const sectionPresence = Object.fromEntries(
    level2Sections.value.map((section) => [
      section.key,
      level3Tokens.value
        .filter((token) => token.parentKey === section.key)
        .some((token) => tokenPresence[token.key]),
    ]),
  )
  const tokenRows = tableSectionTokens.value.map((token) => {
    if (isBbFileSource.value && String(token.tokenName || '').startsWith('__bb_')) {
      const { value, links } = getBbRowColumnValue(token.tokenName, row, bbGraphCounts, bbGraphLinks)
      return {
        key: `${recordId || index}:${token.key}`,
        columnKey: token.key,
        token,
        tokenName: token.tokenName,
        label: token.label,
        rawValue: value,
        value,
        links,
      }
    }
    const rawValue = getCanonicalTokenValue(row, token)
    const value = stringifyValue(rawValue)
    return {
      key: `${recordId || index}:${token.key}`,
      columnKey: token.key,
      token,
      tokenName: token.tokenName,
      label: token.label,
      rawValue,
      value,
    }
  })

  const cardDetailRows = enabledCardItemKeys.value
    .map((tokenKey) => availableCardItemTokens.value.find((token) => token.key === tokenKey))
    .filter(Boolean)
    .map((token) => {
      const value = stringifyValue(getCanonicalTokenValue(row, token))
      return {
        key: `${recordId || index}:detail:${token.key}`,
        label: token.label,
        value,
      }
    })
    .filter((item) => item.value)

  const matchedTokenCount = tokenRows.filter((token) => token.value).length

  return {
    cardId: `${recordId || 'row'}:${index}`,
    recordId,
    isLocalDraft: Boolean(row?.__localDraft) || String(recordId || '').trim().startsWith('draft:'),
    raw: row,
    avatarText: buildInitialsFromName(titleValue) || activeRegistryEntry.value?.singularLabel?.slice(0, 2)?.toUpperCase() || 'TS',
    titleValue,
    subtitleValue: '',
    cardDetailRows,
    relationshipItemsByType: buildCardRelationshipItems(row, sourcePrefixes),
    sectionPresence,
    tokenPresence,
    sectionTokenRows: tokenRows,
    matchedTokenCount,
    visibleTokenCount: tokenRows.length,
  }
}

function getRowSelectionId(row) {
  return String(row?.recordId || row?.cardId || '').trim()
}

function isRowSelected(row) {
  const id = getRowSelectionId(row)
  return Boolean(id) && selectedRowIds.value.includes(id)
}

function toggleRowSelection(row, nextValue) {
  const id = getRowSelectionId(row)
  if (!id) return
  if (nextValue) {
    if (!selectedRowIds.value.includes(id)) {
      selectedRowIds.value = [...selectedRowIds.value, id]
    }
    return
  }
  selectedRowIds.value = selectedRowIds.value.filter((selectedId) => selectedId !== id)
}

function toggleSelectAllVisible(nextValue) {
  const visibleIds = visibleSelectableRowIds.value
  if (!visibleIds.length) return
  if (nextValue) {
    selectedRowIds.value = Array.from(new Set([...selectedRowIds.value, ...visibleIds]))
    return
  }
  selectedRowIds.value = selectedRowIds.value.filter((id) => !visibleIds.includes(id))
}

function stringifyValue(value) {
  if (value == null) return ''
  if (Array.isArray(value)) return value.map((item) => stringifyValue(item)).filter(Boolean).join(', ')
  if (typeof value === 'object') return ''
  return String(value).trim()
}

function buildInitialsFromName(value) {
  const parts = String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) return ''
  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function getKdbDisplayItems(tokenRow) {
  const items = getKdbCellItems(tokenRow)
  if (items.length) return items

  const normalized = stringifyValue(tokenRow?.rawValue || tokenRow?.value)
  if (!normalized) return []
  return normalized
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((label) => ({
      key: label,
      label,
      canOpen: false,
      sourceKey: '',
      recordId: '',
      entityName: '',
      tokenName: '',
    }))
}

function getEventTokenRawValue(row, token) {
  return getCanonicalTokenValue(row?.raw || {}, token || {})
}

function eventTokenItems(row, token) {
  const rawValue = getEventTokenRawValue(row, token)
  if (Array.isArray(rawValue)) return rawValue.map((item) => stringifyValue(item)).filter(Boolean)
  return []
}

function eventTokenDisplayValue(row, token) {
  const rawValue = getEventTokenRawValue(row, token)
  if (Array.isArray(rawValue)) return rawValue.map((item) => stringifyValue(item)).filter(Boolean).join(', ')
  return stringifyValue(rawValue)
}

function getActiveRelationshipItems(row) {
  if (String(getRowRelationshipPanel(row) || '').trim().toLowerCase() === 'events') {
    return getRowHistoryItems(row).map((item) => String(item?.title || '').trim()).filter(Boolean)
  }
  return row?.relationshipItemsByType?.[getRowRelationshipPanel(row)] || []
}

function getActiveRelationshipEmptyMessage(row) {
  const activePanel = String(getRowRelationshipPanel(row) || '').trim().toLowerCase()
  if (activePanel === 'events') return 'No events yet for this record.'
  return `No ${getCardRelationshipLabel(activePanel).toLowerCase()} linked to this record.`
}

function getRowRelationshipPanel(row) {
  const rowId = getRowSelectionId(row)
  return rowId ? cardRelationshipPanelById.value[rowId] || 'notes' : 'notes'
}

function buildRowArtifactContext(row) {
  if (activeSourceKey.value === 'artifacts') return null
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const entityLabel = String(activeRegistryEntry.value?.singularLabel || activeRegistryEntry.value?.label || '').trim()
  const recordId = String(row?.recordId || '').trim()
  const recordLabel = String(row?.titleValue || '').trim()
  if (!entityName || !entityLabel || !recordId) return null

  return {
    entityName,
    entityLabel,
    recordId,
    recordLabel,
    state: 'default_preselected_unverified',
  }
}

function buildContextRelationshipPrefillForSource(sourceKey, contextEntity, contextRecordId) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  const normalizedContextEntity = String(contextEntity || '').trim()
  const normalizedContextRecordId = String(contextRecordId || '').trim()
  if (!normalizedSourceKey || !normalizedContextEntity || !normalizedContextRecordId) {
    return { initialValues: {}, initialFieldMeta: {} }
  }

  const registryEntry = getFilePageRegistryEntry(normalizedSourceKey)
  const targetEntityName = String(registryEntry?.entityName || '').trim()
  if (!targetEntityName) return { initialValues: {}, initialFieldMeta: {} }

  const sourceTokens = Array.isArray(LEVEL_3_FILE_REGISTRY_BY_KEY[normalizedSourceKey]) ? LEVEL_3_FILE_REGISTRY_BY_KEY[normalizedSourceKey] : []
  const matchingTokens = sourceTokens.filter((token) => {
    const relationshipContract = getLdbRelationshipContractForToken(targetEntityName, token?.tokenName)
    return String(relationshipContract?.targetEntity || '').trim() === normalizedContextEntity
  })

  if (!matchingTokens.length) return { initialValues: {}, initialFieldMeta: {} }

  const initialValues = {}
  const initialFieldMeta = {}

  matchingTokens.forEach((token) => {
    const tokenKey = String(token?.key || '').trim()
    const tokenType = String(token?.tokenType || '').trim()
    const tokenName = String(token?.tokenName || '').trim()
    if (!tokenKey || !tokenName) return

    initialValues[tokenKey] = tokenType === 'select_multi'
      ? [normalizedContextRecordId]
      : normalizedContextRecordId
    initialFieldMeta[tokenKey] = {
      fieldName: tokenName,
      tableName: getRuntimeTableNameForEntityName(targetEntityName),
      recordId: '',
      verificationState: 'default_preselected_unverified',
      verificationSource: 'action_route_preselected',
    }
  })

  return { initialValues, initialFieldMeta }
}

function setRowRelationshipPanel(row, nextValue) {
  const rowId = getRowSelectionId(row)
  if (!rowId) return
  cardRelationshipPanelById.value = {
    ...cardRelationshipPanelById.value,
    [rowId]: resolveCardRelationshipPanel(nextValue, row.relationshipItemsByType || {}),
  }
}

function handleCardAddRelation(row) {
  if (!supportsActiveSourceEditing.value) return
  const activePanel = String(getRowRelationshipPanel(row) || '').trim().toLowerCase()
  const supportedCreateSourceKeys = new Set([
    'users',
    'artifacts',
    'contacts',
    'companies',
    'opportunities',
    'projects',
    'tasks',
    'notes',
  ])

  const artifactContext = buildRowArtifactContext(row)

  if (activePanel === 'intake') {
    setPendingIntakeShellRequest({
      initialArtifacts: [],
      artifactContext,
    })
    router.push({
      name: 'intake-shell',
      query: {
        section: 'intake',
        create: '1',
        open: String(Date.now()),
      },
    })
    return
  }

  if (!supportedCreateSourceKeys.has(activePanel)) {
    requestEditRecordShell(row, { sectionKey: 'kdb' })
    return
  }

  requestCreateRecordShellForSource(activePanel, {
    contextEntity: String(artifactContext?.entityName || '').trim(),
    contextRecordId: String(artifactContext?.recordId || '').trim(),
  })
}

function getTestShellMetadataRows(row) {
  return Array.isArray(row?.cardDetailRows) ? row.cardDetailRows : []
}

function getTestShellSubtitleRow(row) {
  return getTestShellMetadataRows(row)[0] || null
}

function getTestShellChipRows(row) {
  return getTestShellMetadataRows(row).slice(1)
}

function getTestShellAvatarColor() {
  return '#111111'
}

function getTestShellCardStyle() {
  return {
    '--test-shell-card-blob-x': '50%',
    '--test-shell-card-blob-y': '30%',
    '--test-shell-card-blob-size': '60%',
    '--test-shell-card-blob-opacity': '0',
    '--test-shell-card-blob-strong': 'rgba(38, 71, 255, 0.2)',
    '--test-shell-card-blob-soft': 'rgba(38, 71, 255, 0.1)',
    '--test-shell-card-blob-fade': 'rgba(38, 71, 255, 0.05)',
  }
}

function onTestShellCardPointerEnter(event) {
  updateTestShellCardGradientPosition(event)
  event?.currentTarget?.style?.setProperty('--test-shell-card-blob-opacity', '1')
}

function onTestShellCardPointerMove(event) {
  updateTestShellCardGradientPosition(event)
}

function onTestShellCardPointerLeave(event) {
  const element = event?.currentTarget
  if (!element) return
  element.style.setProperty('--test-shell-card-blob-opacity', '0')
}

function updateTestShellCardGradientPosition(event) {
  const element = event?.currentTarget
  if (!element || typeof element.getBoundingClientRect !== 'function') return
  const rect = element.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * 100
  const y = ((event.clientY - rect.top) / rect.height) * 100
  const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, value))
  element.style.setProperty('--test-shell-card-blob-x', `${clamp(x, 10, 90)}%`)
  element.style.setProperty('--test-shell-card-blob-y', `${clamp(y, 10, 90)}%`)
}

function openRecordView(row) {
  if (!row?.recordId || !activeRegistryEntry.value?.entityName) return
  if (activeSourceKey.value === 'events') {
    const sourceTableName = String(row?.raw?.source_table_name || '').trim()
    const sourceRecordId = String(row?.raw?.source_record_id || '').trim()
    if (!sourceTableName || !sourceRecordId) return
    router.push({
      name: 'record-event',
      params: {
        tableName: sourceTableName,
        recordId: sourceRecordId,
        eventId: row.recordId,
      },
    })
    return
  }
  const cardFields = selectedCardItemTokens.value.map((token) => String(token?.tokenName || '').trim()).filter(Boolean)
  const location = buildRecordViewLocation({
      tableName: activeRegistryEntry.value.entityName,
      recordId: row.recordId,
      returnTo: route.fullPath,
      query: cardFields.length ? { cardFields: cardFields.join(',') } : {},
    })
  if (!location) return
  router.push(location)
}

function formatAuditHistoryActionLabel(value) {
  const normalized = String(value || '').trim()
  if (!normalized) return 'updated'
  return normalized
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase()
      if (lower === 'create') return 'created'
      if (lower === 'update') return 'modified'
      if (lower === 'delete') return 'deleted'
      return lower
    })
    .join(' ')
}

function formatVerificationStateLabel(state) {
  const normalized = String(state || '').trim().toLowerCase()
  if (normalized === 'verified') return 'verified'
  if (normalized === 'default_preselected_unverified') return 'pre-selected'
  if (normalized === 'suggested_unverified') return 'suggested'
  if (normalized === 'rejected') return 'rejected'
  return 'verification updated'
}

function normalizeAuditHistoryItems(events = []) {
  return (Array.isArray(events) ? events : [])
    .map((event) => {
      const payload = event?.payload && typeof event.payload === 'object' ? event.payload : {}
      const fieldLabel = String(payload?.field_label || event?.field_name || '').replace(/__verification$/, '').trim()
      const actorLabel = String(payload?.actor_label || event?.edited_by || '').trim() || 'System'
      const actionLabel = formatAuditHistoryActionLabel(event?.action_label)
      const title = String(event?.field_name || '').trim().endsWith('__verification')
        ? `${formatVerificationStateLabel(payload?.verification_state)} ${fieldLabel || 'field'}`
        : fieldLabel ? `${actionLabel} ${fieldLabel}` : actionLabel
      return {
        id: String(event?.id || '').trim(),
        sourceLabel: actorLabel,
        meta: String(event?.edited_at || '').trim() || 'Recent',
        title,
        openable: Boolean(event?.id),
      }
    })
    .filter((item) => item.id)
}

function getRowHistoryItems(row) {
  const recordId = String(row?.recordId || '').trim()
  if (!recordId) return []
  return Array.isArray(rowHistoryByRecordId.value[recordId]) ? rowHistoryByRecordId.value[recordId] : []
}

function isRowHistoryLoading(row) {
  const recordId = String(row?.recordId || '').trim()
  if (!recordId) return false
  return Boolean(rowHistoryLoadingByRecordId.value[recordId])
}

function openRowHistoryItem(row, item) {
  const recordId = String(row?.recordId || '').trim()
  const eventId = String(item?.id || '').trim()
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const tableName = String(getRuntimeTableNameForEntityName(entityName) || entityName || '').trim()
  if (!recordId || !eventId || !tableName) return
  router.push({
    name: 'record-event',
    params: {
      tableName,
      recordId,
      eventId,
    },
  })
}

function openBbShell(row) {
  const blockKey = getBbTileBlockKey(row)
  if (!blockKey) return
  openBbShellByBlockKey(blockKey)
}

function normalizeIpcErrorMessage(errorValue) {
  const raw = String(errorValue?.message || errorValue || '').trim()
  if (!raw) return 'An unexpected error occurred.'
  return raw.replace(/^Error invoking remote method '[^']+':\s*/i, '').trim()
}

async function handleHeroActionItemClick(item = {}) {
  const path = String(item?.path || '').trim()
  if (!path || typeof bridge.value?.docs?.read !== 'function') return

  heroDocumentDialogTitle.value = String(item?.label || 'Document').trim()
  heroDocumentDialogContent.value = ''
  heroDocumentDialogError.value = ''
  heroDocumentDialogLoading.value = true
  heroDocumentDialogOpen.value = true

  try {
    const result = await bridge.value.docs.read(path)
    heroDocumentDialogContent.value = String(result?.content || '')
  } catch (errorValue) {
    heroDocumentDialogError.value = normalizeIpcErrorMessage(errorValue)
  } finally {
    heroDocumentDialogLoading.value = false
  }
}

function buildDraftDialogInitialValuesFromRow(row) {
  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return Object.fromEntries(
    allTokens.map((token) => {
      const value = getCanonicalTokenValue(row?.raw || {}, token)
      return [token.key, normalizeCreateDialogInitialValue(token, value)]
    }),
  )
}

function isSystemManagedReadOnlyToken(token) {
  const tokenType = String(token?.tokenType || '').trim().toLowerCase()
  const tokenName = String(token?.tokenName || '').trim().toLowerCase()

  if (['id', 'datetime', 'date', 'creator'].includes(tokenType)) return true
  if (tokenName.endsWith('_id')) return true
  if (tokenName.includes('creator')) return true
  if (tokenName.includes('created_at') || tokenName.includes('updated_at')) return true
  if (tokenName.includes('user_role') || tokenName.includes('role_link')) return true
  return false
}

function canInlineEditTableCell(row, token, kind = 'token') {
  if (!isTableInlineEditingAvailable.value) return false
  if (!token?.key || !row?.recordId) return false
  if (kind !== 'name' && isKdbSectionActive.value) return false
  if (isSystemManagedReadOnlyToken(token)) return false
  if (row?.isLocalDraft) return true

  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  if (!entityName) return false

  if (tokenHasRelationshipWriteContract(token, entityName)) {
    return !isUnsupportedRelationshipWriteToken(token, entityName)
  }

  const writeTarget = getCanonicalTokenWriteTarget(
    token,
    getRuntimeTableNameForEntityName(entityName),
    activeLoader.value?.recordIdField || 'id',
  )
  return Boolean(writeTarget?.tableName && writeTarget?.fieldName)
}

function canOpenCardEdit(row) {
  if (!supportsActiveSourceEditing.value) return false
  return Boolean(row?.recordId)
}

function isInlineEditingCell(row, token, kind = 'token') {
  const rowId = String(row?.recordId || '').trim()
  const tokenKey = String(token?.key || '').trim()
  return (
    canInlineEditTableCell(row, token, kind) &&
    inlineTableEditState.value.rowId === rowId &&
    inlineTableEditState.value.tokenKey === tokenKey &&
    inlineTableEditState.value.kind === kind
  )
}

function beginInlineTableEdit(row, token, kind = 'token') {
  if (!canInlineEditTableCell(row, token, kind)) return
  if (!token?.key || !row?.recordId) return
  const initialValue = normalizeCreateDialogInitialValue(token, getCanonicalTokenValue(row?.raw || {}, token))
  inlineTableEditState.value = {
    rowId: String(row.recordId || '').trim(),
    tokenKey: String(token.key || '').trim(),
    kind,
    value: initialValue,
  }
}

function cancelInlineTableEdit() {
  inlineTableEditState.value = {
    rowId: '',
    tokenKey: '',
    value: '',
    kind: '',
  }
}

function getKdbCellItems(tokenRow) {
  const token = tokenRow?.token
  const entityName = String(activeRegistryEntry.value?.entityName || '').trim()
  const relationshipContract = getLdbRelationshipContractForToken(entityName, token?.tokenName)
  const targetEntry = relationshipContract
    ? getFilePageRegistryEntryByEntityReference(relationshipContract.targetEntity)
    : null
  const targetSourceKey = String(targetEntry?.key || '').trim()
  const targetTitleToken = targetSourceKey ? getRegistryTitleTokenForSource(targetSourceKey) : null
  const targetRows = targetSourceKey ? getOptionRowsForSource(targetSourceKey) : []
  const rawValue = tokenRow?.rawValue
  const rawIds = Array.isArray(rawValue)
    ? rawValue.map((value) => String(value || '').trim()).filter(Boolean)
    : stringifyValue(rawValue)
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)

  if (!rawIds.length) return []

  return rawIds.map((recordId) => {
    const matchingRow = targetRows.find((entry) => String(entry?.id || '').trim() === recordId)
    const label = matchingRow && targetTitleToken
      ? stringifyValue(getCanonicalTokenValue(matchingRow, targetTitleToken)) || recordId
      : recordId
    return {
      key: recordId,
      label,
      recordId,
      sourceKey: targetSourceKey,
      entityName: String(targetEntry?.entityName || '').trim(),
      tokenName: String(token?.tokenName || '').trim(),
      canOpen: Boolean(targetSourceKey && recordId),
    }
  })
}

function updateLocalDraftTokenValue(row, token, value) {
  const sourceKey = activeContentSourceKey.value
  const draftId = String(row?.recordId || '').trim()
  const writeFieldName = getCanonicalTokenWriteFieldName(token)
  if (!sourceKey || !draftId || !writeFieldName) return
  const normalizedValue = normalizeCreateFieldValue(token, value)
  const existingRows = Array.isArray(localDraftRowsBySource.value[sourceKey]) ? localDraftRowsBySource.value[sourceKey] : []
  localDraftRowsBySource.value = {
    ...localDraftRowsBySource.value,
    [sourceKey]: existingRows.map((entry) => {
      if (String(entry?.id || '').trim() !== draftId) return entry
      return {
        ...entry,
        [writeFieldName]: Array.isArray(normalizedValue) ? normalizedValue.join(', ') : normalizedValue,
      }
    }),
  }
}

function openKdbSourceCell(item) {
  if (!item?.canOpen || !item?.entityName || !item?.recordId) return
  const location = buildRecordViewLocation({
    tableName: item.entityName,
    recordId: item.recordId,
    returnTo: route.fullPath,
    query: item.tokenName ? { focusField: item.tokenName } : {},
  })
  if (!location) return
  router.push(location)
}

function buildSingleTokenUpdateChanges(token, value, { recordId = '', entityName = '', tableName = '', idColumn = 'id' } = {}) {
  if (!recordId || !entityName || !token) return []
  const resolvedTableName = String(tableName || getRuntimeTableNameForEntityName(entityName) || entityName || '').trim()
  const normalizedValue = normalizeCreateFieldValue(token, value)
  const relationshipContract = getLdbRelationshipContractForToken(entityName, token?.tokenName)
  if (relationshipContract) {
    const relationshipIds = Array.isArray(normalizedValue)
      ? normalizedValue.map((entry) => String(entry || '').trim()).filter(Boolean)
      : normalizedValue == null
        ? []
        : [String(normalizedValue || '').trim()].filter(Boolean)
    return [{
      change_kind: 'relationship',
      table_name: resolvedTableName,
      record_id: recordId,
      field_name: token.tokenName,
      relationship_token: token.tokenName,
      new_value: JSON.stringify(relationshipIds),
    }]
  }

  if (isUnsupportedRelationshipWriteToken(token, entityName)) {
    throw new Error(`Relationship save contract is not wired yet for: ${String(token?.label || token?.tokenName || '').trim()}`)
  }

  const writeTarget = getCanonicalTokenWriteTarget(token, resolvedTableName, idColumn)
  if (!writeTarget?.tableName || !writeTarget?.fieldName) return []
  return [{
    table_name: writeTarget.tableName,
    record_id: recordId,
    field_name: writeTarget.fieldName,
    id_column: writeTarget.idColumn,
    new_value:
      normalizedValue == null
        ? null
        : Array.isArray(normalizedValue)
          ? JSON.stringify(normalizedValue)
          : String(normalizedValue ?? ''),
  }]
}

async function commitInlineTableEdit(row, token, immediateValue) {
  if (!token || !row?.recordId) return
  const nextValue = arguments.length >= 3 ? immediateValue : inlineTableEditState.value.value
  if (row?.isLocalDraft) {
    updateLocalDraftTokenValue(row, token, nextValue)
    cancelInlineTableEdit()
    return
  }

  const entityName = activeRegistryEntry.value?.entityName || ''
  const tableName = getRuntimeTableNameForEntityName(entityName)
  const changes = buildSingleTokenUpdateChanges(token, nextValue, {
    recordId: row.recordId,
    entityName,
    tableName,
    idColumn: activeLoader.value?.recordIdField || 'id',
  })
  if (!changes.length) {
    cancelInlineTableEdit()
    return
  }

  try {
    await bridge.value?.records?.update?.({
      tableName,
      recordId: row.recordId,
      changes,
      actionLabel: 'inline_table_cell_edit',
    })
    cancelInlineTableEdit()
    await loadRows()
  } catch (error) {
    $q.notify({ type: 'negative', message: error?.message || String(error) })
  }
}

function openBbShellByBlockKey(blockKey) {
  const normalizedBlockKey = String(blockKey || '').trim()
  if (!normalizedBlockKey) return
  router.push({
    name: 'bb-shell',
    query: {
      block: normalizedBlockKey,
    },
  })
}

function canCreateForSourceKey(sourceKey) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  if (!normalizedSourceKey) return false
  const createBranches = getCreateBranches(normalizedSourceKey)
  if (createBranches.length) {
    return createBranches.some((branch) => Boolean(bridge.value?.[String(branch?.targetSourceKey || '').trim()]?.create))
  }
  return Boolean(bridge.value?.[normalizedSourceKey]?.create)
}

function requestCreateRecordShellForSource(sourceKey, options = {}) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  if (!normalizedSourceKey) return

  if (normalizedSourceKey === activeSourceKey.value) {
    if (!canCreateWithShell.value) {
      $q.notify({ type: 'negative', message: 'This shell source is view-only.' })
      return
    }
  } else if (!canCreateForSourceKey(normalizedSourceKey)) {
    $q.notify({ type: 'negative', message: 'This shell source is view-only.' })
    return
  }

  const createSurface = getFilePageCreateSurface(normalizedSourceKey)
  if (createSurface === 'file-dialog') {
    router.push({
      name: 'file-dialog-shell',
      query: {
        section: normalizedSourceKey,
        returnTo: route.fullPath,
      },
    })
    return
  }

  const requestedBranch = String(options?.kind || '').trim().toLowerCase()
  const createBranches = getCreateBranches(normalizedSourceKey)
  const targetRegistryEntry = getFilePageRegistryEntry(normalizedSourceKey) || activeRegistryEntry.value
  if (!requestedBranch && createBranches.length) {
    const branchLabel = String(targetRegistryEntry?.createBranchLabel || 'Type').trim()
    void $q.dialog({
      title: `Choose ${branchLabel}`,
      message: `Select which ${String(targetRegistryEntry?.singularLabel || 'record').trim().toLowerCase()} path you want to create.`,
      cancel: true,
      persistent: true,
      options: {
        type: 'radio',
        model: '',
        items: createBranches.map((entry) => ({
          label: String(entry?.label || entry?.value || '').trim(),
          value: String(entry?.value || '').trim(),
        })),
      },
    }).onOk((selectedBranch) => {
      const normalizedBranch = String(selectedBranch || '').trim().toLowerCase()
      if (!normalizedBranch) return
      requestCreateRecordShellForSource(normalizedSourceKey, { ...options, kind: normalizedBranch })
    })
    return
  }

  if (normalizedSourceKey !== activeSourceKey.value) {
    const contextPrefill = buildContextRelationshipPrefillForSource(
      normalizedSourceKey,
      options?.contextEntity,
      options?.contextRecordId,
    )
    setPendingAddEditShellRequest({
      sourceKey: normalizedSourceKey,
      initialValues: contextPrefill.initialValues,
      initialFieldMeta: contextPrefill.initialFieldMeta,
    })
    const nextQuery = {
      section: normalizedSourceKey,
      create: '1',
      returnTo: route.fullPath,
      open: String(Date.now()),
    }
    if (requestedBranch) nextQuery.kind = requestedBranch
    if (String(options?.contextEntity || '').trim()) nextQuery.contextEntity = String(options.contextEntity).trim()
    if (String(options?.contextRecordId || '').trim()) nextQuery.contextRecordId = String(options.contextRecordId).trim()
    router.push({
      name: 'dialog-shell',
      query: nextQuery,
    })
    return
  }

  const contextPrefill = buildContextRelationshipPrefillForSource(
    normalizedSourceKey,
    options?.contextEntity,
    options?.contextRecordId,
  )
  const nextInitialValues = {
    ...contextPrefill.initialValues,
  }
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchEntry = getCreateBranchEntry(activeSourceKey.value, requestedBranch)
  const branchToken = branchTokenName
    ? [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)].find(
        (token) => String(token?.tokenName || '').trim() === branchTokenName,
      ) || null
    : null

  if (branchToken && branchEntry) {
    nextInitialValues[branchToken.key] = resolveCreateDialogOptionValue(branchToken, branchEntry.value)
  }

  openCreateRecordShell({
    initialValues: nextInitialValues,
    initialFieldMeta: contextPrefill.initialFieldMeta,
  })
}

function requestCreateRecordShell(options = {}) {
  requestCreateRecordShellForSource(activeSourceKey.value, options)
}

function handleToolbarAdd() {
  requestCreateRecordShell(activeCreateBranchEntry.value ? { kind: activeForkValue.value } : {})
}

function getBbTileStatus(row) {
  return stringifyValue(row?.raw?.Status || row?.raw?.Extraction_Status)
}

function getBbTileBlockKey(row) {
  const rawId = stringifyValue(row?.raw?.id || row?.recordId)
  if (rawId.startsWith('bb:')) {
    return rawId.slice(3)
  }
  return ''
}

function setAllBbTilesCollapsed(nextCollapsed) {
  bbTileCollapseState.value = nextCollapsed ? 'collapsed' : 'expanded'
  bbTileCollapseVersion.value += 1
}

function isBbTileGroupOpen(groupKey) {
  return bbTileGroupOpenState.value[groupKey] !== false
}

function toggleBbTileGroup(groupKey) {
  bbTileGroupOpenState.value = {
    ...bbTileGroupOpenState.value,
    [groupKey]: !isBbTileGroupOpen(groupKey),
  }
}

async function copyRowRecordId(row) {
  const recordId = String(row?.recordId || '').trim()
  if (!recordId) return

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(recordId)
      $q.notify({ type: 'positive', message: `Copied Record ID ${recordId}` })
      return
    }
    throw new Error('Clipboard API unavailable')
  } catch {
    $q.notify({ type: 'negative', message: 'Could not copy Record ID.' })
  }
}

function requestEditRecordShell(row, options = {}) {
  if (!supportsActiveSourceEditing.value) return
  const recordId = String(row?.recordId || '').trim()
  if (!recordId) return

  const editSurface = getFilePageEditSurface(activeSourceKey.value)
  if (editSurface === 'file-dialog') {
    const fileSection = String(row?.raw?.File_Source_Key || '').trim().toLowerCase()
    router.push({
      name: 'file-dialog-shell',
      query: {
        section: fileSection || activeSourceKey.value,
        returnTo: route.fullPath,
      },
    })
    return
  }

  const normalizedSectionKey = String(options?.sectionKey || '').trim().toLowerCase()

  if (normalizedSectionKey === 'kdb') {
    router.push({
      name: 'dialog-shell',
      query: {
        section: activeSourceKey.value,
        edit: recordId,
        entity: resolveEditEntityName(row),
        editSection: 'kdb',
      },
    })
    return
  }

  const nextQuery = {
    ...route.query,
    edit: recordId,
  }
  delete nextQuery.editSection
  router.push({ name: route.name, params: route.params, query: nextQuery })
}

function openCreateRecordShell(options = {}) {
  if (!canCreateWithShell.value) {
    $q.notify({ type: 'negative', message: 'This shell source is view-only.' })
    return
  }
  resetCreateDialogAutosaveState()
  createDialogMode.value = 'create'
  createDialogPreferAddLayout.value = true
  createDialogDraftRecordId.value = `draft:${crypto.randomUUID()}`
  createDialogDraftSourceKey.value = activeContentSourceKey.value
  editDialogRow.value = null
  editDialogRecordPayload.value = null
  createDialogInitialSectionKey.value = 'general'
  createDialogPrefillValues.value = {
    ...getFilePageBirthDefaults(activeSourceKey.value),
    ...(options?.initialValues && typeof options.initialValues === 'object' ? { ...options.initialValues } : {}),
  }
  createDialogFieldMeta.value = options?.initialFieldMeta && typeof options.initialFieldMeta === 'object'
    ? { ...options.initialFieldMeta }
    : {}
  createDialogInitialArtifacts.value = []
  upsertLocalDraftRow(activeContentSourceKey.value, createDialogDraftRecordId.value, createDialogInitialValues.value)
  createDialogRenderKey.value += 1
  createDialogOpen.value = true
}

async function openEditRecordShell(row) {
  if (!supportsActiveSourceEditing.value) return
  if (!row?.recordId) return
  if (row?.isLocalDraft) {
    resetCreateDialogAutosaveState()
    createDialogMode.value = 'create'
    createDialogPreferAddLayout.value = true
    createDialogDraftRecordId.value = String(row.recordId || '').trim()
    createDialogDraftSourceKey.value = activeContentSourceKey.value
    editDialogRow.value = row
    editDialogRecordPayload.value = null
    createDialogInitialSectionKey.value = 'general'
    createDialogPrefillValues.value = buildDraftDialogInitialValuesFromRow(row)
    createDialogFieldMeta.value = {}
    createDialogInitialArtifacts.value = []
    createDialogRenderKey.value += 1
    createDialogOpen.value = true
    return
  }
  resetCreateDialogAutosaveState()
  createDialogMode.value = 'edit'
  createDialogPreferAddLayout.value = false
  editDialogRow.value = row
  editDialogRecordPayload.value = null
  createDialogDraftRecordId.value = String(row.recordId || '').trim()
  createDialogDraftEntityName.value = resolveEditEntityName(row)
  createDialogInitialSectionKey.value = 'general'
  createDialogInitialArtifacts.value = await resolveTrueArtifactsForRow(row)
  try {
    editDialogRecordPayload.value = await loadEditDialogRecordPayload(
      createDialogDraftEntityName.value,
      createDialogDraftRecordId.value,
    )
  } catch {
    editDialogRecordPayload.value = null
  }
  if (!editDialogRecordPayload.value?.record) {
    $q.notify({ type: 'negative', message: 'Could not load the true record fields for edit.' })
    editDialogRow.value = null
    createDialogMode.value = 'create'
    return
  }
  createDialogPrefillValues.value = buildEditDialogInitialValuesFromPayload(editDialogRecordPayload.value)
  createDialogFieldMeta.value = buildEditDialogFieldMetaFromPayload(
    editDialogRecordPayload.value,
    createDialogDraftEntityName.value,
    createDialogDraftRecordId.value,
  )
  createDialogRenderKey.value += 1
  createDialogOpen.value = true
}

async function openAddRelationShell(row) {
  if (!supportsActiveSourceEditing.value) return
  if (!row?.recordId) return
  if (row?.isLocalDraft) {
    await openEditRecordShell(row)
    return
  }
  resetCreateDialogAutosaveState()
  createDialogMode.value = 'edit'
  createDialogPreferAddLayout.value = false
  editDialogRow.value = row
  editDialogRecordPayload.value = null
  createDialogDraftRecordId.value = String(row.recordId || '').trim()
  createDialogDraftEntityName.value = resolveEditEntityName(row)
  createDialogInitialSectionKey.value = createDialogKdbSectionKey.value || 'general'
  createDialogInitialArtifacts.value = await resolveTrueArtifactsForRow(row)
  try {
    editDialogRecordPayload.value = await loadEditDialogRecordPayload(
      createDialogDraftEntityName.value,
      createDialogDraftRecordId.value,
    )
  } catch {
    editDialogRecordPayload.value = null
  }
  if (!editDialogRecordPayload.value?.record) {
    $q.notify({ type: 'negative', message: 'Could not load the true record fields for edit.' })
    editDialogRow.value = null
    createDialogMode.value = 'create'
    return
  }
  createDialogPrefillValues.value = buildEditDialogInitialValuesFromPayload(editDialogRecordPayload.value)
  createDialogFieldMeta.value = buildEditDialogFieldMetaFromPayload(
    editDialogRecordPayload.value,
    createDialogDraftEntityName.value,
    createDialogDraftRecordId.value,
  )
  createDialogRenderKey.value += 1
  createDialogOpen.value = true
}

async function submitCreateRecordShell({ values, verification, artifacts } = {}) {
  clearCreateDialogAutosaveTimer()
  const isEditMode = createDialogMode.value === 'edit'
  if (!isEditMode) {
    const missingLabels = missingRequiredCreateTokenLabels(values)
    if (missingLabels.length) {
      $q.notify({
        type: 'negative',
        message: `Complete required fields before creating: ${missingLabels.join(', ')}.`,
      })
      return
    }
  }
  const activeEntityName = isEditMode
    ? activeRegistryEntry.value?.entityName || ''
    : resolveCreateDialogEntityName(buildCreatePayload(values))
  assertNoUnsupportedRelationshipWrites(values, activeEntityName)

  if (!isEditMode && !canCreateWithShell.value) {
    notifyShellAction('Create record')
    return
  }

  const payload = buildCreatePayload(values)
  if (!Object.keys(payload).length) {
    $q.notify({ type: 'negative', message: 'Add at least one field before creating the record.' })
    return
  }
  if (!isEditMode && activeSourceKey.value === 'artifacts') {
    const stagedArtifactPath = Array.isArray(artifacts?.stagedFiles)
      ? String(
        artifacts.stagedFiles.find((artifact) => String(artifact?.path || artifact?.fs_path || '').trim())?.path
          || artifacts.stagedFiles.find((artifact) => String(artifact?.path || artifact?.fs_path || '').trim())?.fs_path
          || '',
      ).trim()
      : ''
    if (!String(payload.fs_path || '').trim() && !String(payload.path || '').trim() && stagedArtifactPath) {
      payload.path = stagedArtifactPath
    }
    if (!String(payload.fs_path || '').trim() && !String(payload.path || '').trim()) {
      $q.notify({ type: 'negative', message: 'Add a file in Resources before creating an artifact.' })
      return
    }
  }

  createDialogLoading.value = true
  try {
    if (isEditMode) {
      if (!activeRegistryEntry.value?.entityName || !editDialogRow.value?.recordId) {
        $q.notify({ type: 'negative', message: 'This record cannot be edited from the shared shell yet.' })
        return
      }

      await updateRecordFromPayload(
        editDialogRow.value.recordId,
        activeRegistryEntry.value.entityName,
        values,
      )
      await applyVerificationChanges(
        editDialogRow.value.recordId,
        activeRegistryEntry.value.entityName,
        verification || {},
      )

      createDialogOpen.value = false
      resetCreateDialogAutosaveState()
      createDialogMode.value = 'create'
      editDialogRow.value = null
      editDialogRecordPayload.value = null
      createDialogInitialSectionKey.value = 'general'
      createDialogPrefillValues.value = {}
      createDialogFieldMeta.value = {}
      createDialogInitialArtifacts.value = []
      $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} updated.` })
      await loadRows()
    } else {
      const sourceKey = activeSourceKey.value
      let result = null

      const branchTarget = resolveCreateBranchTarget(payload)
      if (branchTarget?.targetSourceKey) {
        result = await bridge.value?.[branchTarget.targetSourceKey]?.create?.(payload)
      } else if (getCreateBranches(sourceKey).length) {
        const branchLabel = String(activeRegistryEntry.value?.createBranchLabel || 'Type').trim()
        $q.notify({ type: 'negative', message: `Choose ${branchLabel} before creating.` })
        return
      } else {
        result = await bridge.value?.[sourceKey]?.create?.(payload)
      }

      if (!result) {
        $q.notify({ type: 'negative', message: 'Create bridge is not available for this record type yet.' })
        return
      }

      const createdEntityName =
        sourceKey === 'opportunities'
          ? String(payload.Opportunity_Kind || payload.kind || '').trim().toLowerCase() === 'fund'
            ? 'Funds'
            : 'Rounds'
          : activeRegistryEntry.value?.entityName || ''
      const createdRecordId = String(result?.id || '').trim()
      if (createdRecordId && createdEntityName) {
        await updateRecordFromPayload(createdRecordId, createdEntityName, values)
        await applyVerificationChanges(createdRecordId, createdEntityName, verification || {})
      }

      removeLocalDraftRow(createDialogDraftSourceKey.value, createDialogDraftRecordId.value)
      createDialogOpen.value = false
      resetCreateDialogAutosaveState()
      editDialogRecordPayload.value = null
      createDialogInitialSectionKey.value = 'general'
      createDialogPrefillValues.value = {}
      createDialogFieldMeta.value = {}
      createDialogInitialArtifacts.value = []
      $q.notify({ type: 'positive', message: `${activeRegistryEntry.value?.singularLabel || 'Record'} created.` })
      await loadRows()
    }
  } catch (createError) {
    $q.notify({ type: 'negative', message: createError?.message || String(createError) })
  } finally {
    createDialogLoading.value = false
  }
}

function handleCreateDialogChange(snapshot) {
  createDialogLastChangeSnapshot.value = snapshot
  updateLocalDraftRowFromSnapshot(snapshot)
  if (createDialogMode.value === 'create') return
  if (!snapshot?.hasUserChanges) return
  queueCreateDialogAutosave(snapshot)
}

async function handleCreateDialogClose(snapshot) {
  createDialogLastChangeSnapshot.value = snapshot
  updateLocalDraftRowFromSnapshot(snapshot)
  if (createDialogMode.value !== 'create') {
    await flushCreateDialogAutosave(snapshot, { immediate: true, reloadRows: true })
  }
  removeLocalDraftRow(createDialogDraftSourceKey.value, createDialogDraftRecordId.value)
  resetCreateDialogAutosaveState()
  createDialogMode.value = 'create'
  createDialogPreferAddLayout.value = false
  editDialogRow.value = null
  editDialogRecordPayload.value = null
  createDialogInitialSectionKey.value = 'general'
  createDialogPrefillValues.value = {}
  createDialogFieldMeta.value = {}
  createDialogInitialArtifacts.value = []
}

function queueCreateDialogAutosave(snapshot) {
  queuedCreateDialogSnapshot = snapshot
  createDialogAutosavePending.value = true
  clearCreateDialogAutosaveTimer()
  createDialogAutosaveTimer = setTimeout(() => {
    void flushCreateDialogAutosave(queuedCreateDialogSnapshot)
  }, 280)
}

function clearCreateDialogAutosaveTimer() {
  if (createDialogAutosaveTimer) {
    clearTimeout(createDialogAutosaveTimer)
    createDialogAutosaveTimer = null
  }
}

function resetCreateDialogAutosaveState() {
  clearCreateDialogAutosaveTimer()
  createDialogDraftRecordId.value = ''
  createDialogDraftEntityName.value = ''
  createDialogDraftSourceKey.value = ''
  createDialogLastChangeSnapshot.value = null
  createDialogLastSavedSignature.value = ''
  createDialogAutosavePending.value = false
  queuedCreateDialogSnapshot = null
}

function buildCreateDialogAutosaveSignature(payload = {}, recordId = '', entityName = '') {
  return JSON.stringify({
    entityName: String(entityName || '').trim(),
    recordId: String(recordId || '').trim(),
    payload,
  })
}

function resolveCreateBranchTarget(payload = {}) {
  const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
  const branchEntry = branchTokenName
    ? getCreateBranchEntry(activeSourceKey.value, payload?.[branchTokenName] || payload?.kind)
    : null
  const targetSourceKey = String(branchEntry?.targetSourceKey || '').trim()
  return targetSourceKey
    ? {
        targetSourceKey,
        entityName: getFilePageRegistryEntry(targetSourceKey)?.entityName || '',
      }
    : null
}

function resolveCreateDialogEntityName(payload = {}) {
  if (createDialogDraftEntityName.value) return createDialogDraftEntityName.value
  const branchTarget = resolveCreateBranchTarget(payload)
  if (branchTarget?.entityName) return branchTarget.entityName
  return activeRegistryEntry.value?.entityName || ''
}

function resolveEditEntityName(row) {
  if (activeSourceKey.value !== 'opportunities') return activeRegistryEntry.value?.entityName || ''
  if (activeCreateBranchEntry.value?.targetSourceKey) {
    return getFilePageRegistryEntry(activeCreateBranchEntry.value.targetSourceKey)?.entityName || activeRegistryEntry.value?.entityName || ''
  }
  const opportunityKindToken =
    (LEVEL_3_FILE_REGISTRY_BY_KEY.opportunities || []).find(
      (token) => String(token?.tokenName || '').trim() === 'Opportunity_Kind',
    ) || null
  const kindValue =
    String(getCanonicalTokenValue(row?.raw || {}, opportunityKindToken || {}) || '')
      .trim()
      .toLowerCase()
  if (kindValue === 'fund') return 'Funds'
  if (kindValue === 'round') return 'Rounds'
  return activeRegistryEntry.value?.entityName || ''
}

async function createRecordFromPayload(payload = {}) {
  const sourceKey = activeSourceKey.value
  let result = null
  let entityName = activeRegistryEntry.value?.entityName || ''

  const branchTarget = resolveCreateBranchTarget(payload)
  if (branchTarget?.targetSourceKey) {
    result = await bridge.value?.[branchTarget.targetSourceKey]?.create?.(payload)
    entityName = branchTarget.entityName || entityName
  } else if (getCreateBranches(sourceKey).length) {
    const branchLabel = String(activeRegistryEntry.value?.createBranchLabel || 'Type').trim()
    throw new Error(`Choose ${branchLabel} before creating.`)
  } else {
    result = await bridge.value?.[sourceKey]?.create?.(payload)
  }

  if (!result?.id) {
    throw new Error('Create bridge is not available for this record type yet.')
  }

  createDialogDraftRecordId.value = String(result.id || '').trim()
  createDialogDraftEntityName.value = entityName
  createDialogMode.value = 'edit'
  editDialogRow.value = {
    recordId: createDialogDraftRecordId.value,
    raw: null,
  }

  await loadRows()
  return { recordId: createDialogDraftRecordId.value, entityName }
}

async function updateRecordFromPayload(recordId, entityName, payload = {}) {
  if (!recordId || !entityName) {
    throw new Error('This record cannot be edited from the shared shell yet.')
  }
  const tableName = getRuntimeTableNameForEntityName(entityName)

  const changes = buildUpdateChangesFromValues(payload, {
    recordId,
    entityName,
    tableName,
    idColumn: activeLoader.value?.recordIdField || 'id',
  })
  if (!changes.length) return

  await bridge.value?.records?.update?.({
    tableName,
    recordId,
    changes,
    actionLabel: 'shared_shell_dialog_session',
  })
}

async function applyVerificationChanges(recordId, entityName, verification = {}) {
  const changes = Array.isArray(verification?.changes) ? verification.changes : []
  if (!changes.length) return
  const tableName = getRuntimeTableNameForEntityName(entityName)

  for (const change of changes) {
    const targetTableName = String(change?.tableName || tableName || '').trim()
    const targetRecordId = String(change?.recordId || recordId || '').trim()
    const fieldName = String(change?.fieldName || '').trim()
    const state = String(change?.state || '').trim()
    const source = String(change?.source || 'dialog_field_review').trim()
    if (!targetTableName || !targetRecordId || !fieldName || !state) continue

    await bridge.value?.verification?.upsert?.({
      tableName: targetTableName,
      recordId: targetRecordId,
      fieldName,
      state,
      source,
      actionLabel: 'shared_shell_dialog_session',
    })
  }
}

async function flushCreateDialogAutosave(snapshot, { immediate = false, reloadRows = false } = {}) {
  if (!snapshot?.hasUserChanges) return
  if (createDialogMode.value === 'create') {
    createDialogAutosavePending.value = false
    return
  }
  if (!immediate && createDialogAutosaveInFlight) {
    queuedCreateDialogSnapshot = snapshot
    return
  }

  clearCreateDialogAutosaveTimer()
  const payload = buildCreatePayload(snapshot.values)
  const currentRecordId = createDialogDraftRecordId.value || editDialogRow.value?.recordId || ''
  const entityNameForValidation = resolveCreateDialogEntityName(payload)
  assertNoUnsupportedRelationshipWrites(snapshot.values, entityNameForValidation)
  const previewEntityName = entityNameForValidation || activeRegistryEntry.value?.entityName || ''
  const pendingChanges = currentRecordId
    ? buildUpdateChangesFromValues(snapshot.values || {}, {
        recordId: currentRecordId,
        entityName: previewEntityName,
        idColumn: activeLoader.value?.recordIdField || 'id',
      })
    : []
  if (!Object.keys(payload).length && !pendingChanges.length) {
    createDialogAutosavePending.value = false
    return
  }

  const currentEntityName = resolveCreateDialogEntityName(payload)
  const signature = buildCreateDialogAutosaveSignature(snapshot.values || {}, currentRecordId, currentEntityName)
  if (signature === createDialogLastSavedSignature.value) {
    createDialogAutosavePending.value = false
    return
  }

  if (createDialogAutosaveInFlight) {
    queuedCreateDialogSnapshot = snapshot
    return
  }

  createDialogAutosaveInFlight = true
  createDialogAutosavePending.value = true
  try {
    let recordId = currentRecordId
    let entityName = currentEntityName

    if (!recordId) {
      const createResult = await createRecordFromPayload(payload)
      recordId = createResult.recordId
      entityName = createResult.entityName
    }
    await updateRecordFromPayload(recordId, entityName, snapshot.values || {})
    await applyVerificationChanges(recordId, entityName, snapshot.verification || {})
    if (reloadRows) await loadRows()

    createDialogLastSavedSignature.value = buildCreateDialogAutosaveSignature(snapshot.values || {}, recordId, entityName)
  } catch (autosaveError) {
    $q.notify({ type: 'negative', message: autosaveError?.message || String(autosaveError) })
  } finally {
    createDialogAutosaveInFlight = false
    createDialogAutosavePending.value = false
    if (queuedCreateDialogSnapshot && queuedCreateDialogSnapshot !== snapshot) {
      const nextSnapshot = queuedCreateDialogSnapshot
      queuedCreateDialogSnapshot = null
      void flushCreateDialogAutosave(nextSnapshot, { immediate: true, reloadRows })
    } else {
      queuedCreateDialogSnapshot = null
    }
  }
}

function buildLocalDraftRowPayload(values = {}) {
  const payload = buildCreatePayload(values)
  return {
    id: createDialogDraftRecordId.value,
    ...payload,
  }
}

function upsertLocalDraftRow(sourceKey, draftId, values = {}) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  const normalizedDraftId = String(draftId || '').trim()
  if (!normalizedSourceKey || !normalizedDraftId) return

  const nextRow = buildLocalDraftRowPayload(values)
  localDraftRowsBySource.value = {
    ...localDraftRowsBySource.value,
    [normalizedSourceKey]: [
      nextRow,
      ...(Array.isArray(localDraftRowsBySource.value[normalizedSourceKey]) ? localDraftRowsBySource.value[normalizedSourceKey] : []).filter(
        (row) => String(row?.id || '').trim() !== normalizedDraftId,
      ),
    ],
  }
}

function removeLocalDraftRow(sourceKey, draftId) {
  const normalizedSourceKey = String(sourceKey || '').trim().toLowerCase()
  const normalizedDraftId = String(draftId || '').trim()
  if (!normalizedSourceKey || !normalizedDraftId) return
  const existingRows = Array.isArray(localDraftRowsBySource.value[normalizedSourceKey])
    ? localDraftRowsBySource.value[normalizedSourceKey]
    : []
  localDraftRowsBySource.value = {
    ...localDraftRowsBySource.value,
    [normalizedSourceKey]: existingRows.filter((row) => String(row?.id || '').trim() !== normalizedDraftId),
  }
}

function hasPersistableDraftContent(snapshot) {
  const values = snapshot?.values && typeof snapshot.values === 'object'
    ? snapshot.values
    : {}

  return Object.values(values).some((value) => {
    if (Array.isArray(value)) {
      return value.some((item) => String(item ?? '').trim().length > 0)
    }
    if (value == null) return false
    return String(value).trim().length > 0
  })
}

function updateLocalDraftRowFromSnapshot(snapshot) {
  if (createDialogMode.value !== 'create') return
  if (!hasPersistableDraftContent(snapshot)) {
    removeLocalDraftRow(createDialogDraftSourceKey.value, createDialogDraftRecordId.value)
    return
  }
  upsertLocalDraftRow(createDialogDraftSourceKey.value, createDialogDraftRecordId.value, snapshot?.values || createDialogInitialValues.value)
}

function buildCreatePayload(values = {}) {
  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  const payloadEntries = []

  allTokens.forEach((token) => {
    if (createDialogMode.value === 'create' && isAutomaticCreatorToken(token)) return
    const rawValue = values?.[token.key]
    const normalizedValue = normalizeCreateFieldValue(token, rawValue)
    if (normalizedValue == null) return
    const fieldName = getCanonicalTokenWriteFieldName(token)
    if (!fieldName) return
    payloadEntries.push([fieldName, normalizedValue])
  })

  const payload = Object.fromEntries(payloadEntries)
  const activeBranchEntry = activeCreateBranchEntry.value
  if (activeBranchEntry) {
    const branchTokenName = getCreateBranchTokenName(activeSourceKey.value)
    const branchToken = branchTokenName
      ? allTokens.find((token) => String(token?.tokenName || '').trim() === branchTokenName) || null
      : null
    const branchFieldName = branchToken ? getCanonicalTokenWriteFieldName(branchToken) : ''
    if (branchFieldName && !normalizeCreateFieldValue(branchToken, payload[branchFieldName])) {
      payload[branchFieldName] = resolveCreateDialogOptionValue(branchToken, activeBranchEntry.value)
    }
  }
  if (activeSourceKey.value === 'file-system') {
    const explicitSourceKey = String(payload.File_Source_Key || '').trim()
    if (!explicitSourceKey) {
      const fileName = String(payload.File_Name || '').trim()
      const derivedSourceKey = deriveFileSourceKeyFromName(fileName)
      if (derivedSourceKey) payload.File_Source_Key = derivedSourceKey
    }
  }

  return payload
}

function missingRequiredCreateTokens(values = {}) {
  return requiredCreateTokens.value.filter((token) => {
    const rawValue = values?.[token.key]
    const normalizedValue = normalizeCreateFieldValue(token, rawValue)
    if (Array.isArray(normalizedValue)) return normalizedValue.length === 0
    return normalizedValue == null
  })
}

function missingRequiredCreateTokenLabels(values = {}) {
  return missingRequiredCreateTokens(values)
    .map((token) => String(token?.label || token?.tokenName || '').trim())
    .filter(Boolean)
}

function tokenHasDirectWriteTarget(token) {
  return Boolean(String(token?.dbWriteField || '').trim())
}

function tokenHasRelationshipWriteContract(token, entityName = '') {
  return Boolean(getLdbRelationshipContractForToken(entityName, token?.tokenName))
}

function isUnsupportedRelationshipWriteToken(token, entityName = '') {
  const optionSource = String(token?.optionSource || '').trim()
  if (!['live_entity', 'live_entity_set', 'record_subset'].includes(optionSource)) return false
  if (tokenHasRelationshipWriteContract(token, entityName)) return false
  return !tokenHasDirectWriteTarget(token)
}

function getUnsupportedRelationshipWriteLabels(values = {}, entityName = '') {
  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]
  return allTokens
    .filter((token) => {
      if (isAutomaticCreatorToken(token)) return false
      if (isBranchSelectorToken(token)) return false
      if (!isUnsupportedRelationshipWriteToken(token, entityName)) return false
      const rawValue = values?.[token.key]
      const normalizedValue = normalizeCreateFieldValue(token, rawValue)
      if (normalizedValue == null) return false
      if (Array.isArray(normalizedValue)) return normalizedValue.length > 0
      return String(normalizedValue || '').trim().length > 0
    })
    .map((token) => String(token?.label || token?.tokenName || '').trim())
    .filter(Boolean)
}

function assertNoUnsupportedRelationshipWrites(values = {}, entityName = '') {
  const labels = getUnsupportedRelationshipWriteLabels(values, entityName)
  if (!labels.length) return
  throw new Error(`Relationship save contract is not wired yet for: ${labels.join(', ')}`)
}

function haveNormalizedDialogValuesChanged(token, nextValue, initialValue) {
  const normalizedNext = normalizeCreateFieldValue(token, nextValue)
  const normalizedInitial = normalizeCreateFieldValue(token, initialValue)

  if (Array.isArray(normalizedNext) || Array.isArray(normalizedInitial)) {
    const nextList = Array.isArray(normalizedNext) ? normalizedNext : []
    const initialList = Array.isArray(normalizedInitial) ? normalizedInitial : []
    if (nextList.length !== initialList.length) return true
    return nextList.some((value, index) => value !== initialList[index])
  }

  return (normalizedNext || null) !== (normalizedInitial || null)
}

function buildUpdateChangesFromValues(values = {}, { recordId = '', entityName = '', tableName = '', idColumn = 'id' } = {}) {
  if (!recordId || !entityName) return []
  const resolvedTableName = String(tableName || getRuntimeTableNameForEntityName(entityName) || entityName || '').trim()

  const allTokens = [...createPrimaryTokens.value, ...createSectionGroups.value.flatMap((section) => section.tokens)]

  return allTokens.flatMap((token) => {
    if (isBranchSelectorToken(token)) return []
    if (createDialogFieldMeta.value?.[token.key]?.locked) return []
    const rawValue = values?.[token.key]
    const initialValue = createDialogPrefillValues.value?.[token.key]
    if (!haveNormalizedDialogValuesChanged(token, rawValue, initialValue)) return []
    const normalizedValue = normalizeCreateFieldValue(token, rawValue)

    const relationshipContract = getLdbRelationshipContractForToken(entityName, token?.tokenName)
    if (relationshipContract) {
      const relationshipIds = Array.isArray(normalizedValue)
        ? normalizedValue.map((value) => String(value || '').trim()).filter(Boolean)
        : normalizedValue == null
          ? []
          : [String(normalizedValue || '').trim()].filter(Boolean)
      return [
        {
          change_kind: 'relationship',
          table_name: resolvedTableName,
          record_id: recordId,
          field_name: token.tokenName,
          relationship_token: token.tokenName,
          new_value: JSON.stringify(relationshipIds),
        },
      ]
    }

    if (isUnsupportedRelationshipWriteToken(token, entityName)) return []

    const writeTarget = getCanonicalTokenWriteTarget(token, resolvedTableName, idColumn)
    if (!writeTarget?.tableName || !writeTarget?.fieldName) return []

    return [
      {
        table_name: writeTarget.tableName,
        record_id: recordId,
        field_name: writeTarget.fieldName,
        id_column: writeTarget.idColumn,
        new_value:
          normalizedValue == null
            ? null
            : Array.isArray(normalizedValue)
              ? JSON.stringify(normalizedValue)
              : String(normalizedValue ?? ''),
      },
    ]
  })
}

async function resolveTrueArtifactsForRow(row) {
  const sourceKey = activeSourceKey.value
  if (sourceKey === 'companies') return await loadCompanyArtifactsForRow(row)
  if (sourceKey === 'contacts') return await loadContactArtifactsForRow(row)
  return buildFallbackArtifactsForRow(row)
}

function buildFallbackArtifactsForRow(row) {
  const artifactItems = Array.isArray(row?.relationshipItemsByType?.artifacts) ? row.relationshipItemsByType.artifacts : []
  return artifactItems
    .map((name, index) => ({
      id: `${row?.recordId || 'record'}:artifact:${index}`,
      name: String(name || '').trim(),
    }))
    .filter((artifact) => artifact.name)
}

async function loadCompanyArtifactsForRow(row) {
  const recordId = String(row?.recordId || '').trim()
  if (!recordId || !bridge.value?.artifacts?.list || !bridge.value?.db?.query) return buildFallbackArtifactsForRow(row)

  try {
    const [artifactResult, relatedArtifactIds] = await Promise.all([
      bridge.value.artifacts.list(),
      resolveRelatedArtifactIdsForShell({
        targetEntity: 'Companies',
        targetRecordId: recordId,
        sourceToken: 'Opportunity_Company',
      }),
    ])
    const artifacts = Array.isArray(artifactResult?.artifacts) ? artifactResult.artifacts : []
    const grouped = new Map()

    for (const artifact of artifacts) {
      const artifactId = String(artifact?.artifact_id || '').trim()
      if (!artifactId || !relatedArtifactIds.has(artifactId)) continue
      const groupKey = String(artifact?.original_artifact_id || '').trim() || artifactId
      if (!groupKey) continue
      const existing = grouped.get(groupKey)
      if (!existing) grouped.set(groupKey, artifact)
    }

    return Array.from(grouped.values())
      .map((artifact, index) => ({
        id: String(artifact?.original_artifact_id || artifact?.artifact_id || `artifact:${index}`).trim(),
        name:
          String(artifact?.title || '').trim() ||
          String(artifact?.fs_path || '').split('/').pop()?.trim() ||
          `Artifact ${index + 1}`,
      }))
      .filter((artifact) => artifact.name)
  } catch {
    return buildFallbackArtifactsForRow(row)
  }
}

async function loadContactArtifactsForRow(row) {
  const recordId = String(row?.recordId || '').trim()
  if (!recordId || !bridge.value?.artifacts?.list || !bridge.value?.db?.query) return buildFallbackArtifactsForRow(row)

  try {
    const [artifactResult, relatedArtifactIds] = await Promise.all([
      bridge.value.artifacts.list(),
      resolveRelatedArtifactIdsForShell({
        targetEntity: 'Contacts',
        targetRecordId: recordId,
        sourceToken: 'Opportunity_Contact',
      }),
    ])
    const artifacts = Array.isArray(artifactResult?.artifacts) ? artifactResult.artifacts : []
    const grouped = new Map()

    for (const artifact of artifacts) {
      const artifactId = String(artifact?.artifact_id || '').trim()
      if (!artifactId || !relatedArtifactIds.has(artifactId)) continue
      const groupKey = String(artifact?.original_artifact_id || '').trim() || artifactId
      if (!groupKey) continue
      const existing = grouped.get(groupKey)
      if (!existing) grouped.set(groupKey, artifact)
    }

    return Array.from(grouped.values())
      .map((artifact, index) => ({
        id: String(artifact?.original_artifact_id || artifact?.artifact_id || `artifact:${index}`).trim(),
        name:
          String(artifact?.title || '').trim() ||
          String(artifact?.fs_path || '').split('/').pop()?.trim() ||
          `Artifact ${index + 1}`,
      }))
      .filter((artifact) => artifact.name)
  } catch {
    return buildFallbackArtifactsForRow(row)
  }
}

async function resolveRelatedArtifactIdsForShell({ targetEntity = '', targetRecordId = '', sourceToken = '' } = {}) {
  const normalizedTargetEntity = String(targetEntity || '').trim()
  const normalizedTargetRecordId = String(targetRecordId || '').trim()
  const normalizedSourceToken = String(sourceToken || '').trim()
  if (!normalizedTargetEntity || !normalizedTargetRecordId || !normalizedSourceToken || !bridge.value?.db?.query) {
    return new Set()
  }

  const opportunityRows = await bridge.value.db.query(
    `
      SELECT DISTINCT source_record_id AS opportunity_id
      FROM LDB_Relationships
      WHERE source_entity = 'Opportunities'
        AND source_token = ?
        AND target_entity = ?
        AND target_record_id = ?
    `,
    [normalizedSourceToken, normalizedTargetEntity, normalizedTargetRecordId],
  )

  const opportunityIds = (Array.isArray(opportunityRows) ? opportunityRows : [])
    .map((row) => String(row?.opportunity_id || '').trim())
    .filter(Boolean)

  if (!opportunityIds.length) return new Set()

  const placeholders = opportunityIds.map(() => '?').join(', ')
  const artifactRows = await bridge.value.db.query(
    `
      SELECT DISTINCT target_record_id AS artifact_id
      FROM LDB_Relationships
      WHERE source_entity = 'Opportunities'
        AND source_token = 'Opportunity_Artifact'
        AND source_record_id IN (${placeholders})
    `,
    opportunityIds,
  )

  return new Set(
    (Array.isArray(artifactRows) ? artifactRows : [])
      .map((row) => String(row?.artifact_id || '').trim())
      .filter(Boolean),
  )
}

function normalizeCreateFieldValue(token, value) {
  const tokenType = String(token?.tokenType || '').trim()
  if (tokenType === 'select_multi') {
    const normalized = Array.isArray(value)
      ? value.map((item) => String(item || '').trim()).filter(Boolean)
      : String(value || '')
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
    return normalized.length ? normalized : null
  }

  const normalized = String(value || '').trim()
  return normalized ? normalized : null
}

function deriveFileSourceKeyFromName(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function setActiveFilterSection(sectionKey) {
  activeFilterSectionKey.value = sectionKey
  if (activeFilterTokenKey.value) {
    const tokenStillVisible = level3Tokens.value.some(
      (token) => token.key === activeFilterTokenKey.value && token.parentKey === sectionKey,
    )
    if (!tokenStillVisible) activeFilterTokenKey.value = ''
  }
}

function clearSectionFilter() {
  activeFilterSectionKey.value = ''
}

function setActiveFilterToken(tokenKey) {
  activeFilterTokenKey.value = tokenKey
  const token = level3Tokens.value.find((entry) => entry.key === tokenKey)
  if (token?.parentKey) activeFilterSectionKey.value = token.parentKey
}

function clearTokenFilter() {
  activeFilterTokenKey.value = ''
}

function toggleFilterToken(tokenKey, nextValue) {
  if (nextValue === false) {
    clearTokenFilter()
    clearSectionFilter()
    return
  }
  setActiveFilterToken(tokenKey)
}

function getSectionTokens(sectionKey) {
  return level3Tokens.value.filter((token) => token.parentKey === sectionKey)
}

function getFilterSectionTokenCount(sectionKey) {
  return getSectionTokens(sectionKey).length
}

function toggleExpandedFilterSection(sectionKey) {
  expandedFilterSectionKey.value = expandedFilterSectionKey.value === sectionKey ? '' : sectionKey
}

function applyFilterSelection(value) {
  const normalized = String(value || '').trim()
  if (!normalized || normalized === 'all') {
    clearTokenFilter()
    clearSectionFilter()
    expandedFilterSectionKey.value = ''
    return
  }

  if (normalized.startsWith('section:')) {
    clearTokenFilter()
    const sectionKey = normalized.slice('section:'.length)
    setActiveFilterSection(sectionKey)
    expandedFilterSectionKey.value = sectionKey
    return
  }

  if (normalized.startsWith('token:')) {
    const tokenKey = normalized.slice('token:'.length)
    setActiveFilterToken(tokenKey)
    const token = level3Tokens.value.find((entry) => entry.key === tokenKey)
    expandedFilterSectionKey.value = token?.parentKey || ''
  }
}

function handleFileFilterToggleSection(sectionKey) {
  if (isBbFileSource.value) {
    toggleExpandedBbFilterCategory(sectionKey)
    return
  }
  toggleExpandedFilterSection(sectionKey)
}

function handleFileFilterToggleItem(itemKey) {
  if (isBbFileSource.value) {
    applyBbFilterSelection(itemKey)
    return
  }
  applyFilterSelection(itemKey)
}

function handleFileFilterToggleItemCheckbox(payload) {
  const itemKey = String(payload?.key || '').trim()
  const nextValue = payload?.value
  if (!itemKey) return

  if (isBbFileSource.value) {
    if (itemKey.startsWith('category:')) {
      toggleBbCategoryFilter(itemKey.slice('category:'.length), nextValue)
      return
    }
    if (itemKey.startsWith('block:')) {
      toggleBbBlockFilter(itemKey.slice('block:'.length), nextValue)
    }
    return
  }

  if (itemKey.startsWith('token:')) {
    toggleFilterToken(itemKey.slice('token:'.length), nextValue)
  }
}

function setActiveBbCategory(categoryKey) {
  activeBbCategoryKey.value = categoryKey
  if (activeBbBlockKey.value) {
    const selectedStillVisible = bbFilterGroups.value.some(
      (group) => group.key === categoryKey && group.blocks.some((block) => block.key === activeBbBlockKey.value),
    )
    if (!selectedStillVisible) activeBbBlockKey.value = ''
  }
}

function clearBbCategoryFilter() {
  activeBbCategoryKey.value = ''
}

function setActiveBbBlock(blockKey) {
  activeBbBlockKey.value = blockKey
  const matchingGroup = bbFilterGroups.value.find((group) => group.blocks.some((block) => block.key === blockKey))
  if (matchingGroup) activeBbCategoryKey.value = matchingGroup.key
}

function clearBbBlockFilter() {
  activeBbBlockKey.value = ''
}

function clearActiveBbFilter() {
  clearBbBlockFilter()
  clearBbCategoryFilter()
  expandedBbFilterCategoryKey.value = ''
}

function toggleBbCategoryFilter(categoryKey, nextValue) {
  if (nextValue === false) {
    clearBbBlockFilter()
    clearBbCategoryFilter()
    return
  }
  setActiveBbCategory(categoryKey)
}

function toggleBbBlockFilter(blockKey, nextValue) {
  if (nextValue === false) {
    clearBbBlockFilter()
    return
  }
  setActiveBbBlock(blockKey)
}

function toggleExpandedBbFilterCategory(categoryKey) {
  expandedBbFilterCategoryKey.value = expandedBbFilterCategoryKey.value === categoryKey ? '' : categoryKey
}

function applyBbFilterSelection(value) {
  const normalized = String(value || '').trim()
  if (!normalized || normalized === 'all') {
    clearActiveBbFilter()
    return
  }

  if (normalized.startsWith('category:')) {
    clearBbBlockFilter()
    const categoryKey = normalized.slice('category:'.length)
    setActiveBbCategory(categoryKey)
    expandedBbFilterCategoryKey.value = categoryKey
    return
  }

  if (normalized.startsWith('block:')) {
    const blockKey = normalized.slice('block:'.length)
    setActiveBbBlock(blockKey)
    const matchingGroup = bbFilterGroups.value.find((group) => group.blocks.some((block) => block.key === blockKey))
    expandedBbFilterCategoryKey.value = matchingGroup?.key || ''
  }
}

function notifyShellAction(label) {
  $q.notify({
    type: 'info',
    message: `${label} is visible in the shared shell, but the explicit shell action contract is not defined yet.`,
  })
}

async function handleSelectedRowsShare() {
  await shareRecordSelection({
    rows: selectedRows.value,
    entityLabel: activeRegistryEntry.value?.label || 'Records',
    singularLabel: activeRegistryEntry.value?.singularLabel || 'record',
    pluralLabel: activeRegistryEntry.value?.label || 'records',
    getLabel: (row) => row?.titleValue || row?.recordId || '',
    notify: (payload) => $q.notify(payload),
  })
}

function handleSelectedRowsEdit() {
  const row = selectedRows.value[0] || null
  openEditRecordShell(row)
}

async function handleSelectedRowsDelete() {
  if (!canDeleteSelectedRows.value) return

  const deleteFn = bridge.value?.[activeContentSourceKey.value]?.delete
  if (typeof deleteFn !== 'function') return

  const selectedCount = selectedRows.value.length
  const entityLabel = String(activeRegistryEntry.value?.label || 'records').trim()

  $q.dialog({
    title: 'Delete Selected',
    message: `This will permanently delete ${selectedCount} selected ${entityLabel.toLowerCase()}.`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
      unelevated: true,
      noCaps: true,
    },
  }).onOk(async () => {
    loading.value = true
    error.value = ''

    try {
      for (const row of selectedRows.value) {
        await deleteFn(row.recordId)
      }

      selectedRowIds.value = []
      await loadRows()
      $q.notify({
        type: 'positive',
        message: `${selectedCount} ${entityLabel.toLowerCase()} deleted.`,
      })
    } catch (deleteError) {
      const message = String(deleteError?.message || '').trim() || 'Failed to delete selected records.'
      error.value = message
      $q.notify({
        type: 'negative',
        message,
      })
    } finally {
      loading.value = false
    }
  })
}

function getBbRowColumnValue(tokenName, row, bbGraphCounts, bbGraphLinks) {
  const normalizedTokenName = String(tokenName || '').trim()
  if (normalizedTokenName === '__bb_used_in_shells__') {
    return {
      value: stringifyValue(row?.Used_In_Shells || row?.raw?.Used_In_Shells),
      links: [],
    }
  }
  if (normalizedTokenName === '__bb_built_from__') {
    return {
      value: stringifyValue(row?.Built_From_BBs || row?.raw?.Built_From_BBs),
      links: [],
    }
  }
  if (normalizedTokenName === '__bb_convergence_rule__') {
    return {
      value: stringifyValue(row?.Convergence_Rule || row?.raw?.Convergence_Rule),
      links: [],
    }
  }
  if (normalizedTokenName === '__bb_parents__') {
    return {
      value: `${bbGraphCounts.parentCount}`,
      links: bbGraphLinks.parents,
    }
  }
  if (normalizedTokenName === '__bb_children__') {
    return {
      value: `${bbGraphCounts.childCount}`,
      links: bbGraphLinks.children,
    }
  }
  return {
    value: '',
    links: [],
  }
}

function isBbGraphLinkToken(tokenRow) {
  const tokenName = String(tokenRow?.tokenName || '').trim()
  return tokenName === '__bb_parents__' || tokenName === '__bb_children__'
}

</script>

<style scoped>
.test-shell-page,
.test-shell-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.test-shell-gap-banner {
  border: 1px solid rgba(249, 115, 22, 0.18);
}

.test-shell-filters-trigger {
  color: var(--ds-color-text-muted);
}

.test-shell-filters-menu {
  border-radius: 18px;
  overflow: hidden;
}

.test-shell-filters-panel {
  width: fit-content;
  max-width: min(720px, calc(100vw - 16px));
  padding: 6px;
  background: rgba(17, 17, 17, 0.96);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.28);
  backdrop-filter: blur(18px);
}

.test-shell-filters-panel__title {
  color: #ffffff;
  font-family: var(--font-title);
  font-size: 0.82rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  padding: 2px 2px 6px;
}

.test-shell-filters-panel__rows {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 8px;
}

.test-shell-filters-panel__rows--bb {
  display: grid;
  grid-auto-flow: row;
  justify-items: stretch;
  gap: 6px;
}

.test-shell-filter-group {
  display: grid;
  gap: 4px;
  flex: 0 1 auto;
  width: max-content;
  min-width: 0;
  max-width: 220px;
}

.test-shell-filters-panel--bb .test-shell-filter-group {
  width: 100%;
  max-width: none;
}

.test-shell-filter-child-row {
  width: max-content;
  min-width: 100%;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.test-shell-filter-child-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 2px 3px 2px;
}

.test-shell-filter-heading {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 6px;
  width: max-content;
  max-width: 100%;
  padding: 2px 2px 4px;
  background: transparent;
  border: 0;
  color: rgba(255, 255, 255, 0.86);
  cursor: pointer;
  font: inherit;
  text-align: left;
}

.test-shell-filter-heading__label,
.test-shell-filter-child-row__label {
  min-width: 0;
  font-family: var(--ds-font-family-body);
  font-size: 0.62rem;
  font-weight: var(--ds-font-weight-light);
  letter-spacing: 0.01em;
  white-space: normal;
  overflow-wrap: anywhere;
}

.test-shell-filter-heading__label {
  color: #ffffff;
}

.test-shell-filter-heading__meta {
  color: rgba(255, 255, 255, 0.38);
  font-size: 0.56rem;
}

.test-shell-filter-heading__chevron {
  color: rgba(255, 255, 255, 0.48);
}

.test-shell-filter-group__children {
  display: grid;
  gap: 5px;
}

.bb-shell-toolbar-filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 0 auto;
}

.bb-shell-toolbar-filter__chip {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border: 1px solid rgba(17, 17, 17, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #111111;
  cursor: pointer;
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  letter-spacing: -0.01em;
  line-height: 1;
  white-space: nowrap;
}

.bb-shell-toolbar-filter__chip-label {
  display: inline-flex;
  align-items: center;
  min-width: 0;
}

.bb-shell-toolbar-filter__clear {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: 0;
  background: transparent;
  color: rgba(17, 17, 17, 0.68);
  cursor: pointer;
}


.test-shell-filter-child-row--selected {
  color: #ffffff;
}

.test-shell-filter-child-row__checkbox {
  min-height: 12px;
}

.test-shell-filter-child-row__checkbox :deep(.q-checkbox__inner) {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.14) !important;
}

.test-shell-filter-child-row__checkbox :deep(.q-checkbox__inner--truthy) {
  color: rgba(255, 255, 255, 0.28) !important;
}

.test-shell-filter-child-row__checkbox :deep(.q-checkbox__bg) {
  background: transparent !important;
}

.test-shell-cards-grid {
  align-items: stretch;
}

.bb-shell-tiles-surface {
  display: grid;
  gap: 12px;
}

.bb-shell-tiles-toolbar {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.bb-shell-tiles-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.bb-shell-tiles-group__header {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  width: fit-content;
  padding: 0;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.bb-shell-tiles-group__title {
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1.04;
  letter-spacing: -0.02em;
  color: #111111;
}

.bb-shell-tiles-group__chevron {
  color: #111111;
  flex: 0 0 auto;
}

.bb-shell-tiles-toolbar__btn {
  min-height: 28px;
  padding: 0 10px;
  color: #111111;
  background: #fdfdfb;
  border: 1px solid #111111;
  border-radius: var(--ds-radius-micro);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  letter-spacing: 0.01em;
  cursor: pointer;
}

.bb-shell-tiles-grid :deep(.q-btn[aria-label='Copy record id']) {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  padding: 0;
}

.bb-shell-tiles-grid :deep(.q-btn[aria-label='Copy record id'] .q-icon) {
  font-size: 14px;
}

.bb-shell-tiles-grid__select-box {
  margin-top: -2px;
}

.bb-shell-tiles-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: flex-start;
  align-items: start;
}

.test-shell-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 246, 240, 0.98) 100%);
  border-radius: 14px;
  border-color: #e5e5e5;
  box-shadow: none;
}

.test-shell-card::before {
  position: absolute;
  inset: 0;
  content: '';
  background: radial-gradient(
    circle at var(--test-shell-card-blob-x) var(--test-shell-card-blob-y),
    var(--test-shell-card-blob-strong, rgba(38, 71, 255, 0.2)) 0%,
    var(--test-shell-card-blob-soft, rgba(38, 71, 255, 0.1)) calc(var(--test-shell-card-blob-size) * 0.46),
    var(--test-shell-card-blob-fade, rgba(38, 71, 255, 0.05)) calc(var(--test-shell-card-blob-size) * 0.7),
    transparent var(--test-shell-card-blob-size)
  );
  opacity: var(--test-shell-card-blob-opacity, 0);
  pointer-events: none;
  transition: opacity 180ms ease;
}

.test-shell-card > * {
  position: relative;
  z-index: 1;
}

.test-shell-card:hover {
  transform: translateY(-2px);
  box-shadow: none;
}

.test-shell-card__control-row {
  position: relative;
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 32px;
  padding: 0 14px;
  border-radius: 9px 9px 0 0;
  overflow: visible;
  background: transparent;
}

.test-shell-card__control-leading {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.test-shell-card__control-row :deep(.q-checkbox) {
  min-height: 22px;
}

.test-shell-card__control-row :deep(.q-checkbox__inner),
.test-shell-card__control-row :deep(.q-btn__content) {
  filter: drop-shadow(0 6px 12px rgba(17, 17, 17, 0.08));
}

.test-shell-card__control-row :deep(.q-checkbox__inner) {
  font-size: 22px;
}

.test-shell-card__control-settings,
.test-shell-card__control-eye {
  width: 24px;
  height: 24px;
  min-width: 24px;
  min-height: 24px;
  color: rgba(17, 17, 17, 0.82);
}

.test-shell-card__control-settings :deep(.q-icon),
.test-shell-card__control-eye :deep(.q-icon) {
  font-size: 16px;
}

.test-shell-card__control-actions {
  position: relative;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.test-shell-card--editable {
  cursor: pointer;
}

.test-shell-card-settings-menu {
  border-radius: 14px;
  overflow: hidden;
}

.test-shell-card-settings-panel {
  width: min(280px, calc(100vw - 24px));
  padding: 10px;
  background: rgba(248, 248, 246, 0.98);
  border: 1px solid rgba(17, 17, 17, 0.08);
  box-shadow: 0 16px 32px rgba(17, 17, 17, 0.12);
}

.test-shell-card-settings-panel__title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.84rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.test-shell-card-settings-panel__caption {
  margin-top: 4px;
  color: rgba(17, 17, 17, 0.62);
  font-family: var(--font-body);
  font-size: 0.69rem;
  font-weight: var(--font-weight-light);
  line-height: 1.35;
}

.test-shell-card-settings-panel__list {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.test-shell-card-settings-group {
  display: grid;
  gap: 4px;
}

.test-shell-card-settings-group--selected {
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(17, 17, 17, 0.08);
}

.test-shell-card-settings-group__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
  text-align: left;
}

.test-shell-card-settings-group__title {
  color: rgba(17, 17, 17, 0.62);
  font-family: var(--font-title);
  font-size: 0.72rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
}

.test-shell-card-settings-group__icon {
  color: rgba(17, 17, 17, 0.56);
}

.test-shell-card-settings-group__body {
  display: grid;
  gap: 4px;
}

.test-shell-card-settings-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  min-height: 28px;
  padding: 2px 4px;
  border-radius: 8px;
}

.test-shell-card-settings-row__checkbox {
  color: rgba(17, 17, 17, 0.72);
}

.test-shell-card-settings-row__copy {
  min-width: 0;
}

.test-shell-card-settings-row__label {
  color: #111111;
  font-family: var(--font-body);
  font-size: 0.76rem;
  font-weight: var(--font-weight-light);
  line-height: 1.2;
}

.test-shell-card-settings-row__actions {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.test-shell-card-settings-row__actions :deep(.q-btn) {
  color: rgba(17, 17, 17, 0.68);
}

.test-shell-card-settings-row__chevron {
  width: 12px;
  height: 12px;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.8;
  fill: none;
}

.test-shell-card__hero {
  padding: 0 0 4px;
}

.test-shell-card__hero-main {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 224px;
  height: 248px;
}

.test-shell-card__portrait {
  position: relative;
  width: 100%;
  min-width: 0;
  height: 100%;
  margin: 0;
  overflow: hidden;
  background: transparent;
  border-right: 0;
}

.test-shell-card__portrait-shell {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.test-shell-card__portrait-badge {
  display: flex;
  position: relative;
  z-index: 1;
  width: clamp(124px, 48%, 152px);
  height: clamp(124px, 48%, 152px);
  align-items: center;
  justify-content: center;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.2),
    0 18px 40px rgba(17, 17, 17, 0.16);
  font-family: var(--font-title);
  font-size: clamp(2.2rem, 4.2vw, 3rem);
  font-weight: var(--font-weight-black);
  letter-spacing: 0.02em;
  overflow: hidden;
}

.test-shell-card__hero-side {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  padding: 16px 18px 14px 14px;
  background: transparent;
  overflow: hidden;
}

.test-shell-card__hero-copy {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
}

.test-shell-card__slot-label,
.test-shell-card__summary-label,
.test-shell-card__summary-panel-title,
.test-shell-token-row__meta {
  color: var(--ds-color-text-muted);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.test-shell-card__title {
  min-width: 0;
  color: #0a0a0a;
  font-family: var(--font-title);
  font-size: clamp(1.3rem, 2vw, 1.6rem);
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.test-shell-card__bottom-stack,
.test-shell-card__detail-stack {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__subtitle {
  color: rgba(17, 17, 17, 0.7);
  font-family: var(--font-body);
  font-size: 0.82rem;
  font-weight: var(--font-weight-light);
  line-height: 1.35;
}

.test-shell-card__detail-stack {
  gap: 4px;
}

.test-shell-card__detail-row {
  display: flex;
  align-items: center;
  width: 100%;
}

.test-shell-card__inline-chip {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  width: 100%;
  min-height: 26px;
  padding: 0;
  color: #111;
  background: transparent;
  border: 0;
  border-radius: 0;
  font-family: var(--font-body);
  font-size: 0.74rem;
  font-weight: var(--font-weight-light);
}

.test-shell-card__inline-chip-value {
  color: #111111;
  font-weight: var(--font-weight-medium);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.test-shell-card__inline-chip-tooltip {
  color: rgba(17, 17, 17, 0.76);
  background: rgba(239, 239, 239, 0.92);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  padding: 4px 7px;
}

.test-shell-card__inline-chip--placeholder {
  color: #6f6f6f;
}

.test-shell-card__subtitle,
.test-shell-card__summary-meta,
.test-shell-card__summary-status,
.test-shell-token-row__value,
.test-shell-card__empty {
  color: var(--ds-color-text-secondary);
}

.test-shell-card__value--placeholder {
  color: var(--ds-color-text-muted);
  font-style: italic;
}

.test-shell-card__summary {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
  min-height: 208px;
  max-height: 208px;
  margin: 20px;
  padding: 0;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 9px;
  box-shadow: none;
}

.test-shell-card__summary-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
}

.test-shell-card__summary-toggle {
  border-radius: var(--ds-control-radius);
}

.test-shell-card__summary-toggle :deep(.q-btn-group) {
  background: transparent;
  box-shadow: none;
  border: 0;
}

.test-shell-card__summary-toggle {
  margin: 0 auto 0 14px;
}

.test-shell-card__summary-toggle :deep(.q-btn) {
  position: relative;
  min-height: 24px;
  min-width: 24px;
  width: 24px;
  padding: 0 3px;
  border: 1px solid transparent;
  border-radius: var(--ds-control-radius);
  background: transparent;
  font-size: 12px;
}

.test-shell-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:hover::after),
.test-shell-card__summary-toggle :deep(.q-btn.ec-card-kdb-option:focus-visible::after) {
  content: attr(data-tooltip);
  position: absolute;
  left: 0;
  bottom: calc(100% + 8px);
  transform: none;
  padding: 4px 7px;
  color: rgba(17, 17, 17, 0.72);
  background: rgba(239, 239, 239, 0.5);
  border-radius: 5px;
  font-family: var(--font-body);
  font-size: 9px;
  font-weight: var(--font-weight-light);
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 3;
}

.test-shell-card__summary-toggle :deep(.q-btn + .q-btn) {
  margin-left: 4px;
}

.test-shell-card__summary-toggle :deep(.q-icon) {
  font-size: 12px;
}

.test-shell-card__summary-panel {
  flex: 1;
  flex-direction: column;
  min-height: 0;
  padding: 14px 14px 12px;
  border-radius: 8px;
  background: var(--ds-color-surface-base);
  border: 1px solid rgba(17, 17, 17, 0.08);
}

.test-shell-card__summary-add-relation {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 24px;
  min-height: 24px;
  margin: 0 0 0 auto;
  padding: 0 2px;
  color: inherit;
  background: transparent;
  border: 0;
  box-shadow: none;
}

.test-shell-card__summary-add-relation :deep(.q-btn__content) {
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.test-shell-card__summary-add-relation-plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 19px;
  height: 19px;
  min-width: 19px;
  min-height: 19px;
  border-radius: 6px;
  color: #ffffff;
  background: #2647ff;
}

.test-shell-card__summary-add-relation-plus :deep(.q-icon) {
  font-size: 11px;
}

.test-shell-card__summary-add-relation-label {
  color: rgba(17, 17, 17, 0.86);
  font-family: var(--font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
  line-height: 0.95;
  letter-spacing: 0.01em;
}

.test-shell-card__summary-body {
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

.test-shell-card__summary-body-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__notes-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-card__note-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 36px;
  padding: 8px 10px;
  color: #111;
  background: #fff;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 12px;
  line-height: 1.4;
}

.test-shell-card__note-pill--placeholder {
  color: #6f6f6f;
}

.test-shell-card__note-pill-name {
  font-weight: var(--font-weight-medium);
}

.test-shell-card__note-pill-value {
  text-align: right;
}

@media (max-width: 900px) {
  .test-shell-card__summary-head,
  .test-shell-card__note-pill {
    flex-direction: column;
    align-items: flex-start;
  }

  .test-shell-card__hero-main {
    grid-template-columns: 1fr;
    height: auto;
  }
}

.test-shell-table-surface {
  display: grid;
  gap: 6px;
}

.test-shell-table-tabs {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.test-shell-table-tabs__left,
.test-shell-table-tabs__right {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.test-shell-table-tabs__right {
  justify-content: flex-end;
  margin-left: auto;
}

.test-shell-table-tabs__tab {
  min-height: 30px;
  padding: 0 11px;
  color: #111111;
  background: #fdfdfb;
  border: 1px solid #111111;
  border-radius: 2px;
  font-family: var(--font-title);
  font-size: 0.76rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
  letter-spacing: 0.01em;
  cursor: pointer;
}

.test-shell-table-tabs__tab--active {
  color: #ffffff;
  background: #111111;
  border-color: #111111;
}

.test-shell-table-scroll {
  overflow: auto;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.96);
}

.test-shell-table {
  width: max-content;
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 0;
}

.test-shell-table__head,
.test-shell-table__cell {
  min-width: 144px;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  overflow: hidden;
  box-sizing: border-box;
}

.test-shell-table__head {
  position: sticky;
  top: 0;
  z-index: 2;
  color: rgba(17, 17, 17, 0.68);
  padding-top: 8px;
  padding-bottom: 8px;
  background: #f3f4f6;
  font-family: var(--font-title);
  font-size: 0.7rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.04em;
  line-height: 0.96;
}

.test-shell-table__head-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  position: relative;
  padding-right: 10px;
}

.test-shell-table__resize-handle {
  position: absolute;
  top: 50%;
  right: -6px;
  transform: translateY(-50%);
  width: 14px;
  min-width: 14px;
  height: calc(100% + 8px);
  padding: 0;
  background: transparent;
  border: 0;
  border-right: 2px solid rgba(17, 17, 17, 0.18);
  cursor: col-resize;
  z-index: 6;
  touch-action: none;
}

.test-shell-table__resize-handle:hover,
.test-shell-table__resize-handle:focus-visible {
  border-right-color: rgba(17, 17, 17, 0.46);
  outline: none;
}

.test-shell-table__head--name,
.test-shell-table__cell--name {
  background: rgba(255, 255, 255, 0.98);
}

.test-shell-table__head--control,
.test-shell-table__cell--control {
  width: 22px;
  min-width: 22px;
  max-width: 22px;
  padding: 6px 0;
  text-align: center;
  background: rgba(255, 255, 255, 0.98);
}

.test-shell-table__head--control {
  background: #eef0f2;
}

.test-shell-table__head--name {
  background: #eef0f2;
}

.test-shell-table__cell {
  color: var(--ds-color-text-secondary);
  font-size: 12px;
  line-height: 1.35;
  vertical-align: top;
}

.test-shell-table__name-row {
  display: flex;
  align-items: center;
  gap: 0;
  min-width: 0;
  width: 100%;
}

.test-shell-table__cell--editable {
  cursor: pointer;
}

.test-shell-table__cell--direct {
  color: #2647ff;
}

.test-shell-table__inline-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.test-shell-table__inline-input {
  width: 100%;
}

.test-shell-table__inline-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
}

.test-shell-table__eye {
  justify-self: center;
}

.test-shell-table__kdb-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.test-shell-table__kdb-item--linkable {
  cursor: pointer;
}

.test-shell-table__kdb-item--linkable:hover {
  border-color: rgba(31, 122, 61, 0.34);
  background: rgba(31, 122, 61, 0.1);
}

.test-shell-table__bb-links {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.test-shell-table__bb-link {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  color: #111111;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.14);
  border-radius: 999px;
  font-family: var(--font-title);
  font-size: 0.68rem;
  font-weight: var(--font-weight-black);
  letter-spacing: 0.03em;
  line-height: 1;
  cursor: pointer;
  white-space: nowrap;
}

.test-shell-table__bb-link:hover {
  border-color: rgba(15, 23, 42, 0.26);
  background: rgba(248, 250, 252, 1);
}

.test-shell-table__kdb-item {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  padding: 4px 7px;
  color: #1f7a3d;
  background: rgba(31, 122, 61, 0.06);
  border: 1px solid rgba(31, 122, 61, 0.18);
  border-radius: 3px;
}

.test-shell-table__kdb-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  flex: 0 0 14px;
  color: rgba(17, 17, 17, 0.7);
}

.test-shell-table__kdb-text {
  min-width: 0;
  color: #111111;
  font-family: var(--ds-font-family-body);
  font-size: 10px;
  font-weight: var(--ds-font-weight-light);
  line-height: 1.2;
  overflow-wrap: anywhere;
}

.test-shell-table__name {
  color: var(--ds-color-text-primary);
  font-family: var(--ds-font-family-body);
  font-size: 12px;
  font-weight: var(--font-weight-black);
  line-height: 1.35;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  justify-self: start;
}

.test-shell-table tbody tr:last-child .test-shell-table__cell {
  border-bottom: 0;
}

.test-shell-table-row {
  padding: 14px 16px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
}

.test-shell-table-row__title {
  color: var(--ds-color-text-primary);
  font-family: var(--font-title);
  font-size: 1rem;
  font-weight: var(--font-weight-black);
  line-height: 1;
}

.test-shell-table-row__meta {
  margin-top: 6px;
  color: var(--ds-color-text-secondary);
  font-size: 0.78rem;
}

.event-shell__panel {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
}

.event-shell__panel-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.event-shell__panel-title {
  color: #111111;
  font-family: var(--font-title);
  font-size: 0.94rem;
  font-weight: var(--font-weight-black);
  line-height: 0.96;
}

.event-shell__panel-meta,
.event-shell__card-meta {
  color: rgba(17, 17, 17, 0.54);
  font-size: 0.72rem;
}

.event-shell__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.event-shell__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.event-shell__card,
.event-shell__list-row {
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 18px;
  background: #ffffff;
  padding: 14px;
}

.event-shell__card-top,
.event-shell__list-row-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.event-shell__list-row-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.event-shell__card-title {
  font-weight: 700;
  color: #111111;
  line-height: 1.2;
}

.event-shell__card-open {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: #111111;
  cursor: pointer;
}

.event-shell__card-open:hover {
  background: rgba(17, 17, 17, 0.06);
}

.event-shell__field-grid {
  display: grid;
  gap: 10px;
  margin-top: 12px;
}

.event-shell__field-grid--list {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.event-shell__field-card {
  padding: 10px 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 10px;
  background: rgba(17, 17, 17, 0.02);
}

.event-shell__field-label {
  color: #6f6f6f;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.event-shell__field-value {
  margin-top: 6px;
  color: #1c1c1c;
  font-size: 0.92rem;
  line-height: 1.3;
}

.event-shell__field-value--empty {
  color: #8a8a8a;
}

.event-shell__chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.event-shell__chip {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(17, 17, 17, 0.06);
  color: #1c1c1c;
  font-size: 0.82rem;
}

.event-shell__empty {
  padding: 18px;
  border: 1px dashed rgba(17, 17, 17, 0.16);
  border-radius: 18px;
  color: #777777;
  background: rgba(255, 255, 255, 0.72);
}

.test-shell-validation-groups {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.test-shell-validation-group {
  padding: 12px;
  border: 1px solid rgba(17, 17, 17, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
}

.test-shell-validation-group__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.test-shell-validation-group__title {
  font-size: 13px;
  font-weight: 600;
  color: #1c1c1c;
}

.test-shell-validation-group__meta {
  font-size: 11px;
  color: #6f6f6f;
}

.test-shell-validation-group__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.test-shell-validation-group__row {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.test-shell-validation-group__row-key {
  font-size: 11px;
  font-weight: 600;
  color: #1c1c1c;
}

.test-shell-validation-group__row-text {
  font-size: 11px;
  line-height: 1.35;
  color: #5f5f5f;
}

.test-shell-validation-group__row-action {
  font-size: 11px;
  line-height: 1.35;
  color: #1c1c1c;
}

.hero-document-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.hero-document-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.hero-document-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #1c1c1c;
}

.hero-document-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.hero-document-dialog__status {
  font-size: 13px;
  color: #5f5f5f;
}

.hero-document-dialog__status--error {
  color: #9f1f1f;
}

.hero-document-dialog__content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: var(--ds-font-mono, 'Courier New', monospace);
  font-size: 12px;
  line-height: 1.5;
  color: #1c1c1c;
}

@media (max-width: 900px) {
  .test-shell-table-tabs {
    flex-direction: column;
    align-items: stretch;
  }

  .test-shell-table-tabs__right {
    margin-left: 0;
    justify-content: flex-start;
  }

  .test-shell-table__head--name,
  .test-shell-table__cell--name {
    min-width: 164px;
    left: 56px;
  }

  .test-shell-table__head--control,
  .test-shell-table__cell--control {
    min-width: 28px;
    width: 28px;
  }

  .test-shell-table__head--control:nth-child(2),
  .test-shell-table__cell--control:nth-child(2) {
    left: 28px;
  }

  .test-shell-table__kdb-list {
    grid-template-columns: 1fr;
  }
}
</style>
