<script>
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
//import { QuillEditor } from 'vue-quill-editor'
//import 'quill/dist/quill.core.css'
//import 'quill/dist/quill.snow.css'
//import 'quill/dist/quill.bubble.css'

export default {
  components: {
    QuillEditor
  }
}
</script>

<template>
  <QuillEditor theme="snow" />
</template>