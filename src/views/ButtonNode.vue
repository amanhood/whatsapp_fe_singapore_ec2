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
    default: "#FF9500",
  },
});


const emit = defineEmits(['open-edit-node', 'delete-node'])

function openEditModal() {
  emit('open-edit-node', props.data);
}

function handleDelete() {
  emit('delete-node', props.data);
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
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  background-color: #f9f9f9;
  position: relative;
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


</style>

<template>
    <div class="custom-node">
      <div class="node-header" :style="{ backgroundColor: color }">
        <span class="node-title">{{ data.title }}</span>
        <div class="btn-group">
          <button type="button" class="btn btn-default btn-sm" data-bs-toggle="modal" data-bs-target="#modalLg3" @click="openEditModal">edit</button>
          <button type="button" class="btn btn-default btn-sm" @click="handleDelete" v-if="data.is_parent != 'yes'">delete</button>
        </div>
      </div>
      
      
      <div class="node-content">
        <p>{{ data.message }}</p>
      </div>
      <div class="node-buttons">
        <div v-for="(button, index) in data.options" :key="index" class="node-button">
          <span>{{ button.label }}</span>
          <!-- <Handle
            :id="`button-${index}`"
            position="right"
            class="button-handle"
          /> -->
            <Handle
              :id="`button-${button.id}-source`"
              position="right"
              class="button-handle"
            />
            <Handle
              :id="`button-${button.id}-target`"
              position="left"
              class="button-handle"
            />
            <!-- <Handle
              type="target"
              position="right"
              class="button-handle"
            /> -->
            

        </div>
      </div>
    </div>
  </template>