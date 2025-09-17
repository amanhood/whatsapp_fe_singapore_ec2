<script setup>
import { ref } from "vue";
import { Handle } from "@vue-flow/core";
import 'vue-select/dist/vue-select.css';

const props = defineProps({
  data: { type: Object, required: true },
  color: { type: String, default: "#F78CA0" }, // kept for backward-compat (unused for gradient)
});

const emit = defineEmits(['open-edit-list', 'delete-list']);

function openEditModal() { emit('open-edit-list', props.data); }
function handleDelete() { emit('delete-list', props.data); }

const expandedSections = ref(new Set());
function toggleSection(id) {
  if (expandedSections.value.has(id)) expandedSections.value.delete(id);
  else expandedSections.value.add(id);
}
</script>

<style scoped>
:root{
  --text:#1f2937;
  --muted:#4b5563;
  --ring:rgba(0,0,0,.06);
  --gold:#CBA35C;    /* champagne gold */
  --ivory:#ffffff;   /* header text */
}

/* ===== Card ===== */
.custom-node{
  width: 380px;                     /* bigger */
  border-radius: 16px;              /* elegant */
  background:#fff;
  border:1px solid #e5e7eb;
  box-shadow:
    0 2px 6px rgba(0,0,0,.05),
    0 12px 24px rgba(0,0,0,.08);
  overflow: hidden;
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Arial;
  color: var(--text);
}

/* ===== Header (pink → light blue) ===== */
.node-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:8px;
  padding:16px 18px;
  border-bottom:1px solid #e5e7eb33;
  font-weight:700;
  letter-spacing:.2px;
  color: #fff;           /* white header text */
  background: #F78CA0
}


.node-title{
  font-size:16px;
  line-height:1.2;
  white-space:nowrap;
  text-overflow:ellipsis;
  overflow:hidden;
}

/* header buttons blend nicely on gradient */
.btn-group .btn{
  border-radius:10px;
  padding:6px 10px;
  font-size:12px;
  border:1px solid rgba(255,255,255,.35);
  background:rgba(255,255,255,.18);
  color:#fff;
  backdrop-filter: blur(4px);
}
.btn-group .btn:hover{ background:rgba(255,255,255,.25); }

/* ===== Content ===== */
.node-content{
  padding:16px 18px;
  font-size:14px;
  line-height:1.6;
  color:var(--muted);
  border-bottom:1px dashed #e5e7eb;
}

/* ===== Sections & Rows ===== */
.node-buttons{
  padding:12px 0; /* top/bottom only; inner handles spacing separately */
  max-height: 260px;               /* scroll if long */
  overflow:auto;
}
.node-buttons::-webkit-scrollbar{ width:8px; }
.node-buttons::-webkit-scrollbar-thumb{ background:#e5e7eb; border-radius:8px; }

.node-inner-padding{
  padding:0 14px;                  /* L/R padding */
  display:flex;
  flex-direction:column;
  gap:10px;
}

/* section row (collapsible header) */
.node-button{
  position:relative;
  display:grid;
  grid-template-columns: 1fr auto;
  align-items:center;
  gap:8px;
  padding:10px 12px;
  border-radius:12px;
  background:#f9fafb;
  border:1px solid #eef0f3;
  transition: transform .08s ease, box-shadow .15s ease, background .15s ease;
  cursor:pointer;
}
.node-button:hover{
  background:#f3f4f6;
  box-shadow:0 2px 8px rgba(0,0,0,.06);
  transform: translateY(-1px);
}
.node-button span{ font-size:13px; font-weight:600; color:#374151; }

/* child rows */
.section-rows{
  display:flex;
  flex-direction:column;
  gap:8px;
  padding-left:12px;
  margin-top:6px;
  margin-bottom:6px;
}
.row-button{
  display:flex;
  align-items:center;
  justify-content:space-between;
  border:1px solid #e6eaf2;
  border-radius:10px;
  padding:8px 12px;
  background:#f4f7fb;
  font-size:13px;
}
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
}

</style>

<template>
  <!-- You can override the gradient pair on a per-node basis like:
       :style="{ '--gradA':'#F4A6C2', '--gradB':'#7CC6F9' }" -->
  <div class="custom-node">
    <div class="node-header">
      <span class="node-title">{{ data.title }}</span>
      <div class="btn-group">
        <button type="button" class="btn btn-default btn-sm"
                data-bs-toggle="modal" data-bs-target="#modalLg4"
                @click="openEditModal">edit</button>
        <button type="button" class="btn btn-default btn-sm"
                @click="handleDelete" v-if="data.is_parent != 'yes'">delete</button>
      </div>
    </div>

    <div class="node-content">
      <p>{{ data.header }}</p>
      <p>{{ data.body }}</p>
      <p>{{ data.footer }}</p>
    </div>

    <div class="node-buttons">
      <div class="node-inner-padding">
        <div v-for="(section, index) in data.sections" :key="section.id">
          <!-- Section header -->
          <div class="node-button" @click="toggleSection(section.id)">
            <span>{{ section.title }}</span>
            <Handle
              :id="`section-${section.id}-target`"
              type="target"
              position="left"
              class="handle-gold"
            />
          </div>

          <!-- Child rows -->
          <div v-if="expandedSections.has(section.id)" class="section-rows">
            <div v-for="(row, rIndex) in section.rows"
                 :key="`${section.id}-row-${rIndex}`"
                 class="row-button">
              <span>{{ row.title }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>