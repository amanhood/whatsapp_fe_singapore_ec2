<script setup>
import { ref } from "vue";
import { Handle } from "@vue-flow/core";
import 'vue-select/dist/vue-select.css';

const props = defineProps({
  data: { type: Object, required: true },
  color: { type: String, default: "#0B1F3A" }, // used as the primary hue
});

const emit = defineEmits(['open-edit-node', 'delete-node']);

function openEditModal() {
  emit('open-edit-node', props.data);
}
function handleDelete() {
  emit('delete-node', props.data);
}
</script>

<style scoped>
:root {
  --ring: rgba(0,0,0,.06);
  --text: #1f2937;
  --muted: #6b7280;
}

/* ===== Card ===== */
.custom-node {
  width: 380px;                 /* bigger */
  border-radius: 16px;          /* more rounded */
  background: #fff;
  border: 1px solid #e5e7eb;    /* subtle border */
  box-shadow:
    0 2px 6px rgba(0,0,0,.05),
    0 12px 24px rgba(0,0,0,.06); /* soft depth */
  overflow: hidden;             /* clip header radius */
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
  color: var(--text);
}

/* ===== Header ===== */
.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 14px 14px;
  color: #fff;
  font-weight: 700;
  letter-spacing: .2px;
  /* gradient based on provided color (fallback handled inline via CSS var) */
  background: linear-gradient(135deg, var(--hdr-1), var(--hdr-2));
}
.node-title {
  font-size: 15px;
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  max-width: 210px;
}
.btn-group .btn {
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid rgba(255,255,255,.35);
  background: rgba(255,255,255,.18);
  color: #fff;
  backdrop-filter: blur(4px);
}
.btn-group .btn:hover {
  background: rgba(255,255,255,.25);
}

/* ===== Content ===== */
.node-content {
  padding: 14px;
  font-size: 13px;              /* slightly larger */
  line-height: 1.5;
  color: var(--muted);
  border-bottom: 1px dashed #e5e7eb;
}

/* ===== Buttons area ===== */
.node-buttons {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 220px;           /* scroll if many buttons */
  overflow: auto;
}
.node-buttons::-webkit-scrollbar {
  width: 8px;
}
.node-buttons::-webkit-scrollbar-thumb {
  background: #e5e7eb;
  border-radius: 8px;
}

/* Each button row */
.node-button {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f9fafb;
  border: 1px solid #eef0f3;
  transition: transform .08s ease, box-shadow .15s ease, background .15s ease;
  cursor: default;
}
.node-button:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 8px rgba(0,0,0,.06);
  transform: translateY(-1px);
}
.node-button span {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

/* Optional “type” badge on the right (if you want to render it later) */
.badge {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  border: 1px solid #e0e7ff;
}

/* ===== Handles ===== */
.button-handle {
  position: absolute;
  width: 14px;                 /* bigger */
  height: 14px;
  background-color: #2563eb;   /* vivid, visible */
  border: 2px solid #fff;      /* ring */
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--ring);
  transition: transform .08s ease;
}
.button-handle:hover {
  transform: scale(1.08);
}
.button-handle-target {
  left: -18px;                 /* bigger offset for larger handle */
  top: 50%;
  transform: translateY(-50%);
}
.button-handle-source {
  right: -18px;
  top: 50%;
  transform: translateY(-50%);
}

/* ===== Dynamic header hues (from prop.color) ===== */
.custom-node {
  /* create two shades from the base color using simple overlays */
  --hdr-1: color-mix(in oklab, var(--base, #FF9500) 88%, white);
  --hdr-2: color-mix(in oklab, var(--base, #FF9500) 68%, black);
}
</style>

<template>
  <!-- we inject the base color into a CSS var so the gradient can use it -->
  <div class="custom-node" :style="{ '--base': color }">
    <div class="node-header">
      <span class="node-title" :title="data.title">{{ data.title }}</span>
      <div class="btn-group">
        <button
          type="button"
          class="btn btn-default btn-sm"
          data-bs-toggle="modal"
          data-bs-target="#modalLg3"
          @click="openEditModal"
        >
          Edit
        </button>
        <button
          type="button"
          class="btn btn-default btn-sm"
          @click="handleDelete"
          v-if="data.is_parent !== 'yes'"
        >
          Delete
        </button>
      </div>
    </div>

    <div class="node-content">
      <p>{{ data.message }}</p>
    </div>

    <div class="node-buttons">
      <div
        v-for="(button, index) in data.options"
        :key="index"
        class="node-button"
      >
        <span>{{ button.label }}</span>

        <!-- Example optional badge (uncomment if you want) -->
        <!-- <span class="badge">{{ button.type || 'Action' }}</span> -->

        <!-- Left (target) & Right (source) handles -->
        <Handle
          :id="`button-${button.id}-target`"
          type="target"
          position="left"
          class="button-handle button-handle-target"
        />
        <Handle
          :id="`button-${button.id}-source`"
          type="source"
          position="right"
          class="button-handle button-handle-source"
        />
      </div>
    </div>
  </div>
</template>