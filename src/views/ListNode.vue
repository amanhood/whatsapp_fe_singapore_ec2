<script setup>
import { ref } from "vue";
import { Handle } from "@vue-flow/core";
import 'vue-select/dist/vue-select.css';


const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
  color: {
    type: String,
    default: "#c9d2e3",
  },
});


const emit = defineEmits(['open-edit-list', 'delete-list'])

function openEditModal() {
  emit('open-edit-list', props.data);
}

function handleDelete() {
  emit('delete-list', props.data);
}

const expandedSections = ref(new Set());


function toggleSection(id,rows) {
  if (expandedSections.value.has(id)) {
    expandedSections.value.delete(id);
  } else {
    expandedSections.value.add(id);
  }
}

</script>

<style scoped>
.custom-node {
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  width: 200px;
  font-family: Arial, sans-serif;
}

.node-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  border-bottom: 1px solid #ddd;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  font-weight: bold;
  color: #fff;
}

.node-title {
  font-size: 14px;
}

.node-menu {
  cursor: pointer;
}

.node-content {
  padding: 10px;
  font-size: 12px;
}

.node-buttons {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.node-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 6px 12px;
  background-color: #f9f9f9;
  font-size: 12px;
  cursor: pointer;
  position: relative;
  margin-bottom:5px;
}

.node-button:hover {
  background-color: #f1f1f1;
}

.node-button span {
  pointer-events: none;
}

.button-handle {
  position: absolute;
  width: 10px;
  height: 10px;
  background-color: #007bff;
  border-radius: 50%;
}

.button-handle-target {
  left: -15px; /* Position to the left */
  top: 50%;
  transform: translateY(-50%);
}

.button-handle-source {
  right: -15px; /* Position to the right */
  top: 50%;
  transform: translateY(-50%);
}

.section-rows {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-left: 10px; /* slight indent */
  margin-bottom: 10px;
}

.node-buttons {
  padding-top: 10px;
  padding-bottom: 10px;
}

/* New container to add left/right padding */
.node-inner-padding {
  padding: 0 10px; /* LEFT and RIGHT padding */
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.row-button {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 6px 12px;
  background-color: #eef2f7;
  font-size: 12px;
  position: relative;
}

</style>

<template>
  
  <div class="custom-node">
    <div class="node-header" :style="{ backgroundColor: color }">
      <span class="node-title">{{ data.title }}</span>
      <div class="btn-group">
        <button type="button" class="btn btn-default btn-sm" data-bs-toggle="modal" data-bs-target="#modalLg4" @click="openEditModal">edit</button>
        <button type="button" class="btn btn-default btn-sm" @click="handleDelete" v-if="data.is_parent != 'yes'">delete</button>
      </div>
    </div>

    <div class="node-content">
      <p>{{ data.header }}</p>
      <p>{{ data.body }}</p>
      <p>{{ data.footer }}</p>
    </div>

    <div class="node-buttons">
      <div class="node-inner-padding">
        <!-- Sections + rows here -->
        <div v-for="(section, index) in data.sections" :key="section.id">
          <!-- Section -->
          <div class="node-button" @click="toggleSection(section.id)">
            <span>{{ section.title }}</span>
            
            <Handle
              :id="`section-${section.id}-target`"
              position="left"
              class="button-handle button-handle-target"
            />
          </div>

          <!-- Rows -->
          <div v-if="expandedSections.has(section.id)" class="section-rows">
            <div
              v-for="(row, rIndex) in section.rows"
              :key="`${section.id}-row-${rIndex}`"
              class="row-button"
            >
              <span>{{ row.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>