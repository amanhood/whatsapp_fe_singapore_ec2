<script setup>
import { ref } from "vue";
import { Handle } from "@vue-flow/core";
import 'vue-select/dist/vue-select.css';


defineProps({
  data: {
    type: Object,
    required: true,
  },
  color: {
    type: String,
    default: "#FF9500",
  },
});


const dropdownVisible = ref(false);
const selectedOption = ref("");
let select_options = [
  {'key':'edit','value':'Edit'}
]

function toggleDropdown() {
  dropdownVisible.value = !dropdownVisible.value;
  console.log(dropdownVisible.value)
}

function handleOptionChange() {
  if (selectedOption.value.key === "edit") {
    alert("Edit selected");
    // Handle edit logic
  } 
  dropdownVisible.value = false; // Close dropdown after selection
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

.three-dots {
  cursor: pointer;
  position: relative;
  z-index: 2; /* Ensure clickable */
}

.dropdown-menu {
  position: absolute;
  right: 10px;
  top: 30px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  z-index: 10; /* Ensure it appears above other elements */
  padding: 5px;
  width: 150px;
  display: block; /* Ensure it's visible */
}

.dropdown-menu select {
  border: none;
  padding: 5px;
  width: 100%;
  background: transparent;
  cursor: pointer;
}



</style>

<template>
    <div class="custom-node">
      <div class="node-header" :style="{ backgroundColor: color }">
        <span class="node-title">{{ data.title }}</span>
        <span class="three-dots" @click="toggleDropdown">
          <span class="material-icons">more_vert</span>
        </span>
      </div>
      <!-- Dropdown Menu -->
      
      <div
        v-show="dropdownVisible"
        class="dropdown-menu"
        @click.stop
      >
        <v-select v-model="selectedOption" :options="select_options" label="value" @update:modelValue="handleOptionChange" placeholder="Select an option"></v-select>
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