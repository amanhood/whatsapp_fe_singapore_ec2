<script setup>
import { Handle } from "@vue-flow/core";

defineProps({
  data: {
    type: Object,
    required: true,
  },
  // Elegant default: Royal Navy (you can still override via prop)
  color: {
    type: String,
    default: "#89D6FB",
  },
});
</script>

<style scoped>
:root {
  --text: #1f2937;
  --muted: #4b5563;
  --ivory: #F6F5F0;     /* warm white for text on dark */
  --ring: rgba(0,0,0,.06);
}

/* ===== Card ===== */
.custom-node.message-node {
  width: 380px;                     /* bigger */
  border-radius: 16px;              /* grander shape */
  background: #fff;
  border: 1px solid #e5e7eb;        /* refined border */
  box-shadow:
    0 2px 6px rgba(0,0,0,.05),
    0 12px 24px rgba(0,0,0,.08);    /* soft premium depth */
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
  color: var(--text);
}

/* ===== Header ===== */
.node-header {
  padding: 16px 18px;
  border-bottom: 1px solid #e5e7eb33;  /* subtle divider on dark */
  font-weight: 700;
  letter-spacing: .2px;
  color: #fff;
  /* gradient derived from the base color (with a darker stop) */
  background: #89D6FB
}

.node-title {
  display: block;
  font-size: 16px;
  line-height: 1.2;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  color: inherit;
}

/* ===== Content ===== */
.node-content {
  padding: 16px 18px;
  font-size: 14px;                 /* larger, readable */
  line-height: 1.6;
  color: var(--muted);
}
.node-content :deep(p) {
  margin: 0;
}

.node-button:hover{
  background:#f3f4f6;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
  transform: translateY(-1px);
}

/* ===== Handle (grand accent) ===== */
:deep(.vue-flow__handle) {
  /* ensure our custom handle styles win */
}
.handle-gold {
  position: absolute;
  width: 14px;                     /* larger touch target */
  height: 14px;
  background-color: #CBA35C;       /* champagne gold */
  border: 2px solid #fff;          /* crisp edge on any bg */
  border-radius: 50%;
  box-shadow: 0 0 0 3px var(--ring);
  transition: transform .08s ease;
}
.handle-gold:hover {
  transform: scale(1.08);
}
</style>

<template>
  <!-- expose color to CSS as --base so the header gradient can use it -->
  <div class="custom-node message-node" :style="{ '--base': color }">
    <div class="node-header">
      <span class="node-title">{{ (data && (data.title || data.name)) || 'Message' }}</span>
    </div>

    <div class="node-content">
      <!-- supports rich text -->
      <p v-html="data?.message"></p>
    </div>

    <!-- Keep your target handle centered on the left, but styled luxuriously -->
    <Handle
      type="target"
      position="left"
      id="message-target"
      class="handle-gold"
      :style="{ top: '50%', transform: 'translateY(-50%)' }"
    />

    <!-- (Optional) If you want an outgoing connection on the right, uncomment:
    <Handle
      type="source"
      position="right"
      id="message-source"
      class="handle-gold"
      :style="{ top: '50%', transform: 'translateY(-50%)' }"
    />
    -->
  </div>
</template>