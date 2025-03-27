<script setup>
import { Handle } from "@vue-flow/core";

defineProps({
  data: {
    type: Object,
    required: true,
  },
  color: {
    type: String,
    default: "#e6180d", // Light red for "MessageNode"
  },
});
</script>

<style scoped>
.custom-node.message-node {
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #fff;
  width: 200px;
  font-family: Arial, sans-serif;
}

.node-header {
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

.node-content {
  padding: 10px;
  font-size: 12px;
  color: #333;
}
</style>

<template>
    <div class="custom-node message-node">
      <div class="node-header" :style="{ backgroundColor: color }">
        <span class="node-title">{{ data.title }}</span>
      </div>
      <div class="node-content">
        <p v-html="data.message"></p>
      </div>
      <Handle
        type="target"
        position="left"
        id="message-source"
        style="top: 50%; transform: translateY(-50%)"
      />
    </div>
</template>
  
 